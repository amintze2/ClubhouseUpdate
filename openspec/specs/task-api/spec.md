## ADDED Requirements

### Requirement: Typed API functions for one-off tasks
`lib/api/tasks.ts` SHALL export typed async functions for one-off task operations using the authenticated Supabase client. All functions SHALL accept a `supabase` client instance as their first argument.

#### Scenario: Fetch tasks for a date
- **WHEN** `getTasksForDate(supabase, userId, date)` is called
- **THEN** it returns all `tasks` rows where `user_id = userId` and `task_date = date`, ordered by `task_time` ascending nulls last

#### Scenario: Fetch tasks for a date range
- **WHEN** `getTasksForDateRange(supabase, userId, startDate, endDate)` is called
- **THEN** it returns all `tasks` rows in the inclusive date range, ordered by `task_date` then `task_time`

#### Scenario: Create a one-off task
- **WHEN** `createTask(supabase, task)` is called with a valid `NewTask` object
- **THEN** it inserts the row and returns the full inserted `Task` object

#### Scenario: Update a one-off task
- **WHEN** `updateTask(supabase, id, updates)` is called
- **THEN** it updates only the provided fields and returns the updated `Task`

#### Scenario: Delete a one-off task
- **WHEN** `deleteTask(supabase, id)` is called
- **THEN** the row is deleted and the function resolves without a return value

### Requirement: Typed API functions for recurring tasks
`lib/api/tasks.ts` SHALL export typed async functions for recurring task definition operations.

#### Scenario: Fetch all recurring tasks for a user
- **WHEN** `getRecurringTasks(supabase, userId)` is called
- **THEN** it returns all `recurring_tasks` rows for that user, ordered by `created_at` ascending

#### Scenario: Create a recurring task
- **WHEN** `createRecurringTask(supabase, task)` is called
- **THEN** it inserts the row and returns the full `RecurringTask` object

#### Scenario: Update a recurring task
- **WHEN** `updateRecurringTask(supabase, id, updates)` is called
- **THEN** it applies partial updates and returns the updated `RecurringTask`

#### Scenario: Delete a recurring task
- **WHEN** `deleteRecurringTask(supabase, id)` is called
- **THEN** the row and all its `recurring_task_completions` (cascade) are deleted

#### Scenario: Toggle recurring task enabled state
- **WHEN** `toggleRecurringTaskEnabled(supabase, id, enabled)` is called
- **THEN** `is_enabled` is updated on the row

### Requirement: Typed API functions for recurring task completions
`lib/api/tasks.ts` SHALL export functions for persisting recurring task completion state.

#### Scenario: Toggle a completion
- **WHEN** `toggleRecurringCompletion(supabase, recurringTaskId, date)` is called
- **THEN** it upserts a row in `recurring_task_completions`, toggling `is_complete` (if no row exists, creates with `is_complete = true`; if row exists, flips the value)

#### Scenario: Fetch completions for a date
- **WHEN** `getCompletionsForDate(supabase, userId, date)` is called
- **THEN** it returns a `Record<number, boolean>` mapping `recurring_task_id` to `is_complete` for all completions on that date belonging to the user's recurring tasks
