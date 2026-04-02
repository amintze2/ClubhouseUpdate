## Why

The new app is built on a redesigned schema. Before cutover, all live data in the old Supabase project must be migrated to the new schema so the old app can be turned off and users continue with their existing tasks, inventory, meals, messages, and history intact.

## What Changes

- New `scripts/` directory with one TypeScript migration script per table group
- A `scripts/migrate-all.ts` runner that executes scripts in dependency order and reports results
- A `scripts/validate-migration.ts` that checks row counts, spot-checks FK integrity, and verifies enum mappings
- `.env.local.example` updated with `OLD_SUPABASE_URL` and `OLD_SUPABASE_SERVICE_ROLE_KEY` placeholders
- No changes to the app, schema, or seed data

## Capabilities

### New Capabilities
- `data-migration`: Nine migration scripts (teams, users, games, tasks, inventory, meals, player-data, messages, issues) plus an orchestrator runner and a validation script

### Modified Capabilities
- (none)

## Impact

- New files only: `scripts/migrate-*.ts`, `scripts/migrate-all.ts`, `scripts/validate-migration.ts`
- Requires two environment variables pointing at the old Supabase project (read-only source)
- Run once, manually, against the production new-schema database before cutover
- No app code changes
