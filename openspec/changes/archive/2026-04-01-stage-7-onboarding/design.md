## Context

New clubhouse managers currently land on an empty dashboard. The onboarding wizard collects answers about their facility setup and generates a personalized set of recurring tasks. The Claude API call is stubbed for now — the wizard UI and API route are fully built, but task generation returns a hardcoded sample set until an API key is provisioned.

Existing DB columns (`has_completed_onboarding`, `recurring_tasks`, `contacts`) are already in place from earlier stages. No migrations needed.

## Goals / Non-Goals

**Goals:**
- 7-screen questionnaire wizard at `/onboarding`
- API route that bulk-inserts recurring tasks and marks onboarding complete
- App shell gate: CM with `has_completed_onboarding = false` cannot access other routes
- "Re-run Onboarding" option on Recurring Tasks page
- Contacts pre-population from the key contacts step

**Non-Goals:**
- Real Claude API integration (deferred — stub returns sample tasks)
- GM or player onboarding flows
- Editing questionnaire answers after completion (re-run replaces)
- Per-step save/resume (wizard is in-memory; submit is atomic)

## Decisions

### Wizard state: in-memory only
**Decision:** All 7 screens share a single React state object. Nothing persists to DB until the final submit.
**Why:** The questionnaire has no value unless fully completed. Partial saves would require a new table. Re-run replaces everything anyway.
**Alternative considered:** Save each step to `localStorage` for crash recovery. Rejected — wizard is short, and a partial recovery that auto-submits wrong tasks would be worse than re-running.

### API route stubs task generation
**Decision:** `/api/onboarding/generate-tasks` accepts answers and returns a hardcoded set of ~20 sample tasks covering common categories.
**Why:** Claude API key not yet available. The stub makes the full flow testable end-to-end right now. Swapping in real Claude generation later is a one-function change.
**Shape of the stub:** Returns tasks matching the same schema as the real response (array of `{ title, description, category, visibility, game_day_period?, default_time? }`).

### Re-run: replace or merge
**Decision:** Re-run shows a choice: "Replace all existing recurring tasks" or "Add to existing." Both call the same generate endpoint; replace deletes all before inserting.
**Why:** Managers restructuring their workflow want a clean slate. Managers adding a second clubhouse want to merge.

### Contacts pre-population
**Decision:** The final wizard step collects up to 3 key contacts (trainer, field manager, visiting clubhouse contact). On submit, these are upserted into the `contacts` table using the same `createContact` function from Stage 3.
**Why:** Avoids a separate UI interaction for the most important contacts.

### Gate in layout, not middleware
**Decision:** The onboarding gate is a `useEffect` + `router.replace()` in `app/(app)/layout.tsx`, not Next.js middleware.
**Why:** The auth token is available in React context (client-side only). Middleware can't read the Supabase JWT without a cookie; our auth flow uses a postMessage bootstrap. The gate check is fast — user is already authenticated.

## Risks / Trade-offs

- **Stub divergence risk**: If the Claude response schema changes before integration, the stub output may not match. Mitigation: define and validate the task schema in one shared type, used by both stub and real route.
- **Re-run deletes tasks**: "Replace all" is destructive. Mitigation: confirmation dialog clearly states "this will delete all current recurring tasks."
- **Gate flicker**: Layout renders briefly before the redirect fires. Mitigation: render `null` while checking `has_completed_onboarding` — same pattern as the existing auth gate.

## Migration Plan

No DB migrations. Steps:
1. Implement wizard page + API route
2. Add gate to layout
3. Update seed data: set `has_completed_onboarding = false` for the dev CM user to test gate
4. Add re-run button to Recurring Tasks page

Rollback: feature is gated to `has_completed_onboarding === false`. Existing users with `= true` are unaffected.
