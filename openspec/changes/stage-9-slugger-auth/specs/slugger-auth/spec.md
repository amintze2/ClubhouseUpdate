## MODIFIED Requirements

### Requirement: Widget sends ready signal on mount
On mount the widget SHALL post `{ type: "SLUGGER_WIDGET_READY", widgetId: "clubhouse-management" }` to `window.parent` for each origin in the `SLUGGER_ALLOWED_ORIGINS` allowlist individually. It SHALL NOT use `"*"` as the target origin.

#### Scenario: Ready signal sent to each allowed origin
- **WHEN** the widget mounts in the browser
- **THEN** `window.parent.postMessage(...)` is called once per origin in `SLUGGER_ALLOWED_ORIGINS` within 100ms

#### Scenario: Auth error shown on timeout
- **WHEN** no `SLUGGER_AUTH` message is received within 10 seconds of mount
- **THEN** the widget displays an auth error screen and stops waiting

### Requirement: Three-path identity verification
The bootstrap endpoint SHALL verify identity via a chain of three paths, stopping at the first success.

**Path 1 — Slugger API:** `GET https://alpb-analytics.com/api/users/me` with `Authorization: Bearer <bootstrapToken>`. If 200, this is authoritative. The user object is at `response.data` (nested under a `data` key). The full response SHALL be logged to the server console for debugging.

**Path 2 — Payload fallback:** If Path 1 returns non-200, use `payload.user` directly from the `SLUGGER_AUTH` message.

**Path 3 — Cognito fallback:** If Path 2 is also unavailable, decode the bootstrapToken as a Cognito RS256 JWT, verify the signature against the JWKS endpoint, and call `Cognito.GetUser` for name and email.

#### Scenario: Path 1 response parsed correctly
- **WHEN** the Slugger API returns 200 with body `{ "success": true, "data": { "id": 42, ... } }`
- **THEN** the user identity is read from `response.data`, not the top-level response object

#### Scenario: Path 1 response logged
- **WHEN** the Slugger API returns any response
- **THEN** the full response body is logged to the server console (for teamRole discovery)

#### Scenario: Path 1 fails, Path 2 used
- **WHEN** the Slugger API returns non-200
- **THEN** `payload.user` from the `SLUGGER_AUTH` message is used as the identity

#### Scenario: Bootstrap token never stored
- **WHEN** any verification path completes
- **THEN** the `bootstrapToken` is not persisted anywhere (not in DB, not in session, not in logs)

## ADDED Requirements

### Requirement: Widget is embeddable in Slugger via iframe
The app SHALL include a `Content-Security-Policy` header with `frame-ancestors 'self' https://alpb-analytics.com https://www.alpb-analytics.com` on all routes, allowing Slugger to embed the widget in an iframe.

#### Scenario: Slugger can embed the widget
- **WHEN** the Slugger platform attempts to load the app URL in an iframe
- **THEN** the browser does not block the load due to frame-ancestors policy
