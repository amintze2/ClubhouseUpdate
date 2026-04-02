## ADDED Requirements

### Requirement: All enums defined
The database SHALL define all required Postgres enums before any table creation: `user_role`, `task_visibility`, `game_day_period`, `task_category`, `inventory_category`, `stock_status`, `issue_status`, `conversation_type`.

#### Scenario: Enums exist after migration
- **WHEN** `supabase db reset` completes
- **THEN** all eight enums exist in the `public` schema and reject invalid values at the DB level

### Requirement: All tables created with correct structure
The database SHALL contain all sixteen tables with columns, types, constraints, and indexes matching the rebuild plan schema. Foreign key constraints SHALL enforce referential integrity.

#### Scenario: Schema applies from scratch
- **WHEN** `supabase db reset` runs against an empty database
- **THEN** all migrations apply in order with no errors and all sixteen tables exist

#### Scenario: Foreign key constraints enforced
- **WHEN** an insert references a non-existent foreign key (e.g., a task with a user_id that doesn't exist)
- **THEN** the database rejects the insert with a foreign key violation error

#### Scenario: Games table includes makeup flag
- **WHEN** a game row is inserted without specifying `is_makeup`
- **THEN** `is_makeup` defaults to `false`

### Requirement: All indexes created
The database SHALL create all indexes defined in the rebuild plan to support the query patterns of each module.

#### Scenario: Indexes exist after migration
- **WHEN** migrations complete
- **THEN** the following indexes exist: `idx_games_home_team_date`, `idx_games_date`, `idx_tasks_user_date`, `idx_recurring_tasks_user`, `idx_rtc_date`, `idx_inventory_team`, `idx_contacts_team`, `idx_messages_conversation`, `idx_issues_team`, `idx_issue_comments_issue`

### Requirement: Row Level Security enabled and policies applied
Every table SHALL have RLS enabled. Policies SHALL enforce team-scoped or user-scoped access as defined below. No user SHALL be able to read or write another team's data.

#### Scenario: Tasks are user-scoped
- **WHEN** a user queries the `tasks` table
- **THEN** only rows where `user_id` matches `auth.uid()` are returned

#### Scenario: Inventory is team-scoped
- **WHEN** a user queries `inventory_items`
- **THEN** only rows where `team_id` matches the user's team are returned

#### Scenario: Cross-team data is blocked
- **WHEN** a user from team A queries inventory with team B's `team_id`
- **THEN** zero rows are returned and no error is raised (RLS silently filters)

#### Scenario: Players cannot read other players' issues
- **WHEN** a player queries the `issues` table
- **THEN** only issues they submitted (`player_id = auth.uid()`) are returned

#### Scenario: Messages scoped to conversation participants
- **WHEN** a user queries `messages`
- **THEN** only messages in conversations where they are a participant are returned

### Requirement: Migrations are version-controlled and reproducible
All schema SQL SHALL live in numbered migration files under `supabase/migrations/`. Running `supabase db reset` SHALL produce an identical database from scratch on any machine.

#### Scenario: Fresh reset produces complete schema
- **WHEN** a developer clones the repo and runs `supabase db reset`
- **THEN** all tables, enums, indexes, and RLS policies exist with no manual steps required
