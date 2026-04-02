## Why

The app shell is in place but all three task-related routes (`/checklists`, `/calendar`, `/recurring-tasks`) render empty stubs. Clubhouse managers have no way to track their daily work, manage recurring duties, or see what's coming up — which is the core daily workflow of the app.

## What Changes

- Replace the `/checklists` stub with a fully functional Daily Checklists view: game-day sectioning (Morning / Pre-Game / Post-Game), off-day flat list, per-section progress bars, and one-off task CRUD
- Replace the `/recurring-tasks` stub with a Recurring Tasks management view: card list, enable/disable toggle, add/edit/delete dialogs
- Replace the `/calendar` stub with a Task Calendar view: weekly grid with task counts + game indicators, selected-day panel, upcoming tasks list
- Add `lib/api/tasks.ts` — typed Supabase query functions for one-off tasks, recurring tasks, and recurring completions
- Implement optimistic updates with error rollback and toast notifications across all three views

## Capabilities

### New Capabilities
- `daily-checklists`: Daily task view with game-day sectioning, progress tracking, and one-off task creation
- `recurring-tasks`: Recurring task definitions management (CRUD, enable/disable, visibility rules)
- `task-calendar`: Weekly calendar grid with per-day task counts, game indicators, and day-detail panel
- `task-api`: Client-side API layer for all task table operations

### Modified Capabilities
*(none — task schema and RLS are already in place from Stage 1a)*

## Impact

- **New files:** `lib/api/tasks.ts`, `app/(app)/checklists/page.tsx` (replaced), `app/(app)/recurring-tasks/page.tsx` (replaced), `app/(app)/calendar/page.tsx` (replaced), `components/checklists/`, `components/recurring-tasks/`, `components/calendar/`, `components/ui/` (toast, dialog, badge primitives)
- **Reads from:** `tasks`, `recurring_tasks`, `recurring_task_completions`, `games` tables via existing RLS policies
- **No schema changes** — all tables and policies were created in Stage 1a
- **No auth changes** — uses existing `useAuth()` and Supabase client from Stage 1b
