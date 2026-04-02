## ADDED Requirements

### Requirement: Widget sends ready signal on mount
On mount the widget SHALL post `{ type: "SLUGGER_WIDGET_READY", widgetId: "clubhouse-management" }` to `window.parent` and start a 10-second timeout waiting for a `SLUGGER_AUTH` response.

#### Scenario: Ready signal sent on mount
- **WHEN** the widget mounts in the browser
- **THEN** `window.parent.postMessage({ type: "SLUGGER_WIDGET_READY", widgetId: "clubhouse-management" }, "*")` is called within 100ms

#### Scenario: Auth error shown on timeout
- **WHEN** no `SLUGGER_AUTH` message is received within 10 seconds of mount
- **THEN** the widget displays an auth error screen and stops waiting

### Requirement: Origin validation on incoming messages
The Slugger SDK SHALL validate `event.origin` against an allowlist before processing any `SLUGGER_AUTH` message. Messages from origins not in the allowlist SHALL be silently dropped with no error or state change.

#### Scenario: Valid origin accepted
- **WHEN** a `SLUGGER_AUTH` message arrives from `https://alpb-analytics.com`
- **THEN** the message is processed and the `onAuth` callback is invoked

#### Scenario: Unknown origin silently dropped
- **WHEN** a message arrives from an origin not in the allowlist (e.g., `https://evil.com`)
- **THEN** the message is ignored, no state changes, no error thrown

### Requirement: Three-path identity verification
The bootstrap endpoint SHALL verify identity via a chain of three paths, stopping at the first success.

**Path 1 — Slugger API:** `GET https://alpb-analytics.com/api/users/me` with `Authorization: Bearer <bootstrapToken>`. If 200, this is authoritative.

**Path 2 — Payload fallback:** If Path 1 returns non-200, use `payload.user` directly from the `SLUGGER_AUTH` message.

**Path 3 — Cognito fallback:** If Path 2 is also unavailable, decode the bootstrapToken as a Cognito RS256 JWT, verify the signature against the JWKS endpoint, and call `Cognito.GetUser` for name and email.

#### Scenario: Path 1 succeeds
- **WHEN** the Slugger API returns 200 with a valid user object
- **THEN** that identity is used and Paths 2 and 3 are not attempted

#### Scenario: Path 1 fails, Path 2 used
- **WHEN** the Slugger API returns non-200
- **THEN** `payload.user` from the `SLUGGER_AUTH` message is used as the identity

#### Scenario: Bootstrap token never stored
- **WHEN** any verification path completes
- **THEN** the `bootstrapToken` is not persisted anywhere (not in DB, not in session, not in logs)

### Requirement: User upsert and Supabase JWT issuance
On successful verification the bootstrap endpoint SHALL upsert the user in the `users` table (keyed on `slugger_user_id`) and sign a Supabase JWT.

The JWT SHALL contain:
- `sub`: `users.id` as a string (integer ID from our DB)
- `team_id`: `users.team_id` as a string
- `role_`: the app role string (`clubhouse_manager`, `general_manager`, or `player`)
- `role`: `"authenticated"` (Postgres role for RLS)
- `iss`: `"supabase"`
- `aud`: `"authenticated"`
- `exp`: 1 hour from issue time

#### Scenario: New user created on first login
- **WHEN** a Slugger user authenticates for the first time
- **THEN** a new row is inserted in `users` with correct `slugger_user_id`, `user_name`, `team_id`, and `role`

#### Scenario: Existing user name updated on login
- **WHEN** a returning user authenticates and their name has changed in Slugger
- **THEN** `users.user_name` is updated to the new value

#### Scenario: JWT claims enable RLS
- **WHEN** the issued JWT is used to query `inventory_items`
- **THEN** only items belonging to the user's team are returned (validated by RLS policies from Stage 1a)
