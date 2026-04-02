## ADDED Requirements

### Requirement: Daily Checklists renders correct layout based on game-day status
The Daily Checklists view SHALL determine whether today is a home game day for the user's team by querying the `games` table. The layout SHALL differ between game days and off days.

#### Scenario: Off-day layout
- **WHEN** the user's team has no home game today
- **THEN** all tasks (one-off + applicable recurring) are displayed in a single flat list sorted by time, with a single progress bar at the top

#### Scenario: Game-day layout
- **WHEN** the user's team has a home game today
- **THEN** tasks are grouped into three collapsible accordion sections: Morning, Pre-Game, and Post-Game, each with its own progress bar

### Requirement: Game-day section assignment
On game days, each task SHALL be assigned to exactly one section (Morning, Pre-Game, Post-Game).

#### Scenario: Recurring task section assignment
- **WHEN** a recurring task has `visibility = 'game_day'` and a `game_day_period` value
- **THEN** it is placed in the section matching its `game_day_period`

#### Scenario: One-off task section assignment by time
- **WHEN** a one-off task has a `task_time` set
- **THEN** tasks before 12:00 go to Morning, tasks from 12:00 to game time go to Pre-Game, tasks after game time go to Post-Game

#### Scenario: One-off task with no time defaults to Morning
- **WHEN** a one-off task has no `task_time`
- **THEN** it is placed in the Morning section

#### Scenario: Default game time when not set
- **WHEN** the game row has no `game_time`
- **THEN** 19:00 is used as the Pre-Game / Post-Game boundary

### Requirement: Task row interactions
Each task row in the checklist SHALL support checking off and deletion.

#### Scenario: Checking off a one-off task
- **WHEN** a user taps the checkbox on a one-off task
- **THEN** `is_complete` is toggled optimistically in UI and persisted via `updateTask`; on error, the state rolls back and a toast is shown

#### Scenario: Checking off a recurring task
- **WHEN** a user taps the checkbox on a recurring task
- **THEN** `toggleRecurringCompletion` is called for today's date; optimistic update applies; on error, rollback + toast

#### Scenario: Deleting a one-off task
- **WHEN** a user taps the delete button on a one-off task and confirms
- **THEN** the task is removed from the list optimistically and deleted via `deleteTask`; on error, rollback + toast

### Requirement: One-off task creation from checklists
A floating "+" button SHALL open a dialog to create a new one-off task for today.

#### Scenario: Task created via dialog
- **WHEN** a user fills in the dialog (title required, other fields optional) and submits
- **THEN** `createTask` is called with `task_date = today`, the new task appears in the list, and the dialog closes

#### Scenario: Dialog validation
- **WHEN** a user submits the dialog with an empty title
- **THEN** an inline validation error is shown and the task is not created

### Requirement: Upcoming home games widget
The top of the Daily Checklists view SHALL show a compact widget listing the team's next upcoming home games.

#### Scenario: Upcoming games displayed
- **WHEN** the page loads
- **THEN** the next 3 upcoming home games for the user's team are shown with date and opponent name
