## ADDED Requirements

### Requirement: Dev mode bypasses Slugger and external verification
When `NEXT_PUBLIC_DEV_MODE=true` the Slugger SDK SHALL skip the real postMessage handshake and inject the mock user from env vars (`DEV_USER_ROLE`, `DEV_USER_TEAM`, `DEV_USER_ID`). The bootstrap endpoint SHALL skip Slugger API and Cognito calls and trust the mock payload directly. Both bypasses SHALL be unreachable when `NEXT_PUBLIC_DEV_MODE` is not `"true"`.

#### Scenario: Dev mode skips real handshake
- **WHEN** `NEXT_PUBLIC_DEV_MODE=true` and no `SLUGGER_AUTH` message is received within the timeout
- **THEN** the SDK auto-injects the mock user from env vars instead of showing an auth error

#### Scenario: Dev mode disabled in production
- **WHEN** `NEXT_PUBLIC_DEV_MODE` is unset or not `"true"`
- **THEN** the dev bypass code paths are not executed under any circumstances

### Requirement: Dev harness mimics Slugger parent window
`scripts/dev-harness.html` SHALL embed the widget in an iframe, listen for `SLUGGER_WIDGET_READY`, and respond with a `SLUGGER_AUTH` message matching the exact payload shape Slugger sends. It SHALL provide controls to switch role, team, and user without reloading the page.

#### Scenario: Harness sends correct auth payload
- **WHEN** the widget sends `SLUGGER_WIDGET_READY`
- **THEN** the harness responds with a `SLUGGER_AUTH` message containing `bootstrapToken`, `user.id`, `user.email`, `user.firstName`, `user.lastName`, `user.role`, `user.teamId`, and `expiresAt`

#### Scenario: Role switch reloads widget with new auth
- **WHEN** a developer clicks a different role button in the harness
- **THEN** the iframe reloads and the widget receives a new `SLUGGER_AUTH` with the selected role's mock user

### Requirement: Dev toolbar allows live user switching
A floating dev toolbar SHALL appear at the bottom of the screen when `NEXT_PUBLIC_DEV_MODE=true`. It SHALL display the current user's name and role, and provide a dropdown to switch to any seeded user. Switching SHALL re-run the full auth flow without a page reload.

#### Scenario: Toolbar visible in dev mode
- **WHEN** `NEXT_PUBLIC_DEV_MODE=true` and a user is authenticated
- **THEN** a floating toolbar is visible at the bottom of every app page

#### Scenario: Toolbar hidden in production
- **WHEN** `NEXT_PUBLIC_DEV_MODE` is not `"true"`
- **THEN** no dev toolbar is rendered anywhere in the app

#### Scenario: User switch triggers re-auth
- **WHEN** a developer selects a different user from the toolbar dropdown
- **THEN** the auth state is cleared and the bootstrap flow runs with the new mock user's credentials

### Requirement: Seed data covers all roles and edge cases
`supabase/seed.sql` SHALL insert teams, users, games, recurring tasks, one-off tasks, inventory items, meals, contacts, messages, and issues covering all roles and meaningful edge cases. Today's date SHALL be a game day for at least one team.

#### Scenario: Seed produces a game-day for team 1 today
- **WHEN** `supabase db reset` runs
- **THEN** team 1 has a home game on `CURRENT_DATE`, so the Daily Checklists view shows game-day sections

#### Scenario: Seed covers all three roles
- **WHEN** a developer uses the dev toolbar to switch between roles
- **THEN** each role has at least one seeded user with relevant data visible

### Requirement: One-command dev setup
`scripts/dev-setup.sh` SHALL take a developer from a fresh clone to a running app in under 3 minutes, given Docker and Supabase CLI are installed. It SHALL install dependencies, start Supabase, apply migrations, seed data, and write `.env.local`.

#### Scenario: Setup script produces working environment
- **WHEN** `bash scripts/dev-setup.sh` runs on a clean clone
- **THEN** `npm run dev` starts successfully and the dev harness can authenticate a mock user
