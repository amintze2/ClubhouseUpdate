# Tasks: stage-9-slugger-auth

## Fix 1 — SLUGGER_WIDGET_READY origin (slugger-sdk.ts)
- [x] In `lib/slugger-sdk.ts`, replace the single `window.parent.postMessage(..., "*")` call with a loop that posts to each origin in `SLUGGER_ALLOWED_ORIGINS`

## Fix 2 — Slugger API response parsing + logging (bootstrap/route.ts)
- [x] In `verifyViaSluggerApi`, add `console.log("Slugger /api/users/me response:", JSON.stringify(data))` after parsing the response body
- [x] Change identity extraction to read from `data.data ?? data` (defensive against both response shapes)
- [x] Pass `teamRole` from the Slugger response through to `mapSluggerRole`

## Fix 3 — Role mapping from teamRole (lib/role-mapping.ts)
- [x] Update `mapSluggerRole` signature to accept `(role: string, teamRole?: string)`
- [x] Add teamRole-based primary mapping: `"clubhouse manager"` → `clubhouse_manager`, `"manager"` → `general_manager`, `"player"` → `player`
- [x] Keep existing role-based fallback for when teamRole is absent
- [x] Update all call sites to pass teamRole where available

## Fix 4 — CSP frame-ancestors (next.config.ts)
- [x] Add `async headers()` to `next.config.ts` returning `Content-Security-Policy: frame-ancestors 'self' https://alpb-analytics.com https://www.alpb-analytics.com` on all routes

## Fix 5 — Onboarding gate redirect (app/(app)/layout.tsx)
- [x] Add `usePathname` hook import
- [x] Replace the render-children-for-unboarded-CM block with: if not on `/onboarding`, call `router.replace("/onboarding")` and return `null`

## Deploy
- [ ] Commit and push all changes
- [ ] Deploy to production (`vercel --prod`)
- [ ] Remove `NEXT_PUBLIC_DEV_MODE` from Vercel production env vars to test real Slugger auth
- [ ] Check Vercel function logs for the `Slugger /api/users/me response:` log line to confirm `teamRole` values
