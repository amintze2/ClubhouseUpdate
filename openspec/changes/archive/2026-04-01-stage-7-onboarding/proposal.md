## Why

New clubhouse managers have no recurring tasks after first login, leaving them with an empty dashboard and no guidance on what to set up. The onboarding wizard collects structured answers about their facility and workflow, then generates a personalized recurring task list so they can start using the app on day one.

## What Changes

- New multi-step questionnaire wizard at `/onboarding` (7 screens)
- New API route `/api/onboarding/generate-tasks` — accepts questionnaire answers, stubs Claude task generation (returns hardcoded sample tasks until API key is provisioned), bulk-inserts into `recurring_tasks`, sets `has_completed_onboarding = true`
- Onboarding gate in the app shell: CMs with `has_completed_onboarding = false` are redirected to `/onboarding` and cannot access other routes until complete
- "Re-run Onboarding" button on the Recurring Tasks page — reopens the wizard and offers to replace or merge existing recurring tasks
- Contacts pre-population on the final questionnaire screen (trainer, field manager, visiting clubhouse contact)

## Capabilities

### New Capabilities
- `onboarding-wizard`: Multi-step questionnaire wizard UI — 7 screens covering facility basics, laundry, food, field/equipment, medical, game-day specifics, and key contacts
- `onboarding-task-generation`: API route that receives answers and produces recurring tasks (stubbed for now, Claude integration added when API key is available)
- `onboarding-gate`: App shell redirect logic that blocks CM access until onboarding is complete

### Modified Capabilities
- `recurring-tasks`: Add "Re-run Onboarding" trigger from the Recurring Tasks page
- `contact-management`: Contacts pre-population from the final onboarding screen (key contacts step)
- `app-shell`: Add onboarding gate redirect for CMs with `has_completed_onboarding = false`

## Impact

- `app/(app)/onboarding/page.tsx` — new page (currently a stub)
- `app/api/onboarding/generate-tasks/route.ts` — new API route
- `app/(app)/layout.tsx` — add gate redirect check
- `app/(app)/recurring-tasks/page.tsx` — add re-run button
- `lib/api/onboarding.ts` — new API module (submit answers, re-run)
- `supabase/migrations/` — no schema changes needed (`has_completed_onboarding` and `recurring_tasks` already exist)
- No new npm dependencies (Claude SDK added later when API key is ready)
