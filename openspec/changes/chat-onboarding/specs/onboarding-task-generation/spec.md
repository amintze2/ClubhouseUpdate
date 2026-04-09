## MODIFIED Requirements

### Requirement: API route accepts AI-generated tasks and creates recurring tasks
`POST /api/onboarding/generate-tasks` SHALL accept a JSON body with `{ user_id, team_id, tasks: GeneratedTask[], mode }`, bulk-insert the tasks into `recurring_tasks`, and set `users.has_completed_onboarding = true`. It returns `{ tasks: RecurringTask[] }`. The `contacts` field is no longer accepted or returned.

#### Scenario: Successful submission creates tasks and marks complete
- **WHEN** a valid payload with a `tasks` array is posted
- **THEN** recurring tasks are inserted, `has_completed_onboarding` is set to true, and a 200 response with the created tasks is returned

#### Scenario: Invalid payload returns 400
- **WHEN** the request body is missing `user_id`, `team_id`, or `tasks`
- **THEN** a 400 response with an error message is returned

## REMOVED Requirements

### Requirement: Task generation is stubbed
**Reason**: Task generation is now performed by the AI in the chat flow. The stub (`generateTasksStub`) and `OnboardingAnswers` types are removed. The route no longer generates tasks — it only persists the AI-generated list.
**Migration**: Tasks arrive pre-generated in the request body as `GeneratedTask[]`.

## ADDED Requirements

### Requirement: Route validates task schema before insert
The route SHALL validate each item in the `tasks` array before inserting. Tasks with invalid `category`, `visibility`, or `game_day_period` enum values SHALL be filtered out silently. If all tasks are invalid, a 400 response SHALL be returned.

#### Scenario: Invalid enum values filtered
- **WHEN** the tasks array contains an item with an unrecognized `category`
- **THEN** that item is excluded from the insert and the remaining valid tasks are inserted

#### Scenario: All tasks invalid returns 400
- **WHEN** every task in the array has invalid enum values
- **THEN** a 400 response is returned with a descriptive error
