# Clubhouse Management Widget — From-Scratch Rebuild Plan

> A task-level blueprint for Claude Code. Each module specifies schema, API layer, UI, and acceptance criteria. Designed so modules can be built and tested independently, then wired together.

---

## 0. Architecture & Stack Decisions

### Deployment
- **Vercel** — same deployment URL, cannot change

### Recommended Stack
- **Framework:** Next.js (App Router) — first-class Vercel support, server components for the auth bootstrap, API routes replace standalone serverless functions
- **Database:** Supabase (Postgres + Row Level Security + Realtime)
- **Styling:** Tailwind CSS — utility-first, responsive out of the box (critical since managers use both phones and desktops)
- **State management:** React context + hooks (no Redux — Supabase handles persistence, local state is minimal)
- **Auth:** Keep the existing iframe postMessage → bootstrap token → Supabase JWT flow (locked by Slugger)
- **Realtime:** Supabase Realtime channels for messages and player reports

### Responsive Design Requirement
Clubhouse managers use a mix of phones, tablets, and desktops. Every view must be fully usable at 375px width. Design mobile-first, enhance for desktop. The sidebar should collapse to a bottom tab bar or hamburger on mobile.

### What We're Cutting
- **Budget tab** — removed from scope
- **Template tasks (React-only state)** — replaced by persisted recurring tasks (see Module 4)

### What's Blocked
- **Player report routing to field manager** — waiting on Rick White to confirm how field managers appear in Slugger. The plan includes a pluggable routing layer so this can be added without rearchitecting. For v1, reports go to clubhouse managers as before with a flag noting this will change.

---

## 1. Project Scaffolding

### Task
Set up the Next.js project with Supabase client, Tailwind, folder structure, and Vercel config.

### Structure
```
/app
  /api
    /auth/bootstrap/route.ts    ← Slugger token exchange
  /(app)                        ← authenticated app shell
    /layout.tsx                 ← sidebar + contact bar + auth gate
    /checklists/page.tsx
    /calendar/page.tsx
    /recurring-tasks/page.tsx
    /inventory/page.tsx
    /meals/page.tsx
    /messages/page.tsx
    /reports/page.tsx
    /player-info/page.tsx
    /player-meals/page.tsx
    /player-report/page.tsx
    /onboarding/page.tsx
/lib
  /supabase.ts                  ← client factory (injects JWT)
  /auth-context.tsx             ← AuthProvider, useAuth hook
  /types.ts                     ← shared TypeScript types
  /api/                         ← per-table CRUD modules
/components
  /ui/                          ← shared primitives (button, dialog, badge, etc.)
  /layout/                      ← sidebar, contact bar, mobile nav
  /checklists/
  /calendar/
  /inventory/
  /meals/
  /messages/
  /reports/
  /onboarding/
```

### Acceptance Criteria
- `npm run dev` starts locally
- `vercel deploy` succeeds
- Supabase client connects (with a test query)
- Tailwind classes render

---

## 2. Database Schema (Complete Redesign)

### Task
Create all tables from scratch in Supabase. Write an import script for the existing games data. Set up Row Level Security policies.

### Design Decisions vs. Old Schema
- **`task_type` is now an enum**, not a magic integer
- **Recurring task completions are persisted** (new `recurring_task_completions` table)
- **Template tasks are eliminated** — recurring tasks replace them entirely
- **`issue_comments` now tracks who wrote the comment**
- **`issues` has routing columns** for the upcoming field manager flow
- **Series are derived, not stored** — consecutive home games against the same opponent form a series (computed at query time via a SQL function or app-layer grouping). This avoids a manual `series_id` that someone has to maintain.
- **Contacts table is new**
- **Budget table removed** (was derived from inventory anyway)

### Full Schema

```sql
-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('clubhouse_manager', 'general_manager', 'player');

-- Controls when a task is visible
-- 'all' = always show on its date
-- 'game_day' = only show when the team has a home game
-- 'off_day' = only show when the team does NOT have a home game
CREATE TYPE task_visibility AS ENUM ('all', 'game_day', 'off_day');

-- For game-day tasks, which section they appear in
CREATE TYPE game_day_period AS ENUM ('morning', 'pre_game', 'post_game');

CREATE TYPE task_category AS ENUM (
  'sanitation', 'laundry', 'food', 'equipment',
  'field', 'admin', 'medical', 'general'
);

CREATE TYPE inventory_category AS ENUM (
  'laundry_cleaning', 'hygiene_personal', 'medical_safety',
  'equipment_field', 'food_beverage', 'miscellaneous'
);

-- Simplified stock status for the checklist UI
CREATE TYPE stock_status AS ENUM ('stocked', 'low', 'out');

CREATE TYPE issue_status AS ENUM ('new', 'in_progress', 'resolved');

CREATE TYPE conversation_type AS ENUM ('direct', 'group', 'bulletin');

-- ============================================================
-- CORE TABLES
-- ============================================================

-- Teams
-- Pre-populated from league data. Rows are reference data, not user-managed.
CREATE TABLE teams (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  team_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Users
-- Created via the Slugger auth bootstrap flow.
-- slugger_user_id is the unique identifier from Slugger's payload.
CREATE TABLE users (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slugger_user_id text UNIQUE NOT NULL,
  user_name text,
  email text,
  role user_role NOT NULL,
  team_id bigint NOT NULL REFERENCES teams(id),
  has_completed_onboarding boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Games
-- Imported from the league schedule export.
-- Series grouping is derived: consecutive home games vs. the same opponent.
CREATE TABLE games (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  home_team_id bigint NOT NULL REFERENCES teams(id),
  away_team_id bigint NOT NULL REFERENCES teams(id),
  game_date date NOT NULL,
  game_time time,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_games_home_team_date ON games(home_team_id, game_date);
CREATE INDEX idx_games_date ON games(game_date);

-- ============================================================
-- TASKS
-- ============================================================

-- One-off tasks: tied to a specific date.
-- Created manually by managers via Daily Checklists or Task Calendar.
CREATE TABLE tasks (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES users(id),
  title text NOT NULL,
  description text,
  task_date date NOT NULL,
  task_time time,
  category task_category NOT NULL DEFAULT 'general',
  visibility task_visibility NOT NULL DEFAULT 'all',
  game_day_period game_day_period,        -- only relevant when visibility = 'game_day'
  is_complete boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_user_date ON tasks(user_id, task_date);

-- Recurring task definitions: no date, repeat every applicable day.
-- Replaces BOTH the old "recurring tasks" and "template tasks."
-- Everything persists to DB — no more React-only state.
CREATE TABLE recurring_tasks (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES users(id),
  title text NOT NULL,
  description text,
  default_time time,
  category task_category NOT NULL DEFAULT 'general',
  visibility task_visibility NOT NULL DEFAULT 'all',  -- 'game_day' or 'off_day'
  game_day_period game_day_period,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_recurring_tasks_user ON recurring_tasks(user_id);

-- Recurring task completions: persisted per day.
-- Solves the old problem where completions reset on page refresh.
CREATE TABLE recurring_task_completions (
  recurring_task_id bigint NOT NULL REFERENCES recurring_tasks(id) ON DELETE CASCADE,
  completion_date date NOT NULL,
  is_complete boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  PRIMARY KEY (recurring_task_id, completion_date)
);

CREATE INDEX idx_rtc_date ON recurring_task_completions(completion_date);

-- ============================================================
-- INVENTORY
-- ============================================================

-- Items are scoped to a team. The full stock-tracking fields remain in the DB
-- (current_stock, par_level) but the default UI is a simplified checklist.
CREATE TABLE inventory_items (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  team_id bigint NOT NULL REFERENCES teams(id),
  item_name text NOT NULL,
  category inventory_category NOT NULL,
  unit text,                              -- e.g., 'bags', 'bottles', 'boxes'
  current_stock integer NOT NULL DEFAULT 0,
  par_level integer NOT NULL DEFAULT 0,   -- recommended minimum
  stock_status stock_status NOT NULL DEFAULT 'stocked',
  price_per_unit numeric(10,2),           -- dollars.cents, not bigint
  purchase_link text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_inventory_team ON inventory_items(team_id);

-- ============================================================
-- MEAL PLANNING
-- ============================================================

CREATE TABLE meals (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  game_id bigint NOT NULL REFERENCES games(id) UNIQUE,
  pre_game_snack text,
  post_game_meal text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Player dietary info (split into two tables for normalization)
CREATE TABLE player_preferences (
  player_id bigint PRIMARY KEY REFERENCES users(id),
  preferred_name text,
  other_details text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE player_restrictions (
  player_id bigint NOT NULL REFERENCES users(id),
  restriction text NOT NULL,
  is_custom boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, restriction)
);

-- ============================================================
-- CONTACTS
-- ============================================================

CREATE TABLE contacts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  team_id bigint NOT NULL REFERENCES teams(id),
  contact_name text NOT NULL,
  contact_role text NOT NULL,     -- free text: 'Head Trainer', 'Field Manager', etc.
  phone text,
  email text,
  notes text,
  display_order integer NOT NULL DEFAULT 0,
  created_by bigint REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_contacts_team ON contacts(team_id);

-- ============================================================
-- MESSAGING
-- ============================================================

CREATE TABLE conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type conversation_type NOT NULL,
  name text,                              -- for group/bulletin display name
  created_by bigint REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE conversation_participants (
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id bigint NOT NULL REFERENCES users(id),
  last_read_at timestamptz,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id bigint NOT NULL REFERENCES users(id),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);

-- ============================================================
-- PLAYER REPORTS (ISSUES)
-- ============================================================

CREATE TABLE issues (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  player_id bigint NOT NULL REFERENCES users(id),
  player_team_id bigint NOT NULL REFERENCES teams(id),
  team_context text NOT NULL CHECK (team_context IN ('home', 'away')),
  away_team_name text,                    -- only set when team_context = 'away'
  description text NOT NULL,
  status issue_status NOT NULL DEFAULT 'new',
  gm_flagged boolean NOT NULL DEFAULT false,

  -- Routing (pluggable for field manager flow)
  -- For now, routed_to defaults to 'clubhouse_manager'.
  -- When Rick White confirms, we add 'field_manager' and update the default.
  routed_to text NOT NULL DEFAULT 'clubhouse_manager',
  routed_by bigint REFERENCES users(id),
  routed_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_issues_team ON issues(player_team_id);

CREATE TABLE issue_comments (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  issue_id bigint NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  user_id bigint REFERENCES users(id),  -- nullable for migrated comments (old app didn't track author)
  comment text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_issue_comments_issue ON issue_comments(issue_id);
```

### Row Level Security Policies (Summary)
Every table needs RLS enabled. Key policies:
- **tasks / recurring_tasks / recurring_task_completions:** user can only read/write their own (`user_id = auth.uid()`)
- **inventory_items / contacts / meals:** scoped to `team_id` matching the user's team
- **messages:** user can only read messages in conversations they participate in
- **issues:** clubhouse managers see issues for their team; GMs see issues for their team (read-only except flag); players can only create, not read others'
- **player_preferences / player_restrictions:** players read/write their own; clubhouse managers read all on their team

### Games Import Script
Write a Node.js script (`scripts/import-games.ts`) that:
1. Reads a CSV/JSON export of the current `games` table
2. Maps old team IDs to new team IDs (or inserts teams first)
3. Inserts into the new `games` table
4. Validates: no duplicate date+home_team+away_team combos

### Series Derivation Function
Create a helper (can be a Postgres function or TypeScript utility) that groups games into series:
```
Given a team_id, return games grouped where:
  - home_team_id = team_id
  - Same away_team_id
  - Consecutive dates (no gap > 1 day between games in the series)
Each group = one series.
```

### Acceptance Criteria
- All tables created in Supabase
- RLS policies applied and tested (a user from team A cannot see team B's data)
- Games imported from existing data
- Series derivation returns correct groupings for test data

---

## 3. Auth Module

### Task
Implement the Slugger iframe auth flow. This is a straight port of the existing logic into Next.js API routes.

### Slugger Platform Interaction (Cannot Be Changed)

This widget runs inside an `<iframe>` embedded in the Slugger platform (alpb-analytics.com). Slugger controls the parent window, user sessions, and the auth payload. The entire auth flow is a contract with Slugger's platform team — **none of the message types, payload shapes, or verification endpoints can change.**

**Step-by-step flow the app must implement exactly:**

1. **Widget → Slugger:** On mount, post `{ type: "SLUGGER_WIDGET_READY", widgetId: "clubhouse-management" }` to `window.parent`. Start a 10-second timeout.

2. **Slugger → Widget:** Slugger responds with a `SLUGGER_AUTH` message containing:
   ```json
   {
     "type": "SLUGGER_AUTH",
     "payload": {
       "bootstrapToken": "<signed token>",
       "user": {
         "id": "42",
         "email": "user@example.com",
         "firstName": "Jane",
         "lastName": "Doe",
         "role": "league",
         "teamId": "5",
         "isAdmin": false
       },
       "expiresAt": 1234567890000
     }
   }
   ```
   **Origin check:** Validate `event.origin` against the allowlist (`alpb-analytics.com`, the Slugger staging ALB domain). Silently drop messages from unknown origins.

3. **Widget → Slugger API:** Our serverless function (`/api/auth/bootstrap`) calls Slugger's own API to verify identity:
   ```
   GET https://alpb-analytics.com/api/users/me
   Authorization: Bearer <bootstrapToken>
   ```
   If Slugger returns 200 → that's the authoritative user identity.

4. **Fallback A — use payload.user directly:** If Slugger's API returns non-200 (e.g., their endpoint is down), use the `user` object from the `SLUGGER_AUTH` payload as-is. This is why both the token and the user object are sent together — the user object is the safety net.

5. **Fallback B — Cognito JWT validation:** Last resort if neither of the above works. Decode the bootstrapToken as a Cognito RS256 JWT, fetch Cognito's public JWKS to verify the signature, then call `Cognito.GetUser` for name/email.

6. **Our backend → Supabase:** Once identity is confirmed via any path, upsert the user in our `users` table (keyed on `slugger_user_id`), sign a Supabase JWT, and return it to the client.

**What each Slugger payload field maps to:**

| Slugger Field | Used For | Stored As |
|---|---|---|
| `bootstrapToken` | Bearer token sent to `GET /api/users/me` | Never stored — used once and discarded |
| `user.id` | Unique identifier from Slugger | `users.slugger_user_id` |
| `user.firstName + lastName` | Display name | `users.user_name` |
| `user.email` | Fallback display name | `users.email` |
| `user.role` | Determines app experience (CM/GM/player) | Mapped via `mapSluggerRole()` → `users.role` |
| `user.teamId` | Team scoping for all data | Looked up → `users.team_id` |
| `user.isAdmin` | Passed through | Not currently used for access control |
| `expiresAt` | Token lifetime | Not enforced client-side |

### Components

**`/app/api/auth/bootstrap/route.ts`** — POST endpoint
- Receives `{ token, sluggerUser }` from the client SDK
- Runs the three-step verification chain (Slugger API → payload fallback → Cognito fallback)
- Resolves `sluggerUserId` and `userName` from whichever verification path succeeded
- Upserts user in `users` table by `slugger_user_id` (insert if new, update name if changed)
- Resolves team name from `sluggerUser.teamId` against `teams` table
- Signs a Supabase JWT: `{ sub: <db user id>, team_id: <team id>, role: "authenticated", iss: "supabase" }`
- Returns `{ user: <full db row + team_name>, session: { access_token: <jwt>, refresh_token: "", expires_in: 3600 } }`

**`/lib/slugger-sdk.ts`** — postMessage handshake
- On mount: sends `SLUGGER_WIDGET_READY` to `window.parent`
- Registers a `message` event listener
- Validates `event.origin` against the allowlist — silently drops unknown origins
- On receiving `SLUGGER_AUTH`: extracts payload, calls the `onAuth` callback
- 10-second timeout: if no `SLUGGER_AUTH` received, calls `onAuthError`

**`/lib/auth-context.tsx`** — AuthProvider
- Uses `slugger-sdk.ts` to initiate the handshake
- On receiving auth: POSTs `{ token, sluggerUser }` to `/api/auth/bootstrap`
- Stores the response in React state (memory only — never localStorage)
- Calls `supabase.auth.setSession()` with the returned access token
- Loads full user data with tasks, inventory, team, etc.
- Provides `useAuth()` hook → `{ user, isLoading, isAuthenticated, error }`
- Maps `user.role` from the Slugger payload to the app role via `mapSluggerRole()`

**`/lib/role-mapping.ts`** — maps Slugger role strings to app roles
```typescript
function mapSluggerRole(sluggerRole: string): 'clubhouse_manager' | 'general_manager' | 'player' {
  // 'league' → 'clubhouse_manager' (current mapping)
  // Add field_manager mapping when Rick White confirms
}
```

### Local Development Without Slugger
For local dev and testing, create a mock parent page (`scripts/dev-harness.html`) that:
- Embeds the widget in an iframe
- Sends a fake `SLUGGER_AUTH` message with test user data on load
- Allows switching between roles (CM / GM / player) via buttons

This avoids needing access to the real Slugger platform during development.

### Acceptance Criteria
- Widget sends `SLUGGER_WIDGET_READY` on mount and receives auth from Slugger
- Origin check correctly rejects messages from unknown origins
- All three verification paths work (Slugger API, payload fallback, Cognito fallback)
- User is upserted in `users` table with correct `slugger_user_id`, name, team, and role
- Supabase JWT enables RLS — user can only access their team's data
- Auth error screen shows if Slugger doesn't respond within 10 seconds
- Role mapping is correct for all three current roles
- Dev harness allows testing all roles locally without Slugger

---

## 3b. Local Development & Testing Environment

### Task
Set up everything needed so that any developer can clone the repo, run one or two commands, and have a fully working app with realistic data — no Slugger platform access, no production Supabase, no coordination with anyone.

### Supabase Local Development Stack

Use **Supabase CLI** (`supabase init` + `supabase start`) to run Postgres, Auth, and Realtime locally in Docker. This gives you a local Supabase instance at `http://localhost:54321` with its own JWT secret.

**`supabase/migrations/`** — All schema SQL from Module 2 goes here as numbered migration files. Running `supabase db reset` applies them from scratch. This is also the source of truth for the production schema — deploy to production Supabase via `supabase db push`.

```
supabase/
  config.toml              ← local Supabase config
  migrations/
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
  seed.sql                 ← seed data (see below)
```

Running `supabase db reset` drops everything, re-runs all migrations, and runs `seed.sql`. A developer can go from zero to a fully populated local database in one command.

### Environment Switching

Use a `.env.local` file with a `NEXT_PUBLIC_DEV_MODE=true` flag. When this is set:

1. The Slugger SDK skips the real `postMessage` handshake entirely
2. The app reads the mock user from a `DEV_USER_ROLE` env var (or a role-switcher UI in the dev harness)
3. The bootstrap endpoint skips the Slugger API call and Cognito validation — it trusts the mock user payload directly
4. The Supabase client points to `http://localhost:54321` with the local anon key

```env
# .env.local (never committed)
NEXT_PUBLIC_DEV_MODE=true
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local anon key from supabase start output>
SUPABASE_JWT_SECRET=<local jwt secret from supabase start output>
DEV_USER_ROLE=clubhouse_manager   # or general_manager, player
DEV_USER_TEAM=1                   # team ID to log in as
DEV_USER_ID=1                     # user ID to log in as
```

**In production** (`NEXT_PUBLIC_DEV_MODE` is unset or false), all of these bypasses are disabled and the real Slugger auth flow runs.

### Dev Harness (`scripts/dev-harness.html`)

A standalone HTML page that mimics the Slugger parent window. It:

1. Embeds the widget at `http://localhost:3000` in an iframe
2. Listens for `SLUGGER_WIDGET_READY` from the iframe
3. Responds with a `SLUGGER_AUTH` message using the selected mock user
4. Has a control panel above the iframe with:
   - **Role switcher:** buttons for Clubhouse Manager / General Manager / Player
   - **Team switcher:** dropdown of seeded teams
   - **User switcher:** dropdown of seeded users for the selected role+team
   - Switching any of these reloads the iframe with the new mock auth payload

```html
<!-- Simplified structure -->
<div id="controls">
  <button onclick="switchRole('league')">CM</button>
  <button onclick="switchRole('gm')">GM</button>
  <button onclick="switchRole('player')">Player</button>
  <select id="team-select">...</select>
  <select id="user-select">...</select>
</div>
<iframe id="widget" src="http://localhost:3000" />

<script>
  const iframe = document.getElementById('widget');
  const MOCK_USERS = { /* seeded user data keyed by id */ };

  window.addEventListener('message', (e) => {
    if (e.data?.type === 'SLUGGER_WIDGET_READY') {
      const user = MOCK_USERS[selectedUserId];
      iframe.contentWindow.postMessage({
        type: 'SLUGGER_AUTH',
        payload: {
          bootstrapToken: 'dev-mock-token',
          user: {
            id: String(user.slugger_user_id),
            email: user.email,
            firstName: user.user_name.split(' ')[0],
            lastName: user.user_name.split(' ')[1] || '',
            role: user.slugger_role,
            teamId: String(user.team_id),
            isAdmin: false
          },
          expiresAt: Date.now() + 3600000
        }
      }, 'http://localhost:3000');
    }
  });
</script>
```

The dev harness sends messages with the exact same payload shape as Slugger, so the widget's auth code runs the same path in dev and production — the only difference is the bootstrap endpoint skips external verification when `DEV_MODE` is true.

**Two ways to develop:**
- **With the harness:** Open `dev-harness.html` in a browser. The widget loads in the iframe and receives mock auth. Best for testing the full auth flow and role switching.
- **Without the harness:** Open `http://localhost:3000` directly. When `DEV_MODE` is true and no `SLUGGER_AUTH` is received within the timeout, the SDK auto-injects the mock user from env vars instead of showing an error. Faster for day-to-day feature work when you don't need to test auth.

### Seed Data (`supabase/seed.sql`)

Realistic data covering all roles, features, and edge cases. All mock `slugger_user_id` values use a `dev-` prefix to avoid collisions with real Slugger IDs.

```sql
-- ============================================================
-- TEAMS (use real Atlantic League team names for realism)
-- ============================================================
INSERT INTO teams (team_name) VALUES
  ('Long Island Ducks'),        -- id 1
  ('Lancaster Stormers'),       -- id 2
  ('York Revolution'),          -- id 3
  ('Southern Maryland Blue Crabs'); -- id 4

-- ============================================================
-- USERS — at least one of each role per team
-- ============================================================

-- Clubhouse managers
INSERT INTO users (slugger_user_id, user_name, email, role, team_id, has_completed_onboarding) VALUES
  ('dev-cm-1', 'Mike Torres',    'mike@example.com',    'clubhouse_manager', 1, true),
  ('dev-cm-2', 'Sam Reeves',    'sam@example.com',     'clubhouse_manager', 2, true),
  ('dev-cm-3', 'Alex Novak',    'alex@example.com',    'clubhouse_manager', 3, false);  -- hasn't onboarded (tests onboarding flow)

-- General managers
INSERT INTO users (slugger_user_id, user_name, email, role, team_id) VALUES
  ('dev-gm-1', 'Emil Coccaro',  'emil@example.com',    'general_manager', 1),
  ('dev-gm-2', 'Dana Whitfield','dana@example.com',    'general_manager', 2);

-- Players (mix of teams, some with dietary restrictions)
INSERT INTO users (slugger_user_id, user_name, email, role, team_id) VALUES
  ('dev-pl-1', 'Jordan Bell',   'jordan@example.com',  'player', 1),
  ('dev-pl-2', 'Casey Ruiz',    'casey@example.com',   'player', 1),
  ('dev-pl-3', 'Pat Okafor',    'pat@example.com',     'player', 2),
  ('dev-pl-4', 'Riley Chen',    'riley@example.com',   'player', 2),
  ('dev-pl-5', 'Morgan Davis',  'morgan@example.com',  'player', 3);

-- ============================================================
-- GAMES — a realistic 2-week window around today's date
-- Mix of home/away series for team 1 (Long Island Ducks)
-- ============================================================

-- Series 1: Ducks vs Stormers at home (3 games)
INSERT INTO games (home_team_id, away_team_id, game_date, game_time) VALUES
  (1, 2, CURRENT_DATE - 2, '19:00'),
  (1, 2, CURRENT_DATE - 1, '18:30'),
  (1, 2, CURRENT_DATE,     '19:00');   -- today = game day for team 1

-- Off day tomorrow
-- Series 2: Ducks at York (away, 2 games)
INSERT INTO games (home_team_id, away_team_id, game_date, game_time) VALUES
  (3, 1, CURRENT_DATE + 2, '19:00'),
  (3, 1, CURRENT_DATE + 3, '18:00');

-- Series 3: Ducks vs Blue Crabs at home (3 games, future)
INSERT INTO games (home_team_id, away_team_id, game_date, game_time) VALUES
  (1, 4, CURRENT_DATE + 5, '19:00'),
  (1, 4, CURRENT_DATE + 6, '14:00'),   -- day game
  (1, 4, CURRENT_DATE + 7, '19:00');

-- Games for team 2 (so CM-2 has data too)
INSERT INTO games (home_team_id, away_team_id, game_date, game_time) VALUES
  (2, 3, CURRENT_DATE, '18:30'),
  (2, 3, CURRENT_DATE + 1, '19:00');

-- ============================================================
-- RECURRING TASKS — for CM-1 (Mike Torres, Ducks)
-- Covers game-day and off-day tasks across categories
-- ============================================================

INSERT INTO recurring_tasks (user_id, title, description, default_time, category, visibility, game_day_period, is_enabled) VALUES
  -- Game-day morning tasks
  (1, 'Unlock clubhouse',          'Open all doors, turn on lights and AC',           '07:00', 'admin',      'game_day', 'morning',   true),
  (1, 'Start laundry (uniforms)',   'Sort home whites and colored practice jerseys',   '07:30', 'laundry',    'game_day', 'morning',   true),
  (1, 'Stock coolers',              'Water, Gatorade, ice in both dugouts',            '08:00', 'food',       'game_day', 'morning',   true),
  (1, 'Check AED batteries',       'Main clubhouse + visitor side',                   '08:30', 'medical',    'game_day', 'morning',   true),

  -- Game-day pre-game tasks
  (1, 'Set up pre-game spread',    'Fruit, PB&J, granola bars in players lounge',     '14:00', 'food',       'game_day', 'pre_game',  true),
  (1, 'Lay out uniforms',          'Home whites on each locker shelf',                '15:00', 'equipment',  'game_day', 'pre_game',  true),
  (1, 'Sanitize bathrooms',        'Both home and visitor restrooms',                 '15:30', 'sanitation',  'game_day', 'pre_game',  true),
  (1, 'Prep visitor clubhouse',    'Towels, soap, water, check AC',                   '16:00', 'admin',      'game_day', 'pre_game',  true),

  -- Game-day post-game tasks
  (1, 'Post-game meal setup',      'Set up catering or prepared food in lounge',      '21:00', 'food',       'game_day', 'post_game', true),
  (1, 'Collect dirty uniforms',    'Bag all uniforms, start overnight wash',          '22:00', 'laundry',    'game_day', 'post_game', true),
  (1, 'Lock up and security check','All doors, windows, lights off except overnight', '23:00', 'admin',      'game_day', 'post_game', true),

  -- Off-day tasks
  (1, 'Deep clean clubhouse',      'Floors, lockers, showers, windows',               '09:00', 'sanitation',  'off_day',  NULL,        true),
  (1, 'Inventory check',           'Walk through all categories, update stock status', '10:00', 'admin',      'off_day',  NULL,        true),
  (1, 'Equipment maintenance',     'Oil gloves, check bats, restring if needed',      '11:00', 'equipment',  'off_day',  NULL,        true),
  (1, 'Restock order',             'Place orders for items flagged low or out',        '13:00', 'admin',      'off_day',  NULL,        true);

-- ============================================================
-- ONE-OFF TASKS — a few for today and upcoming days
-- ============================================================

INSERT INTO tasks (user_id, title, description, task_date, task_time, category, visibility, is_complete) VALUES
  (1, 'Fix visitor shower drain',     'Plumber coming at 2pm',            CURRENT_DATE,     '14:00', 'equipment',  'all',      false),
  (1, 'Pick up catering order',       'Bobs BBQ, order #4421',           CURRENT_DATE,     '16:30', 'food',       'game_day', false),
  (1, 'Order new bat rack',           'Check Amazon and Dick''s',        CURRENT_DATE + 1, '10:00', 'equipment',  'off_day',  false);

-- ============================================================
-- RECURRING TASK COMPLETIONS — some for recent days
-- ============================================================

INSERT INTO recurring_task_completions (recurring_task_id, completion_date, is_complete, completed_at) VALUES
  (1, CURRENT_DATE - 2, true,  now() - interval '2 days'),
  (2, CURRENT_DATE - 2, true,  now() - interval '2 days'),
  (3, CURRENT_DATE - 2, true,  now() - interval '2 days'),
  (1, CURRENT_DATE - 1, true,  now() - interval '1 day'),
  (2, CURRENT_DATE - 1, false, NULL),   -- not completed yesterday
  (3, CURRENT_DATE - 1, true,  now() - interval '1 day');

-- ============================================================
-- INVENTORY — team 1, realistic items across categories
-- ============================================================

INSERT INTO inventory_items (team_id, item_name, category, unit, current_stock, par_level, stock_status, price_per_unit, purchase_link) VALUES
  -- Laundry & Cleaning
  (1, 'Tide Pods',          'laundry_cleaning',   'bags',    5,  8,  'stocked',  12.99, 'https://amazon.com/dp/example1'),
  (1, 'Bleach',             'laundry_cleaning',   'gallons', 1,  4,  'low',       4.99, NULL),
  (1, 'Dryer Sheets',       'laundry_cleaning',   'boxes',   0,  3,  'out',       6.49, NULL),
  (1, 'Stain Remover',      'laundry_cleaning',   'bottles', 3,  3,  'stocked',   8.99, NULL),
  -- Hygiene
  (1, 'Hand Soap',          'hygiene_personal',   'bottles', 2,  6,  'low',       3.49, NULL),
  (1, 'Paper Towels',       'hygiene_personal',   'rolls',   0, 24,  'out',       1.29, 'https://amazon.com/dp/example2'),
  (1, 'Deodorant',          'hygiene_personal',   'sticks',  10, 12,  'stocked', NULL,  NULL),
  -- Medical
  (1, 'Athletic Tape',      'medical_safety',     'rolls',   8, 10,  'stocked',   4.99, NULL),
  (1, 'Ice Bags',           'medical_safety',     'bags',    3, 20,  'low',       0.99, NULL),
  (1, 'Band-Aids',          'medical_safety',     'boxes',   2,  5,  'low',       7.99, NULL),
  -- Food
  (1, 'Gatorade (cases)',   'food_beverage',      'cases',   4, 10,  'low',      24.99, NULL),
  (1, 'Granola Bars',       'food_beverage',      'boxes',   6,  6,  'stocked',   8.49, NULL),
  (1, 'Coffee K-Cups',      'food_beverage',      'boxes',   1,  4,  'low',      14.99, NULL),
  -- Equipment
  (1, 'Pine Tar Rags',      'equipment_field',    'rags',   12, 10,  'stocked',   2.99, NULL),
  (1, 'Rosin Bags',         'equipment_field',    'bags',    5, 10,  'low',       3.49, NULL),
  -- Misc
  (1, 'Printer Paper',      'miscellaneous',      'reams',   2,  4,  'low',       8.99, NULL),
  (1, 'Sharpies',           'miscellaneous',      'packs',   3,  3,  'stocked',   5.49, NULL);

-- ============================================================
-- MEALS — some planned, some not (for the current home series)
-- ============================================================

INSERT INTO meals (game_id, pre_game_snack, post_game_meal) VALUES
  (1, 'Fruit cups, PB&J, trail mix',      'Bobs BBQ: pulled pork, coleslaw, cornbread'),
  (2, 'Bagels with cream cheese, bananas', 'Pasta bar: penne, marinara, grilled chicken');
  -- Game 3 (today) intentionally has no meal plan yet

-- ============================================================
-- PLAYER PREFERENCES & RESTRICTIONS
-- ============================================================

INSERT INTO player_preferences (player_id, preferred_name, other_details) VALUES
  (6, 'JB',     'Severe peanut allergy — needs separate prep area'),
  (7, NULL,     NULL),
  (8, 'Patty',  'Lactose intolerant but can handle hard cheeses'),
  (9, NULL,     'Prefers high-protein meals before games');

INSERT INTO player_restrictions (player_id, restriction, is_custom) VALUES
  (6, 'Nut allergy',   false),
  (6, 'Gluten-free',   false),
  (8, 'Dairy-Free',    false),
  (8, 'Hard cheeses OK', true),
  (9, 'Halal',          false);

-- ============================================================
-- CONTACTS — team 1
-- ============================================================

INSERT INTO contacts (team_id, contact_name, contact_role, phone, email, display_order, created_by) VALUES
  (1, 'Dr. Sarah Kim',     'Head Trainer',              '516-555-0101', 'sarah.kim@ducks.com',    1, 1),
  (1, 'Tom Brennan',       'Field Manager',             '516-555-0102', 'tom.b@ducks.com',        2, 1),
  (1, 'Sam Reeves',        'Visiting Clubhouse Manager','717-555-0201', 'sam@stormers.com',       3, 1),
  (1, 'Rick White',        'ALPB President',            '212-555-0301', 'rick@alpb.com',          4, 1);

-- ============================================================
-- MESSAGES — a few conversations with history
-- ============================================================

INSERT INTO conversations (id, type, name, created_by) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'direct',   NULL,                    1),
  ('a0000000-0000-0000-0000-000000000002', 'group',    'Home Series Prep',      1),
  ('a0000000-0000-0000-0000-000000000003', 'bulletin', 'League Bulletin Board', 1);

INSERT INTO conversation_participants (conversation_id, user_id) VALUES
  ('a0000000-0000-0000-0000-000000000001', 1),
  ('a0000000-0000-0000-0000-000000000001', 2),
  ('a0000000-0000-0000-0000-000000000002', 1),
  ('a0000000-0000-0000-0000-000000000002', 2),
  ('a0000000-0000-0000-0000-000000000002', 3),
  ('a0000000-0000-0000-0000-000000000003', 1),
  ('a0000000-0000-0000-0000-000000000003', 2),
  ('a0000000-0000-0000-0000-000000000003', 3);

INSERT INTO messages (conversation_id, sender_id, content, created_at) VALUES
  ('a0000000-0000-0000-0000-000000000001', 1, 'Hey Sam, are your guys bringing their own batting practice balls this series?', now() - interval '3 hours'),
  ('a0000000-0000-0000-0000-000000000001', 2, 'Yeah we will have our own. Can you make sure visitor BP cage is unlocked by 2?', now() - interval '2 hours'),
  ('a0000000-0000-0000-0000-000000000001', 1, 'Will do. Visitor clubhouse will be ready by 1:30.', now() - interval '1 hour'),
  ('a0000000-0000-0000-0000-000000000003', 1, 'Reminder: league office needs all equipment damage reports by Friday EOD.', now() - interval '1 day'),
  ('a0000000-0000-0000-0000-000000000003', 2, 'Got it, will send ours today.', now() - interval '20 hours');

-- ============================================================
-- ISSUES — a few player reports in various states
-- ============================================================

INSERT INTO issues (player_id, player_team_id, team_context, description, status, gm_flagged, routed_to) VALUES
  (6, 1, 'home', 'Hot water in the home shower has been inconsistent for the past 3 games. Sometimes it cuts out mid-shower.', 'in_progress', false, 'clubhouse_manager'),
  (7, 1, 'home', 'The pre-game spread ran out of fruit yesterday before half the team got to eat.', 'new', true, 'clubhouse_manager'),
  (8, 2, 'away', 'Visitor clubhouse at Long Island did not have dairy-free options available for post-game meal.', 'resolved', false, 'clubhouse_manager');

INSERT INTO issue_comments (issue_id, user_id, comment, created_at) VALUES
  (1, 1, 'Called the plumber, they are coming Thursday to look at the water heater.', now() - interval '1 day'),
  (1, 1, 'Update: plumber says it is the mixing valve. Part ordered, should be fixed by Friday.', now() - interval '6 hours');
```

### Quick Start Script (`scripts/dev-setup.sh`)

A single script a developer runs after cloning:

```bash
#!/bin/bash
set -e

echo "=== Clubhouse Widget Dev Setup ==="

# 1. Install dependencies
echo "Installing dependencies..."
npm install

# 2. Start Supabase locally (requires Docker)
echo "Starting local Supabase..."
supabase start

# 3. Grab the local credentials from supabase status output
SUPABASE_URL=$(supabase status --output json | jq -r '.API_URL')
ANON_KEY=$(supabase status --output json | jq -r '.ANON_KEY')
JWT_SECRET=$(supabase status --output json | jq -r '.JWT_SECRET')

# 4. Write .env.local
cat > .env.local <<EOF
NEXT_PUBLIC_DEV_MODE=true
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY
SUPABASE_JWT_SECRET=$JWT_SECRET
DEV_USER_ROLE=clubhouse_manager
DEV_USER_TEAM=1
DEV_USER_ID=1
EOF

echo "Created .env.local"

# 5. Reset DB (applies migrations + seed data)
echo "Applying migrations and seeding data..."
supabase db reset

# 6. Start Next.js dev server
echo ""
echo "=== Setup complete ==="
echo "Run 'npm run dev' to start the app"
echo "Open scripts/dev-harness.html to test with role switching"
echo "Or open http://localhost:3000 directly (auto-injects dev user from .env.local)"
```

**Prerequisites (document in README):**
- Node.js 18+
- Docker (for Supabase local)
- Supabase CLI (`npm install -g supabase`)

### Testing Mock Users Quickly

For fast role-switching without the harness, add a **dev-only toolbar** that appears when `DEV_MODE` is true. A floating bar at the bottom of the screen with:

- Current user name + role displayed
- Dropdown to switch user (re-runs the auth flow with a different mock payload)
- Switching triggers a full re-auth: clears state, sends new mock `SLUGGER_AUTH`, re-bootstraps

This is faster than editing `.env.local` and restarting the dev server.

### Acceptance Criteria
- `scripts/dev-setup.sh` takes a developer from clone to running app in under 3 minutes
- `supabase db reset` creates all tables and populates seed data
- Dev harness sends correct `SLUGGER_AUTH` payloads and role switching works
- Direct access to `localhost:3000` (without harness) auto-injects the env-configured mock user
- Dev toolbar allows switching between all seeded users without restart
- All three roles render the correct sidebar tabs with seeded data visible
- Today is a game day for team 1 (Ducks) in the seed data, so the daily checklist shows game-day sections
- Tomorrow is an off day, so navigating to tomorrow in the calendar shows off-day tasks
- Inventory shows a mix of stocked/low/out items
- Messages show existing conversation history
- Player reports show issues in various states
- None of the dev-mode code paths are reachable when `NEXT_PUBLIC_DEV_MODE` is not `true`

---

### What Changes from the Old System

| Old | New |
|-----|-----|
| Three task types (one-off, recurring, template) | Two task types (one-off, recurring) — templates eliminated |
| Recurring completions in React state only | Recurring completions persisted to `recurring_task_completions` |
| Template tasks in React state only | Gone — recurring tasks replace them |
| Game-day templates wired to empty array | Recurring tasks with `visibility = 'game_day'` replace this |
| `task_type` is magic integer (null/1/2) | `visibility` enum: `'all'` / `'game_day'` / `'off_day'` |
| Silent failures on optimistic updates | Optimistic updates with error rollback + toast notification |
| Enable/disable toggle in React state only | `is_enabled` boolean persisted on `recurring_tasks` |

### API Layer (`/lib/api/tasks.ts`)

```typescript
// One-off tasks
createTask(task: NewTask): Promise<Task>
updateTask(id: number, updates: Partial<Task>): Promise<Task>
deleteTask(id: number): Promise<void>
getTasksForDate(userId: number, date: string): Promise<Task[]>
getTasksForDateRange(userId: number, startDate: string, endDate: string): Promise<Task[]>

// Recurring tasks
createRecurringTask(task: NewRecurringTask): Promise<RecurringTask>
updateRecurringTask(id: number, updates: Partial<RecurringTask>): Promise<RecurringTask>
deleteRecurringTask(id: number): Promise<void>
getRecurringTasks(userId: number): Promise<RecurringTask[]>
toggleRecurringTaskEnabled(id: number, enabled: boolean): Promise<void>

// Recurring task completions
toggleRecurringCompletion(recurringTaskId: number, date: string): Promise<void>
getCompletionsForDate(userId: number, date: string): Promise<Record<number, boolean>>
```

### UI: Daily Checklists (`/app/(app)/checklists/page.tsx`)

**Top section:** Home Games Widget — upcoming home games for quick context.

**Main section logic:**
1. Determine `isGameDay` — does the user's team have a home game today?
2. Fetch one-off tasks for today (`getTasksForDate`)
3. Fetch recurring tasks (`getRecurringTasks`), filter by `visibility` + `is_enabled`
4. Fetch recurring completions for today (`getCompletionsForDate`)
5. Merge and sort by time

**Off day:** Single flat list. Progress bar at top.

**Game day:** Three accordion sections (Morning / Pre-Game / Post-Game), each with its own progress bar. Assignment to sections:
- Recurring tasks: use their `game_day_period` field
- One-off tasks: derive from `task_time` vs. game time boundaries
  - Before 12:00 → Morning
  - 12:00 to game time → Pre-Game
  - After game time → Post-Game
  - No time set → Morning (safe default)
- Default game time if not set: 7:00 PM

**Each task row:** Checkbox, title, category badge, time, and (for one-off tasks) a delete button. Recurring tasks show a repeat icon.

**Add task:** A floating "+" button opens a dialog to create a one-off task for today.

**Error handling:** Optimistic updates with rollback. If a Supabase call fails, revert the state change and show a toast: "Failed to save — try again."

### UI: Recurring Tasks (`/app/(app)/recurring-tasks/page.tsx`)

Card list of all recurring task definitions. Each card shows:
- Title, description, category badge, time
- Visibility badge ("Game Day" / "Off Day" / "Every Day")
- Game day period badge (if applicable)
- Enable/disable toggle (writes to DB)
- Edit button → opens edit dialog
- Delete button → confirmation dialog → hard delete

"Add Recurring Task" button opens a form with:
- Title (required), description, category dropdown, visibility toggle, default time, game day period (shown only when visibility = game_day)

### UI: Task Calendar (`/app/(app)/calendar/page.tsx`)

Two-panel layout (stacks vertically on mobile):

**Left panel:** Weekly calendar grid.
- Each day cell shows task count and a game-day indicator (home/away badge)
- Clicking a day selects it

**Right panel:** Selected day's tasks.
- Shows all tasks (one-off + applicable recurring) for that date, each checkable
- "Add Task" button for one-off tasks on that date
- Tasks are grouped the same way as Daily Checklists (flat on off days, sectioned on game days)

**Bottom section:** Scrollable "Upcoming Tasks" list, sorted by date. Clicking a task jumps the calendar to that date.

### Acceptance Criteria
- Recurring task completions survive page refresh
- Enable/disable toggle persists to DB
- Game-day / off-day filtering works correctly based on the games schedule
- One-off task CRUD works with optimistic updates + error rollback
- Calendar shows correct task counts per day
- All views are usable on a 375px-wide screen

---

## 5. Inventory Module

### What Changes
The underlying data model stays (current_stock, par_level), but the **default UI is a simplified checklist** with an **end-of-series restock view** and a **shopping list export**.

### UI: Inventory Overview (`/app/(app)/inventory/page.tsx`)

**Top bar:** "Items Needing Attention" count badge (items where `stock_status != 'stocked'`).

**Main content:** Six collapsible category sections (one per `inventory_category`). Each section lists items as a simple row:

```
┌─────────────────────────────────────────────────────────┐
│ [Stocked ▾]  Tide Pods (bags)                    [Edit] │
│ [Low ▾]      Paper Towels (rolls)          ⚠    [Edit] │
│ [Out ▾]      Hand Sanitizer (bottles)      ⚠⚠   [Edit] │
└─────────────────────────────────────────────────────────┘
```

- **Stock status dropdown:** Three options — Stocked / Low / Out. Tapping changes the value immediately (writes to DB). This is the primary interaction — no +/- buttons, no number entry on the main screen.
- **Edit button:** Opens a detail dialog with: item name, unit, par level, current stock (numeric input), price, purchase link, notes. This is the "advanced" view for when they need precision.
- **Add item:** Button at the bottom of each category section.

**The stock_status field is the source of truth for the checklist UI**, but it's also derivable from `current_stock` vs. `par_level` for items that have those values set. When a manager uses the edit dialog to set exact stock numbers, auto-compute the status. When they use the quick dropdown, write the status directly and optionally update stock (stocked → set to par_level, out → set to 0).

### UI: Series Restock View

Triggered after the last home game of a series (derived from the schedule). A banner appears at the top of the Inventory page: "Series vs. [Opponent] ended — review your restock needs?"

Clicking it opens a full-screen restock panel:
- Lists all items where `stock_status` is `low` or `out`
- Each row shows: item name, current stock, par level, quantity needed, price (if set), line total
- Total restock cost at the top (items with prices)
- "Copy Shopping List" button → plain text to clipboard:
  ```
  Shopping List — Series vs. Railriders
  ☐ Paper Towels — 12 rolls
  ☐ Hand Sanitizer — 5 bottles
  ☐ Tide Pods — 3 bags ($12.99 ea)
  Total: $38.97 (2 items unpriced)
  ```
- "Mark All Restocked" button → sets all listed items to `stocked` and `current_stock = par_level`

### Acceptance Criteria
- Quick status dropdown saves immediately
- Edit dialog allows precise stock management
- Series restock view appears at the correct time
- Shopping list copies to clipboard in correct format
- Category sections collapse/expand
- Usable on mobile (single-column layout, large tap targets)

---

## 6. Meal Planning Module

### What Changes
- Series-level batch planning (plan all games in a series at once)
- Per-game editing still available for adjustments

### UI: Meal Planning (`/app/(app)/meals/page.tsx`)

**View:** Lists upcoming home game series (grouped). Each series card shows:
- Opponent name, date range, number of games
- Status: "All Planned" / "2 of 3 Planned" / "Not Planned"
- Dietary restriction warning icon if any players on either team have restrictions

**Clicking a series card** opens a multi-game planning dialog:
- Top section: Aggregated dietary restrictions panel (player name + restrictions, for both home and visiting teams)
- Below: One row per game in the series, each with:
  - Date + time
  - Pre-game snack text area
  - Post-game meal text area
- "Copy from previous game" button on each row (copies snack/meal from the row above)
- Save writes all meals at once (upsert into `meals` table)

**Individual game editing:** Clicking a single game (outside of series view) opens the same dialog but for one game.

### API Layer
```typescript
getHomeGameSeries(teamId: number): Promise<Series[]>
// where Series = { opponent: Team, games: Game[], meals: (Meal | null)[] }

upsertMeals(meals: { game_id: number, pre_game_snack: string, post_game_meal: string }[]): Promise<void>

getDietaryRestrictions(teamIds: number[]): Promise<{ player_name: string, restrictions: string[] }[]>
```

### Acceptance Criteria
- Series grouping is correct (consecutive home games vs. same opponent)
- Batch save writes all meals in one operation
- Dietary restrictions aggregate from both teams
- "Copy from previous" works
- Players see planned meals in their Meal Schedule tab

---

## 7. Contacts Module

### What Changes
Brand new feature.

### UI: Contact Bar (persistent, all roles)
A collapsible bar pinned **above the main content area** (below the app header, above the page content). Visible on every page.

- Collapsed: Shows "Key Contacts" label + count
- Expanded: Horizontal scroll of contact cards (mobile) or grid (desktop)
- Each card: Name, role title, phone (tap-to-call on mobile), email (tap-to-email)

### UI: Contact Management (clubhouse manager only)
Accessed via an "Edit Contacts" button on the contact bar (only shown to clubhouse managers).

- Add / edit / delete contacts
- Drag-and-drop reorder (sets `display_order`)
- Fields: name (required), role (required), phone, email, notes

### Pre-populated during onboarding
The onboarding questionnaire (Module 10) asks: "Who are your key contacts?" and pre-populates this table.

### Acceptance Criteria
- Contact bar visible on all pages for all roles
- Tap-to-call works on mobile
- Only clubhouse managers can edit contacts
- Contacts are scoped to team (team A can't see team B's contacts)

---

## 8. Messaging Module

### Architecture
Uses Supabase Realtime for live message delivery. Three conversation types:
- **Direct:** 1:1 between any two staff members (clubhouse managers or other staff)
- **Group:** Named group thread, any members
- **Bulletin:** A single league-wide channel visible to all clubhouse managers

### UI: Messages (`/app/(app)/messages/page.tsx`)

**Left panel (conversation list):**
- Tabs or filter: "Direct" / "Groups" / "Bulletin"
- Each conversation shows: name (or participant names for DMs), last message preview, timestamp, unread badge
- "New Conversation" button → dialog to select participants (search by name) and choose Direct or Group
- Bulletin appears as a pinned conversation at the top

**Right panel (active conversation):**
- Message history, scrollable, newest at bottom
- Each message: sender name, timestamp, content
- Compose box at bottom with send button
- Real-time: subscribe to Supabase Realtime channel for the active conversation

**Mobile layout:** Conversation list is the default view. Tapping a conversation navigates to the thread (full screen). Back button returns to list.

### Bulletin Channel
- Auto-created on first app load if it doesn't exist
- All clubhouse managers are auto-added as participants
- Any CM can post; all CMs see it
- Cannot be deleted

### Supabase Realtime Setup
```typescript
// Subscribe to new messages in the active conversation
supabase
  .channel(`conversation:${conversationId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `conversation_id=eq.${conversationId}`
  }, handleNewMessage)
  .subscribe()
```

### Acceptance Criteria
- Messages appear in real-time without page refresh
- Unread badges update correctly
- Bulletin is accessible to all CMs
- Group conversations work with 3+ participants
- Mobile: conversation list → thread → back flow works smoothly

---

## 9. Player Reports Module

### What Changes
- `issue_comments` now tracks author
- Routing columns added (pluggable for field manager flow)
- For v1: reports still go to clubhouse managers
- When field manager routing is confirmed: change `routed_to` default and add field manager UI

### Clubhouse Manager View (`/app/(app)/reports/page.tsx`)

**Filters:** Team Context (All / Home / Away) + Status (All / New / In Progress / Resolved)

**Table columns:** Player team, description preview, latest comment preview, status badge, "Flagged" badge

**Clicking a row** opens a detail dialog:
- Full description, team context, timestamps
- Comment thread with author names and timestamps
- Add comment text area
- Footer buttons: "Mark In Progress" / "Mark Resolved"

### General Manager View
Same table, read-only. No comment composer, no status buttons. **Can flag/unflag reports.** Real-time updates via Supabase Realtime (new comments appear live).

### Player View: Issue Reporting (`/app/(app)/player-report/page.tsx`)
- Team context toggle (Home / Away)
- If Away: dropdown to select which away team
- Description text area (required)
- Submit → creates row in `issues` with `routed_to = 'clubhouse_manager'`
- Success toast: "Submitted. Clubhouse managers will review."

### Field Manager Routing (Future — Do Not Build Yet)
When Rick White confirms:
1. Add `field_manager` to `mapSluggerRole()` (or add `is_field_manager` flag to `users`)
2. Change `issues` default `routed_to` to `'field_manager'`
3. Build a Field Manager view: sees all reports for their team, can flag and route to clubhouse manager
4. Clubhouse Manager view: filter to `routed_to = 'clubhouse_manager'` only

**The schema already supports this** — the `routed_to`, `routed_by`, and `routed_at` columns are in place. Only the UI and default value need to change.

### Acceptance Criteria
- Comments show author name
- Status transitions work and update the table
- GM can flag/unflag, sees real-time updates
- Player submission creates a correctly formed issue
- RLS: players can't read other players' reports

---

## 10. Onboarding Module

### What Changes
Brand new feature. Generates personalized recurring tasks for a new clubhouse manager using an LLM.

### Flow
1. Manager logs in for the first time (`has_completed_onboarding = false`)
2. App redirects to `/onboarding` instead of the normal dashboard
3. Multi-step wizard (5–7 screens) collects structured answers
4. On submit: POST to `/api/onboarding/generate-tasks`
5. Serverless function sends answers to Claude API with a prompt template
6. Claude returns structured JSON: array of recurring task definitions
7. Function validates the response, bulk-inserts into `recurring_tasks`
8. Sets `has_completed_onboarding = true`
9. Redirects to Daily Checklists

### Questionnaire Screens (Draft — Refine With Real Managers)
1. **Facility basics:** How many players on roster? Do you have a home and visitor clubhouse? Laundry on-site or outsourced?
2. **Laundry & cleaning:** What equipment do you have? (Washers, dryers, dry cleaning pickup?) What gets washed daily vs. weekly?
3. **Food & meals:** Do you prepare food in-house or order from vendors? Pre-game snacks, post-game meals, or both? Coffee/drinks setup?
4. **Field & equipment:** Are you responsible for any field prep? Batting cage maintenance? Equipment room organization?
5. **Medical & safety:** AED checks? First aid kit restocking? Training room coordination?
6. **Game-day specifics:** What time do you typically arrive before a game? What's your post-game teardown like?
7. **Key contacts:** Who is your head trainer? Field manager? Visiting clubhouse contact? (Pre-populates the Contacts table)

### Prompt Template (for the API call)
```
You are helping a professional baseball clubhouse manager set up their daily task list.
Based on their answers below, generate a JSON array of recurring tasks.

Each task must have:
- title: string (concise, action-oriented)
- description: string (1-2 sentences of detail)
- category: one of [sanitation, laundry, food, equipment, field, admin, medical, general]
- visibility: "game_day" or "off_day"
- game_day_period: "morning", "pre_game", or "post_game" (only if visibility is "game_day")
- default_time: "HH:MM" format (24hr)

Manager's answers:
{answers_json}

Generate 15-30 tasks that cover their specific workflow. Be specific to their setup
(e.g., if they have on-site laundry, include wash/dry/fold tasks; if outsourced, include
pickup/dropoff tasks). Include both game-day and off-day tasks.

Respond with ONLY a JSON array, no other text.
```

### API Endpoint (`/app/api/onboarding/generate-tasks/route.ts`)
- Receives questionnaire answers
- Calls Claude API (claude-sonnet-4-20250514)
- Parses and validates the JSON response (check required fields, valid enum values)
- If validation fails: retry once with a correction prompt
- Bulk inserts valid tasks into `recurring_tasks`
- Updates `users.has_completed_onboarding = true`
- Returns the created tasks

### "Re-run onboarding" Option
Add a button in a Settings area (or the Recurring Tasks page): "Regenerate tasks from questionnaire." This re-opens the wizard, generates new tasks, and optionally replaces or merges with existing recurring tasks (ask the user: "Replace all existing recurring tasks, or add to them?").

### Acceptance Criteria
- New manager sees onboarding wizard on first login
- Questionnaire collects meaningful input across all areas
- Claude API call succeeds and returns valid task JSON
- Generated tasks appear in Recurring Tasks tab and Daily Checklists
- Second login skips onboarding (goes straight to dashboard)
- Re-run option works without breaking existing tasks

---

## 11. Player Views

### Player Info (`/app/(app)/player-info/page.tsx`)
Profile form:
- Preferred name (optional text input)
- Dietary restrictions: multi-select from 11 presets (Vegetarian, Vegan, Gluten-Free, Nut Allergy, Dairy-Free, Halal, Kosher, Shellfish Allergy, Soy Allergy, Egg Allergy, Low Sodium) + free-text "Other" input
- Selected restrictions render as dismissible chip tags
- Other Details: free-text area
- Save writes to `player_preferences` and `player_restrictions`

### Meal Schedule (`/app/(app)/player-meals/page.tsx`)
Read-only table:
- Columns: Date, Opponent, Home/Away, Pre-Game Snack, Post-Game Meal
- Only shows games where a meal has been planned
- Empty state: "No meals planned yet."

### Issue Reporting
(Covered in Module 9)

### Acceptance Criteria
- Dietary restrictions save and display correctly
- Restrictions feed into the Meal Planning dietary summary for managers
- Meal schedule shows only planned meals
- Player cannot see other players' data

---

## 12. App Shell & Layout

### Sidebar (Desktop)
Renders based on user role:

**Clubhouse Manager:**
1. Daily Checklists
2. Task Calendar
3. Recurring Tasks
4. Inventory
5. Meal Planning
6. Messages
7. Player Reports

**General Manager:**
1. Player Reports

**Player:**
1. Player Info
2. Meal Schedule
3. Issue Reporting

### Mobile Navigation
Bottom tab bar with the same items. If more than 5 tabs (clubhouse manager), use a "More" tab that opens the remaining options.

### Contact Bar
Sits between the header and the page content. Collapsible. Visible to all roles. (See Module 7.)

### Onboarding Gate
If `user.role === 'clubhouse_manager'` and `user.has_completed_onboarding === false`, redirect to `/onboarding` and don't render the sidebar.

---

## 13. Data Migration

### Task
Migrate existing data from the old Supabase tables to the new schema. Write scripts, not manual SQL.

### Scripts to Write

1. **`scripts/migrate-teams.ts`** — Copy `teams` table (should be identical)
2. **`scripts/migrate-users.ts`** — Map old `user` table to new `users` table. Map `user_role` text to `user_role` enum. Map `user_team` to `team_id`.
3. **`scripts/migrate-games.ts`** — Copy `games` table, rename columns (`date` → `game_date`, `time` → `game_time`)
4. **`scripts/migrate-tasks.ts`** — Split into `tasks` and `recurring_tasks` based on `is_repeating`. Map `task_type` integer (null/1/2) to `visibility` enum. Map `repeating_day` to `visibility` (0 → 'off_day', null → 'game_day').
5. **`scripts/migrate-inventory.ts`** — Map old `inventory` to `inventory_items`. Convert `inventory_type` to `inventory_category` enum. Derive `stock_status` from `current_stock` vs. `required_stock`. Convert `price_per_unit` from bigint to numeric.
6. **`scripts/migrate-meals.ts`** — Copy `meals` table (schema is similar)
7. **`scripts/migrate-player-data.ts`** — Copy `player_preferences` and `player_restrictions`
8. **`scripts/migrate-messages.ts`** — Copy `conversations`, `conversation_participants`, `messages`. Map old `user_id` integer FKs to new `users.id`.
9. **`scripts/migrate-issues.ts`** — Copy `issues` and `issue_comments`. Add `routed_to = 'clubhouse_manager'` for all existing issues. Migrate `issue_comments` with `user_id = NULL` (the old app never stored comment authors — confirmed bug). The new app enforces `user_id` at the application layer for all new comments.

### Run Order
Teams → Users → Games → Tasks → Inventory → Meals → Player Data → Messages → Issues

### Acceptance Criteria
- All existing data is present in the new schema
- No orphaned foreign keys
- Task visibility mapping is correct
- Old app can be turned off and new app works with migrated data

---

## Execution Order

### Phase 1 — Foundation (do first, everything depends on these)
1. Project scaffolding (Module 1)
2. Database schema creation (Module 2)
3. Auth module (Module 3)
4. Local dev environment, seed data, dev harness (Module 3b)
5. App shell & layout (Module 12)

### Phase 2 — Core Features (highest user value)
5. Tasks module — Daily Checklists + Recurring Tasks + Calendar (Module 4)
6. Contacts module (Module 7)
7. Inventory module (Module 5)

### Phase 3 — Secondary Features
8. Meal planning module (Module 6)
9. Player views (Module 11)
10. Player reports (Module 9)

### Phase 4 — Complex Features
11. Messaging module (Module 8)
12. Onboarding questionnaire (Module 10)

### Phase 5 — Migration & Cutover
13. Data migration scripts (Module 13)
14. End-to-end testing with migrated data
15. Cutover: point Vercel deployment to new app

### Unblocked By Rick White (Do When Ready)
- Field manager routing in Player Reports (Module 9, future section)
- Possibly a new role in the auth mapping

---

## Open Items

| Item | Owner | Blocks |
|------|-------|--------|
| Rick White: field manager representation | Anna | Player report routing |
| Refine onboarding questionnaire with a real clubhouse manager | Anna | Module 10 quality |
| Decide: Claude API key provisioning for onboarding LLM calls | Anna | Module 10 |
| Validate series derivation logic against real schedule data | Anna + Joey | Modules 5 and 6 |
