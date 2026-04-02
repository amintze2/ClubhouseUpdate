## Overview

Five targeted fixes across four files. No new abstractions — each fix is a minimal correction to existing code.

## Fix 1 — Slugger API response parsing (`bootstrap/route.ts`)

The WIDGET-AUTH.md spec defines the `/api/users/me` response shape as:
```json
{ "success": true, "data": { "id": 42, "email": "...", "role": "league", "teamRole": "manager", ... } }
```

Current code reads `data.id` (top-level), but the user object is at `data.data`.

**Change:** In `verifyViaSluggerApi`, parse `const u = responseBody.data ?? responseBody` to handle both shapes defensively. Also `console.log` the full response body so `teamRole` values are visible in Vercel function logs during testing.

## Fix 2 — Role mapping from `teamRole` (`lib/role-mapping.ts`)

Current `mapSluggerRole` maps the top-level Slugger `role` field. The WIDGET-AUTH.md reveals the meaningful field is `teamRole` (e.g. `"manager"`, `"clubhouse manager"`, `"player"`). The function signature changes to accept both `role` and `teamRole`.

**Assumed `teamRole` mappings (to be confirmed via production logs):**
| teamRole | app role |
|---|---|
| `"clubhouse manager"` | `clubhouse_manager` |
| `"manager"` | `general_manager` |
| `"player"` | `player` |
| `undefined` / `null` | fall back to `role`-based mapping |

The `role`-based fallback is kept so dev-mode payloads (which don't have `teamRole`) still work.

Bootstrap's `verifyViaSluggerApi` passes `teamRole` from the Slugger response. `verifyViaPayload` continues to pass only `role` (the postMessage user object doesn't include `teamRole`).

## Fix 3 — SLUGGER_WIDGET_READY origin (`lib/slugger-sdk.ts`)

Current code posts to `"*"` which the WIDGET-AUTH.md explicitly says not to do.

**Change:** Post to each origin in `SLUGGER_ALLOWED_ORIGINS` individually (same list already used for incoming message validation).

## Fix 4 — CSP frame-ancestors (`next.config.ts`)

Without this header browsers block the page from being loaded in an iframe.

**Change:**
```ts
async headers() {
  return [{
    source: "/(.*)",
    headers: [{
      key: "Content-Security-Policy",
      value: "frame-ancestors 'self' https://alpb-analytics.com https://www.alpb-analytics.com",
    }],
  }];
}
```

## Fix 5 — Onboarding gate redirect (`app/(app)/layout.tsx`)

The Stage 7 fix changed unboarded CM handling from "redirect to /onboarding" to "render children." This means unboarded CMs who land on `/` see the blank "Clubhouse Management" root page instead of the wizard.

**Change:** Restore the redirect: if CM + `has_completed_onboarding === false` + not already on `/onboarding`, call `router.replace("/onboarding")` and return `null`.

## Decision log

- `teamRole` mapping uses assumed values; production logs will confirm or require adjustment
- Fallback to `role`-based mapping preserved for dev mode compatibility
- No changes to JWT structure, RLS policies, or database schema
