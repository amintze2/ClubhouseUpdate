# Scripts

## Running the Migration (Stage 8)

These scripts migrate all live data from the old Supabase project to the new schema.
Run them **once**, during a maintenance window, before cutover.

### Prerequisites

1. Add the old Supabase project credentials to `.env.local`:

   ```
   OLD_SUPABASE_URL=https://your-old-project.supabase.co
   OLD_SUPABASE_SERVICE_ROLE_KEY=your-old-service-role-key
   ```

   The new project credentials (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
   should already be set for local dev.

2. Confirm the new project database is in the expected state (schema applied, seed data cleared
   or acceptable to overwrite).

### Run the migration

```bash
npx tsx scripts/migrate-all.ts
```

Scripts run in dependency order:

1. teams
2. users
3. games
4. tasks + recurring_tasks
5. inventory
6. meals
7. player data (preferences + restrictions)
8. messages (conversations + participants + messages)
9. issues + issue_comments

If any step fails, the run halts. Fix the error and re-run — all scripts are safe to
re-run (truncate-then-insert or upsert on natural keys).

### Validate

```bash
npx tsx scripts/validate-migration.ts
```

Compares row counts between old and new for each table, and spot-checks FK integrity.
Exits non-zero if any check fails. Review the printed table before proceeding to cutover.

### Cutover

Once validation passes:

1. In Vercel, update environment variables to point at the new Supabase project
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
   `SUPABASE_JWT_SECRET`)
2. Redeploy the Vercel project
3. Smoke test the live app (log in, check checklists, messages, player data)
4. Set the old Supabase project to read-only or pause it

---

## Other Scripts

| Script | Usage |
|--------|-------|
| `import-games.ts` | Import game schedule from JSON or CSV |
| `smoke-test-rls.ts` | Verify RLS policies against test users |
| `test-series.ts` | Test series derivation logic |
| `dev-setup.sh` | One-time local dev environment setup |
