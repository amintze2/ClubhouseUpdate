## ADDED Requirements

### Requirement: Migration scripts read from old project and write to new project
Each migration script SHALL connect to the old Supabase project using `OLD_SUPABASE_URL` and `OLD_SUPABASE_SERVICE_ROLE_KEY`, and to the new project using `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Both env vars SHALL be validated at script startup — missing vars SHALL cause an immediate exit with a clear error message.

#### Scenario: Missing env var fails fast
- **WHEN** a migration script is run without `OLD_SUPABASE_URL` set
- **THEN** the script exits immediately with an error listing the missing variable

### Requirement: Teams migration copies the teams table
`migrate-teams.ts` SHALL upsert all rows from the old `teams` table into the new `teams` table, matching on `team_name`.

#### Scenario: Teams upserted without duplicates
- **WHEN** the script runs a second time
- **THEN** no duplicate team rows are created

### Requirement: Users migration maps role and team
`migrate-users.ts` SHALL map `user_role` text values to the `user_role` enum (`clubhouse_manager`, `general_manager`, `player`) and `user_team` to `team_id`, upserted on `slugger_user_id`. Rows with unrecognised role values SHALL be logged and skipped.

#### Scenario: Valid role is mapped
- **WHEN** old user has `user_role = 'clubhouse_manager'`
- **THEN** new user row has `role = 'clubhouse_manager'`

#### Scenario: Unknown role is skipped
- **WHEN** old user has an unrecognised `user_role` value
- **THEN** the row is logged as skipped and the script continues

### Requirement: Games migration renames date/time columns
`migrate-games.ts` SHALL copy all rows, mapping `date → game_date` and `time → game_time`, upserted on `(home_team_id, away_team_id, game_date)`.

#### Scenario: Columns renamed correctly
- **WHEN** the games script runs
- **THEN** all old `date` values appear as `game_date` in the new table

### Requirement: Tasks migration splits repeating and one-off tasks
`migrate-tasks.ts` SHALL insert rows where `is_repeating = false` into `tasks` and rows where `is_repeating = true` into `recurring_tasks`. For one-off tasks, `task_type` integer SHALL be mapped: `null → 'all'`, `1 → 'game_day'`, `2 → 'off_day'`. For recurring tasks, `repeating_day` SHALL be mapped: `0 → 'off_day'`, `null → 'game_day'`. Both tables are truncated before insert.

#### Scenario: One-off tasks land in tasks table
- **WHEN** old task has `is_repeating = false`
- **THEN** a row is created in `tasks`, not `recurring_tasks`

#### Scenario: Recurring tasks land in recurring_tasks table
- **WHEN** old task has `is_repeating = true`
- **THEN** a row is created in `recurring_tasks`, not `tasks`

#### Scenario: task_type null maps to visibility all
- **WHEN** old task has `task_type = null`
- **THEN** new task has `visibility = 'all'`

### Requirement: Inventory migration maps category and derives stock_status
`migrate-inventory.ts` SHALL map `inventory_type` text to `inventory_category` enum and derive `stock_status` from `current_stock` vs `required_stock`: `current_stock >= required_stock → 'stocked'`, `current_stock > 0 → 'low'`, `current_stock = 0 → 'out'`. Table is truncated before insert.

#### Scenario: Stock status derived from quantities
- **WHEN** old item has `current_stock = 0`
- **THEN** new item has `stock_status = 'out'`

#### Scenario: Unknown inventory_type is skipped
- **WHEN** old item has an unrecognised `inventory_type`
- **THEN** the row is logged as skipped

### Requirement: Meals migration copies with minimal transformation
`migrate-meals.ts` SHALL copy all rows from the old `meals` table. Table is truncated before insert.

#### Scenario: All meal rows present after migration
- **WHEN** the meals script runs
- **THEN** the new `meals` table has the same row count as the old table

### Requirement: Player data migration copies preferences and restrictions
`migrate-player-data.ts` SHALL copy `player_preferences` and `player_restrictions` tables. Both tables are truncated before insert.

#### Scenario: Restrictions preserved
- **WHEN** old player has dietary restrictions
- **THEN** the same restrictions appear in the new table

### Requirement: Messages migration copies conversations, participants, and messages
`migrate-messages.ts` SHALL copy `conversations`, `conversation_participants`, and `messages` tables in order, mapping old `user_id` integer FKs to new `users.id` via the `slugger_user_id` lookup built during users migration. Tables are truncated before insert in reverse FK order (messages → participants → conversations).

#### Scenario: FK references resolve correctly
- **WHEN** old message has `sender_id` referencing old user
- **THEN** new message `sender_id` references the corresponding new user

### Requirement: Issues migration copies issues and comments, preserving NULL authors
`migrate-issues.ts` SHALL copy `issues` and `issue_comments`. All migrated issues SHALL have `routed_to = 'clubhouse_manager'`. Issue comments SHALL be copied with `user_id = NULL` (old app had no author tracking). Tables are truncated before insert.

#### Scenario: Migrated issues have routed_to set
- **WHEN** any old issue is migrated
- **THEN** the new row has `routed_to = 'clubhouse_manager'`

#### Scenario: Comment user_id is NULL
- **WHEN** old issue comment is migrated
- **THEN** new comment has `user_id = NULL`

### Requirement: Orchestrator runs all scripts in dependency order
`migrate-all.ts` SHALL execute all nine scripts in order: teams → users → games → tasks → inventory → meals → player-data → messages → issues. If any script throws, the orchestrator SHALL log the error and stop — it SHALL NOT continue to dependent scripts.

#### Scenario: Failure halts dependent scripts
- **WHEN** the users script fails
- **THEN** games, tasks, and all subsequent scripts are not run

### Requirement: Validation script checks row counts and FK integrity
`validate-migration.ts` SHALL compare row counts between old and new for each migrated table (accounting for expected splits/skips), and spot-check that all FK references in the new DB resolve. It SHALL print a summary table and exit with a non-zero code if any check fails.

#### Scenario: Row count mismatch reported
- **WHEN** the new `teams` table has fewer rows than the old
- **THEN** the validation script reports a mismatch for `teams` and exits non-zero

#### Scenario: All checks pass exits zero
- **WHEN** all row counts and FK checks pass
- **THEN** the validation script exits with code 0 and prints "All checks passed"
