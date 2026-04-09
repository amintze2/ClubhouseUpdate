## Context

The current onboarding wizard is a 7-step form that asks about infrastructure (laundry method, food setup, field prep) and uses a rule-based stub (`generateTasksStub`) to produce recurring tasks. The stub is deterministic — it doesn't adapt to how the manager describes their actual routine. The form is also a cold start UX that forces managers to think in categories rather than in their natural daily workflow.

This change replaces the wizard with a conversational AI flow using Vercel AI SDK and Gemini 2.0 Flash. The app currently has zero AI dependencies — this is the first AI integration.

## Goals / Non-Goals

**Goals:**
- Replace the 7-step wizard with a 3–5 turn chat that feels natural to a clubhouse manager
- Use AI tool calling (`finalize_setup`) to produce a structured `GeneratedTask[]` as the terminal action
- Show a preview screen before writing to the database — manager confirms before commit
- Keep the existing `/api/onboarding/generate-tasks` route for DB persistence (simplified input)
- Free model only: Gemini 2.0 Flash via `@ai-sdk/google`

**Non-Goals:**
- Inventory initialization (deferred to a future change)
- Key contacts collection (removed from this flow for now)
- Streaming partial task previews (full list shown only after `finalize_setup` tool call)
- Model fallback / multi-provider routing (single model for now)

## Decisions

### D1: Vercel AI SDK (`ai` + `@ai-sdk/google`) over raw Gemini API

The raw Gemini API requires manual streaming, tool call parsing, and multi-turn message management. AI SDK provides `useChat` (client) and `streamText` (server) with built-in tool call support and message history. Since the project is already on Next.js 15 / App Router, the Route Handler pattern fits naturally.

*Alternative considered*: Direct `fetch` to Gemini REST API. Rejected — too much boilerplate for streaming + tool calls.

### D2: Tool calling for structured output, not JSON mode

Gemini supports both JSON mode (schema-constrained output) and function calling (tool use). Tool calling is preferred here because:
- The AI can decide *when* it has enough information to call `finalize_setup` rather than always outputting JSON
- Tool call interception on the client is clean with AI SDK's `onToolCall` / `toolInvocations`
- It models the intent correctly: generation is a deliberate action, not every response

### D3: Client-side tool call interception for preview

When the AI calls `finalize_setup`, the client intercepts the tool invocation *before* sending it to the server. The tool result is held in React state and rendered as a preview card. Only after the user confirms does the client POST to `/api/onboarding/generate-tasks`.

This means `finalize_setup` is a **client-side tool** in AI SDK terms (`experimental_onToolCall` or handling via `toolInvocations` in the message stream). The AI never gets a tool result back — the conversation ends at the tool call.

*Alternative considered*: Server-side tool execution that writes directly to DB. Rejected — no user confirmation possible, and DB writes on every finalize attempt would be messy.

### D4: System prompt embeds domain knowledge from old wizard

The `generateTasksStub` logic (task categories, visibility rules, game_day_period assignments, default times) becomes reference material in the system prompt. The manager never sees this structure, but the AI uses it to map freeform descriptions to the correct `TaskCategory`, `TaskVisibility`, and `GameDayPeriod` values.

The system prompt includes:
- The full `GeneratedTask` schema with field constraints
- Canonical examples of task-to-category mapping
- The "day-by-day walkthrough" opening question
- A target of ~3–5 conversation turns before calling `finalize_setup`

### D5: `/api/onboarding/generate-tasks` kept, input simplified

Rather than creating a new endpoint, the existing route is modified: it accepts `{ user_id, team_id, tasks: GeneratedTask[], mode }` instead of `OnboardingAnswers`. The route still handles: replace/merge mode, bulk insert, and marking `has_completed_onboarding`. This preserves the re-run flow (`?rerun=1&mode=replace|merge`).

For re-runs, the chat UI is shown again (same route) — the AI context starts fresh.

## Risks / Trade-offs

- **Gemini free tier rate limits** → If many managers onboard simultaneously, requests may be throttled. Mitigation: the flow is ~3–5 API calls per onboarding session, well within free tier limits. Add error handling to surface rate limit errors gracefully.
- **AI produces invalid task schema** → The `finalize_setup` tool schema is strict (enums for category/visibility/game_day_period). Gemini may occasionally hallucinate values outside the enum. Mitigation: validate on the server before inserting; invalid tasks are filtered out (existing behavior in the route).
- **Manager gives vague answers** → "I just do the usual stuff" won't produce a useful task list. Mitigation: system prompt instructs the AI to ask follow-up questions and fall back to sensible baseball clubhouse defaults if the manager is brief.
- **No fallback model** → If Gemini is unavailable, onboarding fails. Mitigation: acceptable for now given free tier reliability. Future change can add Groq/Llama as fallback.
- **`GOOGLE_GENERATIVE_AI_API_KEY` not set in prod** → Hard failure. Mitigation: validate env var at route load time and return a clear error.

## Migration Plan

1. Deploy with feature intact — no DB schema changes required
2. Existing managers who have `has_completed_onboarding = true` are unaffected (gate still works)
3. Managers mid-wizard at deploy time lose their progress (acceptable — onboarding is one-time)
4. Old components deleted after deploy confirmation

## Open Questions

- Should the chat support markdown rendering in AI messages, or plain text only?
- Should the re-run flow (`?rerun=1`) pre-populate any context from existing tasks?
