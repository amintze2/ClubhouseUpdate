## Context

Brand-new Next.js app replacing an existing clubhouse management widget embedded in the Slugger platform via iframe. The old app lives in a separate repo and stays untouched. This rebuild starts from zero in the current repo — no existing source files to work around.

Infrastructure decisions made here affect every subsequent stage. The schema and migration structure are especially load-bearing: once feature stages are built on top of them, changing table names or column shapes is expensive.

No active users. No production risk during this stage. All work is local (`supabase start` + `npm run dev`). Vercel cutover happens at Stage 8.

## Goals / Non-Goals

**Goals:**
- A working Next.js project that deploys to Vercel
- A complete, version-controlled Supabase schema (all tables, enums, indexes, RLS policies) runnable via `supabase db reset`
- A tested series derivation utility
- A games import script

**Non-Goals:**
- Any UI, pages, or components
- Auth implementation (Stage 1b)
- Seed data (Stage 1b)
- Migration of old data (Stage 8)

## Decisions

### 1. Supabase migration files as schema source of truth

Schema lives in `supabase/migrations/` as numbered SQL files, not in the Supabase dashboard editor.

**Why:** Changes are version-controlled and reproducible. `supabase db reset` applies them from scratch locally. `supabase db push` deploys to production. The dashboard editor is a black box — changes made there aren't tracked in git and can't be reproduced by another developer.

**Alternative considered:** Schema editor in Supabase dashboard. Rejected: not reproducible, not diffable, not reviewable.

Migration file order:
```
00001_enums.sql
00002_teams.sql
00003_users.sql
00004_games.sql
00005_tasks.sql
00006_inventory.sql
00007_meals.sql
00008_contacts.sql
00009_messaging.sql
00010_issues.sql
00011_rls_policies.sql
```
Enums first (referenced by table columns), then tables in foreign key dependency order, RLS last (requires tables to exist).

### 2. Series derivation as a pure TypeScript function, not a SQL function

`lib/series.ts` takes a `Game[]` array and returns `Series[]`. No database call inside the function.

**Why:** Pure functions are trivially testable with a script or test framework — no DB connection needed. The gap threshold (`maxGapDays`) can be changed as a constant in one place without a schema migration. Can be called from any context (API route, client component, test).

**Alternative considered:** Postgres function. Rejected: harder to unit test, threshold change requires a migration, adds schema complexity.

**Signature:**
```typescript
type Series = {
  opponent: { id: number; team_name: string }
  games: Game[]
}

function seriesFromGames(
  games: Game[],
  options?: { maxGapDays?: number }
): Series[]
```

Default `maxGapDays: 1`. Override to `2` if ALPB schedules include off days mid-series.

**Double header handling:** Same-day games (same home/away teams, same date) are treated as gap = 0, so they always group into the same series.

### 3. Hand-written TypeScript types over generated types

Types in `lib/types.ts` are written by hand, mirroring the schema.

**Why:** `supabase gen types typescript` requires a running and populated DB. At this stage we're building the schema — the generated types can't exist before the tables do. Hand-written types are fast to produce and sufficient for the initial build.

**Migration path:** Once the schema is stable post-Stage 8, switch to generated types via `supabase gen types typescript --local > lib/database.types.ts` and update imports. This is a mechanical refactor, not an architecture change.

### 4. RLS policies in migrations, not applied separately

All `CREATE POLICY` statements live in `00011_rls_policies.sql`.

**Why:** Policies are part of the schema. Version-controlling them alongside table definitions means a fresh `supabase db reset` produces a fully secured DB, not a secured-only-if-you-remember-to-run-the-extra-step DB.

### 5. `is_makeup` flag on the games table

`games` includes `is_makeup boolean NOT NULL DEFAULT false`.

**Why:** Postponed/rescheduled games have a different character than scheduled games. The series algorithm doesn't use this flag now, but it's available for display (calendar badge), future filtering, or series logic adjustments without a schema migration.

Cost: one boolean column. Zero downside.

## Risks / Trade-offs

**Migration ordering breaks on FK violations** → Mitigation: table order in migrations follows FK dependency graph (enums → teams → users → games → ...). Write a smoke test: `supabase db reset` must complete with no errors.

**RLS policy gaps expose data across teams** → Mitigation: After applying migrations, run a manual smoke test: create two users in different teams, confirm team A cannot read team B's inventory or tasks. Document this as a required acceptance criterion.

**Series algorithm wrong for real schedule data** → Mitigation: The `maxGapDays` parameter is a single constant, adjustable without a code change. Before Stage 4 (meal planning), validate the algorithm against actual ALPB schedule exports.

**Hand-written types drift from schema** → Mitigation: Accepted trade-off for now. Types are reviewed as part of any schema migration PR. Will switch to generated types at Stage 8.

## Migration Plan

This stage is entirely local. No production changes.

1. `npm install` — install dependencies
2. `supabase start` — start local Postgres + Auth + Realtime via Docker
3. `supabase db reset` — apply all migrations + verify clean run
4. `npm run dev` — verify Next.js starts
5. `vercel deploy` — verify empty shell deploys (Vercel project stays pointed at old repo until Stage 8)

Rollback: nothing to roll back. Local only, old repo untouched.

## Open Questions

None. All decisions resolved during the explore session.
