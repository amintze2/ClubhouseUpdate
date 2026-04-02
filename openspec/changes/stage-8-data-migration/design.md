## Context

The old Supabase project holds live data from the current app. The new project has a completely redesigned schema (new column names, enums, new tables, removed tables). Scripts read from the old project using the service role key and write to the new project using the new project's service role key. Neither app is modified — this is a one-time ETL operation.

Old schema reference lives in the plan (`clubhouse-rebuild-plan.md` §13) and the old Supabase project directly. Key divergences:

| Old | New | Change |
|-----|-----|--------|
| `user.user_role` text | `users.role` enum | cast string to enum |
| `user.user_team` | `users.team_id` | rename |
| `games.date` / `games.time` | `games.game_date` / `games.game_time` | rename |
| `tasks.is_repeating` bool | split into `tasks` / `recurring_tasks` | split |
| `tasks.task_type` int (null/1/2) | `tasks.visibility` enum | map |
| `tasks.repeating_day` int (0/null) | `recurring_tasks.visibility` enum | map |
| `inventory.inventory_type` text | `inventory_items.category` enum | cast |
| `inventory.current_stock` vs `required_stock` | `inventory_items.stock_status` enum | derive |
| `issues.issue_comments.user_id` NULL | `issue_comments.user_id` — no author in old data | keep NULL on import |

## Goals / Non-Goals

**Goals:**
- Migrate all live data with no data loss
- All FK relationships intact after migration
- Enum mappings verified before and after
- Scripts are idempotent (safe to re-run: upsert on natural keys where possible, else truncate-then-insert)

**Non-Goals:**
- Migrating dev/test data (scripts target production only)
- Reverse migration (old app stays read-only after cutover)
- Automating cutover (DNS/Vercel env var swap is a manual step)

## Decisions

### TypeScript scripts with `@supabase/supabase-js`, run via `tsx`
**Why:** Consistent with the rest of the codebase. `tsx` lets us run `.ts` files directly without a build step. No new dependencies beyond what's already in `devDependencies`.

### Read from OLD, write to NEW via service role clients
**Why:** Service role bypasses RLS on both ends. Migrations run outside the app, not through the API routes.

### Run order enforced by `migrate-all.ts`
**Why:** FK constraints require teams and users to exist before anything that references them. Order: teams → users → games → tasks → inventory → meals → player-data → messages → issues.

### Idempotency via `upsert` on natural keys
**Why:** If a script crashes mid-run, re-running it should not create duplicates.
- teams: upsert on `team_name`
- users: upsert on `slugger_user_id`
- games: upsert on `(home_team_id, away_team_id, game_date)`
- tasks / recurring_tasks: truncate-then-insert (no safe natural key; acceptable since this runs once in a maintenance window)
- inventory, meals, contacts, messages, issues: truncate-then-insert

### issue_comments with NULL user_id
**Decision:** Old app never stored comment authors. Import comment rows with `user_id = NULL`. The new app enforces authorship for all NEW comments at the application layer, so historical NULLs are acceptable.

## Risks / Trade-offs

- **Old schema drift**: If the old DB has columns not documented in the plan, scripts may silently skip them. Mitigation: validate row counts after each script.
- **Large datasets**: `messages` and `tasks` tables could be large. Scripts batch in chunks of 500 rows.
- **Enum mismatches**: If old data has values not in the documented set, scripts log and skip the row rather than failing. Validation script reports skipped counts.

## Migration Plan

1. Set `OLD_SUPABASE_URL` and `OLD_SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (pointing at old project)
2. Confirm new project DB is empty (or acceptable to overwrite)
3. Run: `npx tsx scripts/migrate-all.ts`
4. Run: `npx tsx scripts/validate-migration.ts` — review output
5. Manual cutover: update Vercel env vars to point at new Supabase project, redeploy
6. Smoke test the live app
7. Set old Supabase project to read-only / pause it
