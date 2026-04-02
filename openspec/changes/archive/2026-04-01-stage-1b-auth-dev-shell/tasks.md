## 1. Role Mapping

- [x] 1.1 Write `lib/role-mapping.ts` — `mapSluggerRole(sluggerRole: string): UserRole` with mappings for `"league"`, `"gm"`, `"player"`; throw on unknown role with a TODO comment for field manager

## 2. Slugger SDK

- [x] 2.1 Write `lib/slugger-sdk.ts` — `initSluggerAuth({ onAuth, onError })` that sends `SLUGGER_WIDGET_READY` on call, registers a `message` event listener, validates origin against allowlist, and sets a 10-second timeout
- [x] 2.2 Define the `SLUGGER_ALLOWED_ORIGINS` allowlist constant (`alpb-analytics.com` + staging domain); load staging domain from env var `SLUGGER_STAGING_ORIGIN` if set
- [x] 2.3 In dev mode (`NEXT_PUBLIC_DEV_MODE=true`): skip real handshake, auto-inject mock user from `DEV_USER_ROLE` / `DEV_USER_TEAM` / `DEV_USER_ID` env vars after a short delay instead of showing an error on timeout

## 3. Bootstrap API Route

- [x] 3.1 Install `jose` for JWT signing
- [x] 3.2 Write `app/api/auth/bootstrap/route.ts` — POST handler that receives `{ token, sluggerUser }` and runs the three-path verification chain
- [x] 3.3 Implement Path 1: `GET https://alpb-analytics.com/api/users/me` with bearer token; extract `id`, `firstName`, `lastName`, `teamId` from response
- [x] 3.4 Implement Path 2: use `sluggerUser` payload directly if Path 1 returns non-200
- [x] 3.5 Implement Path 3: decode bootstrapToken as Cognito RS256 JWT, fetch JWKS from `https://cognito-idp.<region>.amazonaws.com/<userPoolId>/.well-known/jwks.json`, verify signature, call `Cognito.GetUser`; require `COGNITO_REGION` and `COGNITO_USER_POOL_ID` env vars (skip Path 3 gracefully if not set)
- [x] 3.6 Upsert user in `users` table: insert if new, update `user_name` if changed; use service role key to bypass RLS
- [x] 3.7 Sign Supabase JWT with `jose` using `SUPABASE_JWT_SECRET`: claims `{ sub: String(users.id), team_id: String(users.team_id), role_: appRole, role: "authenticated", iss: "supabase", aud: "authenticated" }`, 1-hour expiry
- [x] 3.8 Return `{ user: <full db row + team_name>, session: { access_token, expires_in: 3600 } }`
- [x] 3.9 In dev mode: skip Path 1 and Path 3, trust mock payload directly; guard is `process.env.NEXT_PUBLIC_DEV_MODE === 'true'`

## 4. Auth Context

- [x] 4.1 Write `lib/auth-context.tsx` — `AuthProvider` component that calls `initSluggerAuth` on mount, POSTs to `/api/auth/bootstrap` on receiving auth, stores `{ user, session }` in React state, calls `supabase.auth.setSession()` with the access token
- [x] 4.2 Expose `useAuth()` hook returning `{ user, isLoading, isAuthenticated, error }`; throw if called outside `AuthProvider`
- [x] 4.3 Wire `AuthProvider` into `app/layout.tsx` so it wraps the entire app

## 5. App Shell

- [x] 5.1 Write `app/(app)/layout.tsx` — reads `useAuth()`, shows loading spinner while `isLoading`, shows auth error screen if not authenticated, redirects CM with `has_completed_onboarding = false` to `/onboarding`, otherwise renders shell
- [x] 5.2 Write `components/layout/sidebar.tsx` — desktop sidebar with role-based nav items; active route highlighted; collapses to icon-only at narrow desktop widths
- [x] 5.3 Write `components/layout/mobile-nav.tsx` — bottom tab bar for mobile (< 768px); max 5 visible tabs + "More" overflow for clubhouse manager
- [x] 5.4 Write `components/layout/contact-bar.tsx` — collapsed stub with "Key Contacts" label; no data connection yet (Stage 3)
- [x] 5.5 Integrate sidebar, mobile-nav, and contact-bar into the `(app)` layout; Tailwind responsive classes handle desktop/mobile switch
- [x] 5.6 Create stub pages for all routes: `checklists`, `calendar`, `recurring-tasks`, `inventory`, `meals`, `messages`, `reports`, `player-info`, `player-meals`, `player-report`, `onboarding` — each renders a `<div>` with the page name

## 6. Seed Data

- [x] 6.1 Write `supabase/seed.sql` — insert teams (Long Island Ducks, Lancaster Stormers, York Revolution, Southern Maryland Blue Crabs)
- [x] 6.2 Seed users: at least one CM, GM, and player per relevant team; one CM with `has_completed_onboarding = false` to test onboarding gate; all `slugger_user_id` values prefixed `dev-`
- [x] 6.3 Seed games: a 2-week window with `CURRENT_DATE` as a home game day for team 1; mix of home and away series; at least one off day
- [x] 6.4 Seed recurring tasks, one-off tasks, recurring completions for CM-1
- [x] 6.5 Seed inventory items (mix of stocked/low/out), meals, contacts, conversations, messages, and issues with comments
- [x] 6.6 Confirm `supabase db reset` loads all seed data with no errors

## 7. Dev Harness

- [x] 7.1 Write `scripts/dev-harness.html` — embeds widget at `http://localhost:3000` in an iframe; listens for `SLUGGER_WIDGET_READY`; responds with `SLUGGER_AUTH` using the selected mock user
- [x] 7.2 Add control panel: role buttons (CM / GM / Player), team dropdown, user dropdown; switching any reloads the iframe with the new mock auth payload
- [x] 7.3 Hardcode the `MOCK_USERS` map in the harness matching the seeded users

## 8. Dev Toolbar

- [x] 8.1 Write `components/layout/dev-toolbar.tsx` — floating bar rendered only when `NEXT_PUBLIC_DEV_MODE === 'true'`; shows current user name + role; dropdown to switch to any seeded user
- [x] 8.2 User switch in toolbar: calls a context method that clears auth state and re-runs the mock auth flow with the selected user's credentials
- [x] 8.3 Add dev toolbar to `app/(app)/layout.tsx` — rendered after page content, only in dev mode

## 9. Dev Setup Script & Env

- [x] 9.1 Write `scripts/dev-setup.sh` — installs deps, runs `supabase start`, grabs keys from `supabase status`, writes `.env.local`, runs `supabase db reset`
- [x] 9.2 Update `.env.local.example` with all Stage 1b vars: `SUPABASE_JWT_SECRET`, `SLUGGER_STAGING_ORIGIN`, `COGNITO_REGION`, `COGNITO_USER_POOL_ID`

## 10. End-to-End Verification

- [x] 10.1 Open dev harness: CM role authenticates, sidebar shows all 7 tabs, contact bar stub visible
- [x] 10.2 Switch to GM: only Player Reports tab visible
- [x] 10.3 Switch to Player: Player Info, Meal Schedule, Issue Reporting tabs visible
- [x] 10.4 Switch to the unseeded CM (no onboarding): redirected to `/onboarding`
- [x] 10.5 Open `http://localhost:3000` directly with `DEV_USER_ROLE=clubhouse_manager` in `.env.local`: auto-injects mock user, app loads
- [x] 10.6 Dev toolbar visible in dev mode; user switch triggers re-auth with new user
