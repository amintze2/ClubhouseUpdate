## 1. Project Scaffolding

- [x] 1.1 Initialize Next.js 14 project with App Router, TypeScript strict mode, Tailwind CSS, and ESLint (`npx create-next-app@latest`)
- [x] 1.2 Create folder structure: `/app/api`, `/app/(app)`, `/lib/api`, `/components/ui`, `/components/layout`, `/scripts`, `/supabase/migrations`
- [x] 1.3 Install Supabase JS client (`@supabase/supabase-js`) and add environment variable placeholders to `.env.local.example`
- [x] 1.4 Write `lib/supabase.ts` — client factory that accepts an optional JWT and injects it as the Authorization header
- [x] 1.5 Add `vercel.json` with basic Vercel config and confirm `vercel deploy` succeeds with the empty shell
- [x] 1.6 Verify `npm run dev` starts on port 3000 and Tailwind renders a test class

## 2. TypeScript Types

- [x] 2.1 Write `lib/types.ts` with interfaces for all 16 tables: Team, User, Game, Task, RecurringTask, RecurringTaskCompletion, InventoryItem, Meal, PlayerPreference, PlayerRestriction, Contact, Conversation, ConversationParticipant, Message, Issue, IssueComment
- [x] 2.2 Add TypeScript union types for all 8 Postgres enums: `UserRole`, `TaskVisibility`, `GameDayPeriod`, `TaskCategory`, `InventoryCategory`, `StockStatus`, `IssueStatus`, `ConversationType`

## 3. Database Migrations

- [x] 3.1 Write `supabase/migrations/00001_enums.sql` — all 8 enums
- [x] 3.2 Write `supabase/migrations/00002_teams.sql` — `teams` table
- [x] 3.3 Write `supabase/migrations/00003_users.sql` — `users` table with FK to teams
- [x] 3.4 Write `supabase/migrations/00004_games.sql` — `games` table with `is_makeup` flag and both FK to teams, plus date/home_team indexes
- [x] 3.5 Write `supabase/migrations/00005_tasks.sql` — `tasks`, `recurring_tasks`, `recurring_task_completions` tables with indexes
- [x] 3.6 Write `supabase/migrations/00006_inventory.sql` — `inventory_items` table with team index
- [x] 3.7 Write `supabase/migrations/00007_meals.sql` — `meals`, `player_preferences`, `player_restrictions` tables
- [x] 3.8 Write `supabase/migrations/00008_contacts.sql` — `contacts` table with team index
- [x] 3.9 Write `supabase/migrations/00009_messaging.sql` — `conversations`, `conversation_participants`, `messages` tables with message index
- [x] 3.10 Write `supabase/migrations/00010_issues.sql` — `issues`, `issue_comments` tables with team and comment indexes
- [x] 3.11 Confirm `supabase db reset` applies all migrations with no errors

## 4. Row Level Security

- [x] 4.1 Write `supabase/migrations/00011_rls_policies.sql` — enable RLS on all 16 tables
- [x] 4.2 Add policies for user-scoped tables: `tasks`, `recurring_tasks`, `recurring_task_completions` (user can only read/write own rows)
- [x] 4.3 Add policies for team-scoped tables: `inventory_items`, `contacts`, `meals` (scoped to user's team_id)
- [x] 4.4 Add policies for messages: users can only read messages in conversations they participate in
- [x] 4.5 Add policies for issues: CMs see team issues, GMs see team issues read-only, players can only create and read their own
- [x] 4.6 Add policies for player data: players read/write own `player_preferences` and `player_restrictions`; CMs read all on their team
- [x] 4.7 Smoke test: create two users in different teams, confirm team A cannot read team B's inventory items

## 5. Series Derivation

- [x] 5.1 Write `lib/series.ts` with `seriesFromGames(games: Game[], options?: { maxGapDays?: number }): Series[]`
- [x] 5.2 Implement grouping logic: consecutive home games vs. same opponent, gap ≤ maxGapDays (default 1), same-day = gap 0
- [x] 5.3 Ensure games within each series are sorted by game_date ascending, then game_time ascending
- [x] 5.4 Write `scripts/test-series.ts` — runnable test script covering: normal series, gap split, gap within threshold, double header, away games excluded, unsorted input
- [x] 5.5 Run test script and confirm all scenarios pass

## 6. Games Import Script

- [x] 6.1 Write `scripts/import-games.ts` — accepts a file path argument, reads CSV or JSON
- [x] 6.2 Implement team name/ID lookup against the `teams` table
- [x] 6.3 Implement duplicate check (same home_team_id + away_team_id + game_date) — skip with warning on match
- [x] 6.4 Implement per-row error handling — log failures with row index, continue processing
- [x] 6.5 Run against sample data file and confirm correct insert count and output
