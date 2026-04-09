# Clubhouse Management Widget

A Next.js web app embedded as an iframe widget inside the [Slugger](https://alpb-analytics.com) platform. It gives Atlantic League baseball clubhouse managers, general managers, and players a centralized tool for managing daily operations.

## What it does

| Role | Features |
|------|----------|
| **Clubhouse Manager** | Daily checklists, task calendar, recurring tasks, inventory, meal planning, messages, player reports |
| **General Manager** | Player reports dashboard |
| **Player** | Personal info, meal schedule, issue reporting |

New clubhouse managers complete a 7-step onboarding wizard that generates their recurring task list.

---

## Stack

- **Framework:** Next.js 15 (App Router) on Vercel
- **Database:** Supabase (Postgres + RLS + Realtime)
- **Auth:** Slugger postMessage handshake → `/api/auth/bootstrap` → signed Supabase JWT
- **Styling:** Tailwind CSS

---

## Local development

### Prerequisites

- Node.js 18+
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- A Vercel account (for environment variables reference)

### 1. Clone and install

```bash
git clone https://github.com/amintze2/ClubhouseUpdate.git
cd ClubhouseUpdate
npm install
```

### 2. Start local Supabase

```bash
supabase start
```

This starts a local Postgres instance with migrations applied. The local API URL is `http://127.0.0.1:54321`.

### 3. Seed the database

```bash
supabase db reset
```

This runs `supabase/seed.sql`, which creates 10 ALPB teams, dev users for each role, games, and sample data.

### 4. Set up environment variables

Create `.env.local`:

```env
# Local Supabase (from `supabase status`)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from supabase status>
SUPABASE_SERVICE_ROLE_KEY=<service_role key from supabase status>
SUPABASE_JWT_SECRET=<JWT secret from supabase status>

# Dev mode — skips Slugger postMessage handshake and uses a mock user
NEXT_PUBLIC_DEV_MODE=true

# Dev user defaults (override via dev toolbar in the running app)
NEXT_PUBLIC_DEV_USER_ROLE=league        # league | gm | player
NEXT_PUBLIC_DEV_USER_TEAM=1
NEXT_PUBLIC_DEV_USER_ID=1
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). With `NEXT_PUBLIC_DEV_MODE=true` the app bypasses the Slugger handshake and logs you in as the mock dev user. Use the dev toolbar (bottom of screen) to switch between users and roles.

---

## Testing in the Slugger platform

The Slugger staging environment is at:
```
https://slugger-alb-1518464736.us-east-2.elb.amazonaws.com/dashboard
```

The widget is registered there pointing at `https://clubhouse-ten-lovat.vercel.app`.

### To test with real Slugger auth (no dev mode)

1. Make sure `NEXT_PUBLIC_DEV_MODE` is **not set** in Vercel production. If it is set, remove it and redeploy:
   ```bash
   vercel env rm NEXT_PUBLIC_DEV_MODE production --yes
   vercel --prod
   ```
   If you get `Environment Variable was not found`, it's already unset — no action needed.

2. Open the Slugger staging URL above and navigate to the Clubhouse Management widget.

3. The app will authenticate via the Slugger postMessage flow. Check Vercel function logs for `Bootstrap called without a token` or `Slugger /api/users/me response:` to confirm the auth path being used:
   ```bash
   vercel logs https://clubhouse-ten-lovat.vercel.app
   ```

> **Note:** The Slugger staging environment's `/api/users/widget-token` endpoint currently returns 500, so `bootstrapToken` will be `false`. The app falls back to the user payload from `SLUGGER_AUTH`. Users without a `teamId` in the Slugger payload are assigned to **Test Team (id=11)**.

### To reset back to dev mode

Re-add the env var and redeploy:

```bash
printf "true" | vercel env add NEXT_PUBLIC_DEV_MODE production
vercel --prod
```

> Use `printf` (not `echo`) — `echo` adds a trailing newline that corrupts environment variable values in Vercel.

Once back in dev mode, the app bypasses the Slugger handshake and logs in using `NEXT_PUBLIC_DEV_USER_ROLE` / `NEXT_PUBLIC_DEV_USER_TEAM` / `NEXT_PUBLIC_DEV_USER_ID`. The dev toolbar at the bottom of the screen lets you switch users without redeploying.

---

## Auth flow (production)

```
Slugger parent page
  └─ postMessage SLUGGER_AUTH → our iframe
       └─ POST /api/auth/bootstrap
            ├─ GET https://alpb-analytics.com/api/users/me   (primary)
            └─ sluggerUser payload fallback (if token unavailable)
                 └─ upsert user in Supabase → sign JWT → return session
```

The signed JWT is passed as `Authorization: Bearer <token>` on every Supabase query. RLS policies enforce per-user and per-team data isolation.

---

## Database migrations

Migrations live in `supabase/migrations/`. To create a new one:

```bash
supabase migration new <name>
```

To apply locally:

```bash
supabase db reset
```

To apply to production, push via the Supabase dashboard or `supabase db push`.

---

## Deployment

The app deploys to Vercel automatically on push to `main`. To deploy manually from any branch:

```bash
vercel --prod
```

### Required production environment variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `SUPABASE_JWT_SECRET` | Supabase Legacy JWT secret (used to sign custom JWTs) |
| `COGNITO_REGION` | *(optional)* AWS region for Cognito token fallback |
| `COGNITO_USER_POOL_ID` | *(optional)* Cognito user pool ID for token fallback |
| `SLUGGER_STAGING_ORIGIN` | *(optional)* Extra allowed postMessage origin for staging |

**Do not set `NEXT_PUBLIC_DEV_MODE=true` in production** — it bypasses all auth.

---

## Project structure

```
app/
  (app)/              # Authenticated app shell
    layout.tsx        # Auth gate, sidebar, role-based redirects
    checklists/
    calendar/
    recurring-tasks/
    inventory/
    meals/
    messages/
    reports/
    player-info/
    player-meals/
    player-report/
    onboarding/
  api/
    auth/bootstrap/   # Slugger token exchange → Supabase JWT
    onboarding/       # Generate recurring tasks from wizard answers
components/
  layout/             # Sidebar, MobileNav, ContactBar, DevToolbar
  ui/                 # Shared UI primitives (Toast, etc.)
  onboarding/         # Wizard step components
  contacts/
lib/
  auth-context.tsx    # AuthProvider + useAuth hook
  slugger-sdk.ts      # postMessage handshake with Slugger
  role-mapping.ts     # Slugger role → app role
  supabase.ts         # Supabase client factory (injects JWT)
  types.ts            # Shared TypeScript types
  api/                # Per-table CRUD modules
scripts/              # DB migration utilities
supabase/
  migrations/
  seed.sql
```
