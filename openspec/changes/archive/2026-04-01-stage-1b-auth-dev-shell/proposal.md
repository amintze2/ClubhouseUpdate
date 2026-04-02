## Why

Stage 1a produced the schema and scaffolding but left the app unauthenticated and without a local development environment. Nothing else in the rebuild can be built or tested without the Slugger auth flow, a working app shell, and a realistic local setup that doesn't require access to the real Slugger platform.

## What Changes

- **Slugger postMessage auth flow** — on mount the widget sends `SLUGGER_WIDGET_READY` to `window.parent`, receives a `SLUGGER_AUTH` message, verifies the bootstrap token via Slugger's API (with two fallback paths), upserts the user, signs a Supabase JWT embedding `sub`, `team_id`, and `role_`, and returns a session to the client
- **Auth context** — `AuthProvider` wraps the app, exposes `useAuth()` hook with `{ user, isLoading, isAuthenticated, error }`
- **Role mapping** — `mapSluggerRole()` converts Slugger role strings to `UserRole` enum values
- **App shell** — root layout with sidebar (desktop) and bottom tab bar (mobile), role-based navigation, contact bar placeholder, onboarding gate
- **Local Supabase dev environment** — `supabase/seed.sql` with realistic data across all roles; `supabase init` config
- **Dev harness** — `scripts/dev-harness.html` that mimics the Slugger parent window, sends mock `SLUGGER_AUTH`, and provides role/team/user switcher controls
- **Dev mode bypass** — when `NEXT_PUBLIC_DEV_MODE=true`, Slugger SDK skips the real handshake and injects a mock user from env vars; bootstrap endpoint skips external verification
- **Dev toolbar** — floating bar (dev mode only) showing current user + role with a live user-switcher dropdown
- **`scripts/dev-setup.sh`** — one-command setup from clone to running app

## Capabilities

### New Capabilities
- `slugger-auth`: Slugger iframe postMessage handshake, three-path identity verification, Supabase JWT signing, user upsert
- `auth-context`: React AuthProvider, useAuth hook, session state management
- `role-mapping`: Slugger role string → UserRole enum conversion
- `app-shell`: Sidebar, mobile tab bar, contact bar slot, onboarding gate, role-based routing
- `dev-environment`: Seed data, dev harness, dev mode bypass, dev toolbar, setup script

### Modified Capabilities
- `database-schema`: No requirement changes — JWT claim shape (`sub` = `users.id`, `team_id`, `role_`) confirmed by RLS smoke test in Stage 1a and already reflected in the migration

## Impact

- New files: `app/api/auth/bootstrap/route.ts`, `lib/slugger-sdk.ts`, `lib/auth-context.tsx`, `lib/role-mapping.ts`, `app/(app)/layout.tsx`, `components/layout/sidebar.tsx`, `components/layout/mobile-nav.tsx`, `components/layout/contact-bar.tsx`, `components/layout/dev-toolbar.tsx`, `scripts/dev-harness.html`, `scripts/dev-setup.sh`, `supabase/seed.sql`
- New dependencies: `jose` (JWT signing server-side), `aws-jwt-verify` (Cognito fallback)
- `lib/supabase.ts` from Stage 1a is the Supabase client used throughout — no changes needed
- RLS policies from Stage 1a depend on `sub` = `users.id` and `team_id` in JWT — the bootstrap must produce exactly this shape
