## 1. API Route — Task Generation

- [x] 1.1 Create `lib/api/onboarding.ts` — define `OnboardingAnswers` type (all 7 step payloads) and `GeneratedTask` type matching `recurring_tasks` insert shape
- [x] 1.2 Create `app/api/onboarding/generate-tasks/route.ts` — POST handler: validate body, call stub generator, bulk-insert into `recurring_tasks` (delete first if mode=replace), upsert key contacts, set `has_completed_onboarding = true`, return created tasks
- [x] 1.3 Implement stub task generator in `lib/api/onboarding.ts` — ~20 sample tasks covering all categories; exclude laundry tasks if outsourced, include field prep tasks based on selected responsibilities

## 2. Onboarding Wizard — Page and State

- [x] 2.1 Replace `app/(app)/onboarding/page.tsx` stub — add `"use client"`, wizard state object, step index state, guard redirect (non-CM or already-onboarded → redirect to `/`)
- [x] 2.2 Create wizard step components in `components/onboarding/` — one component per step (steps 1–7), each receives current step values and an `onChange` callback
- [x] 2.3 Step 1 (Facility Basics): roster size number input, home/visitor clubhouse yes/no, laundry on-site vs outsourced radio — roster size required
- [x] 2.4 Step 2 (Laundry & Cleaning): equipment checkboxes, uniform/towel frequency selects — all optional
- [x] 2.5 Step 3 (Food & Meals): prep method radio, meal type checkboxes, coffee/drinks yes/no — all optional
- [x] 2.6 Step 4 (Field & Equipment): field prep checkboxes, equipment room checkboxes — all optional
- [x] 2.7 Step 5 (Medical & Safety): AED/first-aid/training-room yes/no toggles — all optional
- [x] 2.8 Step 6 (Game-Day Specifics): arrival time input, teardown duration select, notes textarea — all optional
- [x] 2.9 Step 7 (Key Contacts): three labelled contact sub-forms (Head Trainer, Field Manager, Visiting Clubhouse Contact) — each has name/phone/email; all optional

## 3. Wizard UI Shell

- [x] 3.1 Create `components/onboarding/wizard-shell.tsx` — step indicator ("Step N of 7 — Step Name"), Back/Next/Finish buttons, loading state on final submit, error toast on failure
- [x] 3.2 Wire submit in page: POST to `/api/onboarding/generate-tasks`, show spinner, on success `router.replace("/recurring-tasks")`, on error show toast

## 4. Re-run Onboarding

- [x] 4.1 Add "Re-run Onboarding" button to `app/(app)/recurring-tasks/page.tsx` — visible for `role === "clubhouse_manager"` only
- [x] 4.2 Create mode-selection dialog: "Replace all existing tasks" (shows destructive confirmation) or "Add to existing" — stores selected mode in state
- [x] 4.3 Pass mode through wizard to the generate-tasks API submit call

## 5. Seed Data Update

- [x] 5.1 Update `supabase/seed.sql` — set `has_completed_onboarding = false` for the dev CM user (Casey Morgan / dev-cm-1) so the onboarding gate can be tested in dev
