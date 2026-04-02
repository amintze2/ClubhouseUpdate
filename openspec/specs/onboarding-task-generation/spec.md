## ADDED Requirements

### Requirement: API route accepts questionnaire answers and creates recurring tasks
`POST /api/onboarding/generate-tasks` SHALL accept a JSON body with the questionnaire answers, generate recurring task definitions (via stub), bulk-insert them into `recurring_tasks`, upsert key contacts into `contacts`, and set `users.has_completed_onboarding = true`. It returns `{ tasks: RecurringTask[], contacts: Contact[] }`.

#### Scenario: Successful submission creates tasks and marks complete
- **WHEN** a valid answers payload is posted
- **THEN** recurring tasks are inserted, contacts are upserted, `has_completed_onboarding` is set to true, and a 200 response with the created tasks is returned

#### Scenario: Invalid payload returns 400
- **WHEN** the request body is missing required top-level fields
- **THEN** a 400 response with an error message is returned

### Requirement: Task generation is stubbed
Until a Claude API key is provisioned, the generation logic SHALL return a hardcoded set of ~20 sample recurring tasks covering common categories (sanitation, laundry, food, equipment, field, admin, medical, general). The stub SHALL still vary output based on the answers (e.g., exclude laundry tasks if outsourced, include field prep tasks if field_prep includes lines/batting cage).

#### Scenario: Stub respects laundry outsourced flag
- **WHEN** `laundry.method === "outsourced"` in the answers
- **THEN** washer/dryer tasks are excluded and a laundry pickup/dropoff task is included instead

#### Scenario: Stub includes all categories by default
- **WHEN** a user submits answers with no special exclusions
- **THEN** at least one task from each major category (sanitation, laundry, food, equipment) is returned

### Requirement: Generated tasks are valid recurring task definitions
Each generated task SHALL conform to the `recurring_tasks` schema: title (string, required), description (string, optional), category (valid enum value), visibility ('game_day' or 'off_day'), game_day_period (required when visibility is 'game_day'), default_time (HH:MM string, optional).

#### Scenario: Invalid category rejected before insert
- **WHEN** the stub (or future Claude response) returns a task with an invalid category value
- **THEN** that task is skipped and the others are still inserted

### Requirement: Re-run support — replace or merge
The same API route SHALL accept an optional `mode` field: `"replace"` deletes all existing recurring tasks for the user before inserting, `"merge"` appends without deleting. Default is `"replace"`.

#### Scenario: Replace mode clears existing tasks
- **WHEN** `mode === "replace"` and the user has existing recurring tasks
- **THEN** all existing recurring tasks for the user are deleted before the new ones are inserted

#### Scenario: Merge mode appends tasks
- **WHEN** `mode === "merge"` and the user has existing recurring tasks
- **THEN** new tasks are appended without affecting existing ones
