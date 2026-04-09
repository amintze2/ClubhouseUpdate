## Why

The current 7-step wizard asks about infrastructure (do you have washers? do you outsource laundry?) rather than meeting clubhouse managers in their mental model — which is tasks and routines. A conversational chatbot that asks "walk me through your game day" surfaces what the manager actually does, producing a more accurate and personalized recurring task schedule.

## What Changes

- **BREAKING**: Remove the 7-step onboarding wizard (`/onboarding` page, all step components, wizard shell)
- **BREAKING**: Remove `OnboardingAnswers` form data types and `generateTasksStub` from `lib/api/onboarding.ts`
- Add a conversational chat UI at `/onboarding` powered by Vercel AI SDK + Gemini Flash
- AI conducts a semi-open day-by-day walkthrough (~3–5 turns), then calls a `finalize_setup` tool to produce a `GeneratedTask[]` list
- Add a preview/confirm screen where the manager reviews generated tasks before committing
- Simplify `/api/onboarding/generate-tasks` — input changes from `OnboardingAnswers` to `GeneratedTask[]` (AI already did the generation work)
- Add `ai` and `@ai-sdk/google` packages; Gemini 2.0 Flash as primary model (free tier)

## Capabilities

### New Capabilities
- `onboarding-chat`: Conversational chat interface that elicits a recurring task schedule from the manager via day-by-day walkthrough, uses AI tool calling to produce structured task output, and presents a confirm screen before committing to the database

### Modified Capabilities
- `onboarding-wizard`: Requirements replaced — the 7-step form wizard is fully removed; this spec should be retired/superseded by `onboarding-chat`
- `onboarding-task-generation`: Input contract changes from `OnboardingAnswers` to `GeneratedTask[]`; the stub generator is removed; the route now only handles DB persistence

## Impact

- `app/(app)/onboarding/page.tsx` — full rewrite to chat UI
- `components/onboarding/` — all 8 components removed (wizard-shell, step1–step7)
- `lib/api/onboarding.ts` — stub generator and form types removed; `GeneratedTask` and `KeyContact` types kept
- `app/api/onboarding/generate-tasks/route.ts` — input schema simplified
- New: `app/api/onboarding/chat/route.ts` — AI SDK streaming route
- New dependencies: `ai`, `@ai-sdk/google`
- Gemini API key required in environment (`GOOGLE_GENERATIVE_AI_API_KEY`)
