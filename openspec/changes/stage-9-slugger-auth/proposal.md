## Why

First real-platform test revealed four bugs in the Slugger iframe integration that prevent the app from authenticating correctly when embedded: the Slugger API response is parsed incorrectly, the widget ready signal uses an unsafe wildcard origin, role mapping doesn't use the `teamRole` field from the Slugger response, and the app is not configured to allow iframe embedding.

## What Changes

- Fix `verifyViaSluggerApi` to read `response.data` (the nested user object) instead of the top-level response body
- Add `console.log` of the full Slugger `/api/users/me` response so `teamRole` values can be confirmed in production logs
- Change `SLUGGER_WIDGET_READY` postMessage to target specific Slugger origins instead of `"*"`
- Refactor `mapSluggerRole` to derive the app role from `teamRole` (not the top-level `role` field), with assumed values `"manager"` → `general_manager`, `"clubhouse manager"` → `clubhouse_manager`, `"player"` → `player`
- Add `Content-Security-Policy: frame-ancestors` header in `next.config.ts` to allow Slugger domains to embed the widget
- Fix the layout gate to redirect unboarded CMs to `/onboarding` (restoring spec-required behavior that was broken in Stage 7)

## Capabilities

### New Capabilities
- `widget-embedding`: CSP `frame-ancestors` configuration allowing Slugger domains to embed the app as an iframe

### Modified Capabilities
- `slugger-auth`: Fix Path 1 response parsing; fix READY signal origin; add response logging
- `role-mapping`: Derive role from `teamRole` field instead of top-level `role`; update assumed value mappings
- `onboarding-gate`: Restore redirect-to-/onboarding behavior for unboarded CMs (was incorrectly changed to render-children in Stage 7)

## Impact

- `lib/slugger-sdk.ts` — SLUGGER_WIDGET_READY origin fix
- `app/api/auth/bootstrap/route.ts` — response parsing fix, response logging
- `lib/role-mapping.ts` — teamRole-based mapping
- `next.config.ts` — CSP headers
- `app/(app)/layout.tsx` — onboarding gate redirect fix
