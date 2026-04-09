## 1. Dependencies & Environment

- [x] 1.1 Add `ai` and `@ai-sdk/google` to `package.json` and install
- [x] 1.2 Add `GOOGLE_GENERATIVE_AI_API_KEY` to `.env.local` and document in `.env.example` / README

## 2. Remove Old Wizard

- [x] 2.1 Delete `components/onboarding/wizard-shell.tsx`
- [x] 2.2 Delete `components/onboarding/step1-facility.tsx` through `step7-contacts.tsx` (7 files)
- [x] 2.3 Remove `generateTasksStub`, `OnboardingAnswers`, and all step answer types from `lib/api/onboarding.ts` — keep `GeneratedTask` and `KeyContact` types

## 3. AI Streaming Route

- [x] 3.1 Create `app/api/onboarding/chat/route.ts` — POST handler using AI SDK `streamText` with Gemini 2.0 Flash
- [x] 3.2 Write the system prompt: domain knowledge (task categories, visibility rules, game_day_period mapping), day-by-day walkthrough framing, target of 3–5 turns
- [x] 3.3 Define the `finalize_setup` tool schema in the route: `{ recurring_tasks: GeneratedTask[] }` with enum constraints on `category`, `visibility`, `game_day_period`
- [x] 3.4 Validate `GOOGLE_GENERATIVE_AI_API_KEY` env var at route load time and return 500 with clear error if missing

## 4. Update generate-tasks Route

- [x] 4.1 Update `app/api/onboarding/generate-tasks/route.ts` input schema: accept `{ user_id, team_id, tasks: GeneratedTask[], mode }` instead of `OnboardingAnswers`
- [x] 4.2 Remove the `generateTasksStub` call and `OnboardingAnswers` destructuring
- [x] 4.3 Add per-task enum validation before insert; filter invalid tasks; return 400 if all tasks invalid
- [x] 4.4 Remove contact upsert logic (Step 7 contacts no longer collected)

## 5. Chat UI Component

- [x] 5.1 Create `components/onboarding/onboarding-chat.tsx` — client component using AI SDK `useChat` hook, renders message list and input
- [x] 5.2 Style message bubbles: AI messages left-aligned, user messages right-aligned, typing indicator while AI is responding
- [x] 5.3 Wire `useChat` to `/api/onboarding/chat` with `maxSteps` set to allow multi-turn tool use

## 6. Preview / Confirm Screen

- [x] 6.1 Create `components/onboarding/task-preview.tsx` — receives `GeneratedTask[]`, renders tasks grouped by Game Day (morning / pre-game / post-game) and Off Day
- [x] 6.2 Add confirm button: POST to `/api/onboarding/generate-tasks`, call `updateUser({ has_completed_onboarding: true })` on success, redirect to `/recurring-tasks`
- [x] 6.3 Add back button: return to chat with full conversation history intact
- [x] 6.4 Handle confirm POST error: show toast, stay on preview screen

## 7. Onboarding Page Rewrite

- [x] 7.1 Rewrite `app/(app)/onboarding/page.tsx` to render `OnboardingChat` by default
- [x] 7.2 Detect `finalize_setup` tool invocation via AI SDK `toolInvocations` — switch to `TaskPreview` when tool is called
- [x] 7.3 Preserve `?rerun=1&mode=replace|merge` support — pass `mode` through to the confirm POST body
- [x] 7.4 Keep access guard: non-CM roles and completed CMs (without rerun param) render null
