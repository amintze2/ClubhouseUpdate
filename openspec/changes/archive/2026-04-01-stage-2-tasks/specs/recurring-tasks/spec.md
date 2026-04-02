## ADDED Requirements

### Requirement: Recurring tasks list view
The Recurring Tasks page SHALL display all of the user's recurring task definitions as cards.

#### Scenario: Tasks displayed as cards
- **WHEN** a user navigates to `/recurring-tasks`
- **THEN** each recurring task is shown as a card with: title, description (if set), category badge, default time (if set), visibility badge (Every Day / Game Day / Off Day), game-day period badge (if applicable), an enable/disable toggle, an edit button, and a delete button

#### Scenario: Empty state
- **WHEN** the user has no recurring tasks
- **THEN** an empty state message is shown with a prompt to add the first task

### Requirement: Enable/disable toggle persists
The enable/disable toggle on each recurring task card SHALL immediately persist to the database.

#### Scenario: Toggle disabled
- **WHEN** a user flips the toggle to disabled
- **THEN** `toggleRecurringTaskEnabled(id, false)` is called, `is_enabled` is updated in DB, and the card reflects the disabled state; on error, rollback + toast

#### Scenario: Toggle enabled
- **WHEN** a user flips the toggle to enabled
- **THEN** `toggleRecurringTaskEnabled(id, true)` is called and the card reflects the enabled state; on error, rollback + toast

### Requirement: Add recurring task
An "Add Recurring Task" button SHALL open a form dialog for creating a new recurring task definition.

#### Scenario: Task created successfully
- **WHEN** a user fills in the form (title required) and submits
- **THEN** `createRecurringTask` is called and the new card appears in the list

#### Scenario: Game-day period field shown conditionally
- **WHEN** the user selects `visibility = 'game_day'` in the form
- **THEN** a game-day period dropdown (Morning / Pre-Game / Post-Game) is shown; it is hidden for other visibility values

#### Scenario: Title required
- **WHEN** a user submits the form with no title
- **THEN** an inline error is shown and the task is not created

### Requirement: Edit recurring task
The edit button on each card SHALL open the same form pre-populated with the task's current values.

#### Scenario: Edit saved
- **WHEN** a user modifies fields and submits the edit form
- **THEN** `updateRecurringTask` is called and the card updates to reflect the new values

### Requirement: Delete recurring task
The delete button SHALL show a confirmation dialog before deleting.

#### Scenario: Delete confirmed
- **WHEN** a user confirms the delete dialog
- **THEN** `deleteRecurringTask` is called, the card is removed, and all completions for this task are deleted via cascade

#### Scenario: Delete cancelled
- **WHEN** a user cancels the delete dialog
- **THEN** no changes are made
