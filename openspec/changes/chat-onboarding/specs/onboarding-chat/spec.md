## ADDED Requirements

### Requirement: Chat UI replaces the wizard at /onboarding
The `/onboarding` page SHALL render a conversational chat interface for clubhouse managers who have not completed onboarding. The same access rules apply: only `role === "clubhouse_manager"` with `has_completed_onboarding === false` (or `?rerun=1`) can access the page. All other roles are redirected.

#### Scenario: New CM sees chat interface
- **WHEN** a clubhouse manager with `has_completed_onboarding = false` navigates to `/onboarding`
- **THEN** the chat interface is shown with an opening message from the AI

#### Scenario: Completed CM is redirected
- **WHEN** a clubhouse manager with `has_completed_onboarding = true` navigates to `/onboarding` without `?rerun=1`
- **THEN** they are redirected away from the page

### Requirement: AI opens with a day-by-day walkthrough prompt
The AI SHALL open the conversation with a message that invites the manager to walk through their game day and off day routines in their own words. The AI SHALL NOT present a form, checklist, or numbered question list.

#### Scenario: Opening message is conversational
- **WHEN** the chat first loads
- **THEN** the AI's first message asks the manager to describe their typical game day from arrival to end of night

#### Scenario: AI adapts follow-up questions to what was shared
- **WHEN** the manager's response mentions laundry but not food
- **THEN** the AI asks a follow-up about food/meals before moving on

### Requirement: AI conducts a semi-open interview of 3–5 turns
The AI SHALL guide the conversation to collect enough information to generate a full recurring task schedule. The AI SHALL ask about game day tasks, off day tasks, and any responsibilities the manager wants tracked. The conversation SHALL conclude within approximately 3–5 turns — the AI SHALL NOT ask more than necessary.

#### Scenario: AI covers game day and off day
- **WHEN** the manager only describes game day tasks
- **THEN** the AI asks at least one follow-up about off day or non-game responsibilities

#### Scenario: AI does not over-interrogate
- **WHEN** the manager has given sufficient detail across 3–4 turns
- **THEN** the AI proceeds to call `finalize_setup` rather than asking additional questions

### Requirement: AI calls finalize_setup tool to produce structured task output
When the AI has collected sufficient information, it SHALL call the `finalize_setup` tool with a `recurring_tasks` array. Each task SHALL conform to the `GeneratedTask` schema: `title`, `description`, `category` (enum), `visibility` (enum), `game_day_period` (enum or null), `default_time` (HH:MM or null).

#### Scenario: finalize_setup is called with valid task schema
- **WHEN** the AI determines it has enough information
- **THEN** it calls `finalize_setup` with a `recurring_tasks` array where every item has valid enum values for category, visibility, and game_day_period

#### Scenario: AI maps freeform descriptions to correct categories
- **WHEN** the manager says "I start laundry after the game"
- **THEN** the generated task has `category: "laundry"`, `visibility: "game_day"`, `game_day_period: "post_game"`

### Requirement: Client intercepts finalize_setup and shows a preview screen
The client SHALL intercept the `finalize_setup` tool call and render a preview of the generated tasks grouped by visibility and time of day. The tasks SHALL NOT be committed to the database at this point. The manager SHALL have two options: confirm (commit tasks) or go back (return to chat to refine).

#### Scenario: Preview shows tasks grouped by game day / off day
- **WHEN** `finalize_setup` is called
- **THEN** the UI transitions to a preview screen listing tasks grouped as Game Day and Off Day

#### Scenario: Confirm button commits tasks
- **WHEN** the manager clicks confirm on the preview screen
- **THEN** a POST is made to `/api/onboarding/generate-tasks` with the task list, and on success the manager is redirected to `/recurring-tasks`

#### Scenario: Back button returns to chat
- **WHEN** the manager clicks back on the preview screen
- **THEN** the chat is shown again with full conversation history intact, and the manager can continue refining

### Requirement: Loading and error states are handled
The chat interface SHALL show a typing indicator while the AI is generating a response. If the AI request fails, an inline error message SHALL be shown and the manager SHALL be able to retry. If the confirm POST fails, a toast error SHALL be shown.

#### Scenario: Typing indicator shown during AI response
- **WHEN** the manager sends a message
- **THEN** a typing indicator is visible until the AI response begins streaming

#### Scenario: API error shown inline
- **WHEN** the AI streaming route returns an error
- **THEN** an error message is shown in the chat and the manager can send another message to retry

#### Scenario: Confirm failure shows toast
- **WHEN** the POST to `/api/onboarding/generate-tasks` returns an error
- **THEN** an error toast is shown and the manager remains on the preview screen
