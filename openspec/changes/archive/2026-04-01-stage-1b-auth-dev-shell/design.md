## Context

The app runs inside an `<iframe>` embedded in the Slugger platform at `alpb-analytics.com`. Slugger controls the parent window and owns the user session. The auth contract with Slugger is fixed — message types, payload shapes, and the verification endpoint cannot change. The entire identity flow must work within this constraint.

Stage 1a established the schema and confirmed that RLS policies require JWTs with `sub = users.id` (integer as text) and `team_id` (integer as text). The bootstrap endpoint is the only place that produces these JWTs — every feature stage depends on it working correctly.

No active users. All Stage 1b work is locally testable via the dev harness + local Supabase. Production is untouched until Stage 8.

## Goals / Non-Goals

**Goals:**
- A working auth flow from Slugger postMessage → identity verification → Supabase JWT
- A React auth context that makes the current user available to every component
- An app shell with role-based navigation that renders the right tabs per role
- A local dev environment where any developer can test all three roles without Slugger access
- Dev mode that is completely disabled in production (no code path reachable)

**Non-Goals:**
- Any feature pages beyond placeholder routes (Stage 2+)
- Field manager role (waiting on Rick White)
- Cognito JWKS caching or refresh (the fallback path is last-resort, not optimized)
- Session refresh / token rotation (Supabase JWT is 1 hour; re-auth on expiry is handled by re-running the postMessage flow, which Slugger controls)

## Decisions

### 1. JWT signing with `jose`, not `jsonwebtoken`

`jose` is the standard for Edge Runtime compatible JWT signing. Next.js API routes run on Node.js (not Edge), so either library works — but `jose` is what Supabase's own ecosystem uses and has no native bindings to worry about.

**Alternative considered:** `jsonwebtoken`. Works fine on Node.js but requires the `--experimental-vm-modules` flag in some environments. `jose` is cleaner.

### 2. JWT claim shape: `sub` = `users.id`, not `slugger_user_id`

The RLS policies (confirmed in Stage 1a smoke test) use `(auth.jwt() ->> 'sub')::bigint` to filter user-scoped tables. `users.id` is a bigint. `slugger_user_id` is a text UUID — casting it to bigint would fail.

The bootstrap endpoint upserts the user and gets back `users.id`, then uses that integer as the JWT `sub`.

**Custom claim names:** Supabase reserves `role` in JWTs for the Postgres role (`authenticated`). We use `role_` (with trailing underscore) for the app role to avoid collision.

### 3. Slugger verification: three-path chain, stop at first success

```
Path 1: GET https://alpb-analytics.com/api/users/me
         Authorization: Bearer <bootstrapToken>
         → 200: authoritative, use this identity

Path 2: Payload fallback
         → If Path 1 returns non-200, use payload.user directly

Path 3: Cognito JWT fallback
         → Decode bootstrapToken as RS256 JWT, fetch JWKS, verify signature,
           call Cognito.GetUser for name/email
         → Only reached if Path 1 and Path 2 both fail
```

Each path resolves to the same output shape: `{ sluggerUserId, userName, teamId }`. The bootstrap endpoint is agnostic to which path succeeded.

**Alternative considered:** Always verify via Slugger API, fail hard if it's down. Rejected: Slugger has had outages and the bootstrap token contains everything we need. The fallback chain is explicitly designed by Slugger.

### 4. Dev mode is an env-var flag, not a build flag

`NEXT_PUBLIC_DEV_MODE=true` enables dev mode. In production Vercel, this var is not set. The checks are `if (process.env.NEXT_PUBLIC_DEV_MODE === 'true')` — no build-time tree shaking needed, the runtime check is sufficient and the code surface is small.

**What dev mode bypasses:**
- Slugger SDK: skips postMessage handshake, injects mock user from env or dev toolbar selection
- Bootstrap endpoint: skips Slugger API call and Cognito validation, trusts mock payload directly
- Both bypasses are behind explicit `DEV_MODE` guards that are unreachable in production

### 5. App shell routing: Next.js App Router with `(app)` route group

The `(app)` route group wraps all authenticated pages in a shared layout (`app/(app)/layout.tsx`) that:
1. Reads `useAuth()` — redirects to an auth error screen if not authenticated
2. Redirects clubhouse managers to `/onboarding` if `has_completed_onboarding = false`
3. Renders sidebar (desktop) + bottom tab bar (mobile) based on `user.role`

Pages themselves are stubs (just `<div>Coming soon</div>`) in Stage 1b — filled in by subsequent stages.

### 6. Contact bar as a layout slot, not a data component

The contact bar lives in the `(app)` layout but renders as a collapsed stub in Stage 1b. It becomes data-connected in Stage 3 (Contacts module). This avoids a data dependency in the shell that would block Stage 1b.

## Risks / Trade-offs

**Slugger API is down at bootstrap time** → Mitigation: Path 2 (payload fallback) handles this. The `payload.user` object is always present in the `SLUGGER_AUTH` message.

**Origin allowlist misconfigured lets malicious parent inject auth** → Mitigation: Allowlist is a constant in `slugger-sdk.ts`, reviewed in code. Unknown origins are silently dropped (no error, no auth). Tested in specs.

**`role_` JWT claim name could cause confusion** → Mitigation: Named explicitly in the design doc and in code comments. The claim is `role_` everywhere — no magic.

**Dev mode accidentally enabled in production** → Mitigation: `NEXT_PUBLIC_DEV_MODE` is not set in the Vercel project environment variables. The bootstrap endpoint's dev bypass also checks `process.env.NEXT_PUBLIC_DEV_MODE` server-side, so a client-side spoof doesn't help.

**Cognito JWKS fetch latency on Path 3** → Accepted trade-off. Path 3 is last resort only and involves a network call to AWS. If it's slow, the auth takes longer — but this only happens when both Slugger's API and the payload fallback have failed, which should be extremely rare.

## Migration Plan

Local only for this stage. No production changes.

1. `supabase db reset` — re-apply migrations (already done in Stage 1a)
2. `npm run dev` — start Next.js
3. Open `scripts/dev-harness.html` — verify role switching works
4. Open `http://localhost:3000` directly — verify auto-inject from env vars works

## Open Questions

- **Rick White / field manager role**: `mapSluggerRole()` will have a TODO comment for the field manager mapping. When confirmed, add the case and update `UserRole` if needed.
- **Cognito region and user pool ID**: needed for Path 3. These should be in env vars (`COGNITO_REGION`, `COGNITO_USER_POOL_ID`). If not available during development, Path 3 can be stubbed to throw and rely on Path 1/2.
