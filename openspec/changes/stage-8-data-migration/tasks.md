## 1. Setup

- [x] 1.1 Add `OLD_SUPABASE_URL` and `OLD_SUPABASE_SERVICE_ROLE_KEY` placeholders to `.env.local.example` with comments explaining they point at the old Supabase project
- [x] 1.2 Create `scripts/migrate-utils.ts` — shared helpers: `getOldClient()`, `getNewClient()`, `validateEnv(vars: string[])`, `chunkArray(arr, size)`, `logSkipped(table, row, reason)` 

## 2. Migration Scripts

- [x] 2.\1 Create `scripts/migrate-teams.ts` — upsert teams on `team_name`; log count migrated
- [x] 2.\1 Create `scripts/migrate-users.ts` — map `user_role` text → enum, `user_team` → `team_id`; upsert on `slugger_user_id`; log skipped rows with unrecognised roles
- [x] 2.\1 Create `scripts/migrate-games.ts` — rename `date → game_date`, `time → game_time`; upsert on `(home_team_id, away_team_id, game_date)`
- [x] 2.\1 Create `scripts/migrate-tasks.ts` — split on `is_repeating`; map `task_type` int to `visibility` enum; map `repeating_day` to `visibility`; truncate-then-insert both tables
- [x] 2.\1 Create `scripts/migrate-inventory.ts` — map `inventory_type` → `inventory_category` enum; derive `stock_status` from quantity comparison; truncate-then-insert
- [x] 2.\1 Create `scripts/migrate-meals.ts` — copy rows verbatim (minimal transformation); truncate-then-insert
- [x] 2.\1 Create `scripts/migrate-player-data.ts` — copy `player_preferences` and `player_restrictions`; truncate-then-insert both
- [x] 2.\1 Create `scripts/migrate-messages.ts` — build user ID map from slugger_user_id; truncate-then-insert conversations → participants → messages in order; batch in 500-row chunks
- [x] 2.\1 Create `scripts/migrate-issues.ts` — copy issues (set `routed_to = 'clubhouse_manager'`) and issue_comments (keep `user_id = NULL`); truncate-then-insert

## 3. Orchestrator and Validation

- [x] 3.1 Create `scripts/migrate-all.ts` — run all 9 scripts in order; halt on first failure; print per-script status and total time
- [x] 3.2 Create `scripts/validate-migration.ts` — compare row counts old vs new for each table; spot-check FK integrity (sample 50 random messages, verify sender_id exists in users); print summary table; exit non-zero on any failure

## 4. Documentation

- [x] 4.1 Add a `## Running the Migration` section to the project `README.md` (or create `scripts/README.md` if no top-level README exists) — document the two env vars, run order, and cutover steps
