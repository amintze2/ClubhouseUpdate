## 1. Shared UI Primitives

- [x] 1.1 Write `components/ui/toast.tsx` — lightweight toast notification (success/error variants, auto-dismiss after 3s, fixed bottom-right positioning)
- [x] 1.2 Write `components/ui/dialog.tsx` — modal dialog wrapper with backdrop, close button, and portal rendering
- [x] 1.3 Write `components/ui/badge.tsx` — small colored label component accepting a `variant` prop (category, visibility, period, status)
- [x] 1.4 Write `components/ui/button.tsx` — base button with primary/secondary/ghost/danger variants

## 2. Task API Layer

- [x] 2.1 Write `lib/api/tasks.ts` — `getTasksForDate`, `getTasksForDateRange`, `createTask`, `updateTask`, `deleteTask`
- [x] 2.2 Add to `lib/api/tasks.ts` — `getRecurringTasks`, `createRecurringTask`, `updateRecurringTask`, `deleteRecurringTask`, `toggleRecurringTaskEnabled`
- [x] 2.3 Add to `lib/api/tasks.ts` — `toggleRecurringCompletion`, `getCompletionsForDate`
- [x] 2.4 Add to `lib/api/tasks.ts` — `getUpcomingHomeGames(supabase, teamId, limit)` — returns next N home games with opponent team name joined

## 3. Daily Checklists

- [x] 3.1 Write `lib/tasks-utils.ts` — `assignTaskToSection(task, gameTime): GameDayPeriod` pure function implementing the time-boundary logic (before 12:00 → morning, 12:00–gameTime → pre_game, after → post_game, no time → morning)
- [x] 3.2 Write `components/checklists/task-row.tsx` — checkbox, title, category badge, time, repeat icon (for recurring), delete button (for one-off)
- [x] 3.3 Write `components/checklists/task-section.tsx` — collapsible accordion section with section label, progress bar, and list of `TaskRow` components
- [x] 3.4 Write `components/checklists/add-task-dialog.tsx` — dialog form with title (required), description, category dropdown, time picker
- [x] 3.5 Write `components/checklists/upcoming-games-widget.tsx` — compact strip showing next 3 home games (date + opponent)
- [x] 3.6 Replace `app/(app)/checklists/page.tsx` stub — fetch today's game, tasks, recurring tasks, completions; build merged task list; render off-day flat list or game-day sections; wire add button and task interactions with optimistic updates + toast on error

## 4. Recurring Tasks

- [x] 4.1 Write `components/recurring-tasks/task-card.tsx` — card with title, description, badges, enable/disable toggle, edit and delete buttons
- [x] 4.2 Write `components/recurring-tasks/task-form-dialog.tsx` — shared add/edit form: title, description, category, visibility (radio/select), default time, game-day period (shown conditionally when visibility = game_day)
- [x] 4.3 Write `components/recurring-tasks/delete-confirm-dialog.tsx` — simple confirmation dialog
- [x] 4.4 Replace `app/(app)/recurring-tasks/page.tsx` stub — fetch recurring tasks; render card list with empty state; wire add/edit/delete/toggle with optimistic updates + toast on error

## 5. Task Calendar

- [x] 5.1 Write `components/calendar/week-grid.tsx` — 7-column grid (Sun–Sat), each cell shows day number, task count badge, home/away game indicator; selected day highlighted; previous/next week navigation
- [x] 5.2 Write `components/calendar/day-detail.tsx` — panel showing selected day's tasks (same game-day section logic as checklists); checkable; "Add Task" button pre-fills date
- [x] 5.3 Write `components/calendar/upcoming-tasks-list.tsx` — scrollable list of future one-off tasks, sorted by date then time; clicking a task navigates the grid to that week and selects that day
- [x] 5.4 Replace `app/(app)/calendar/page.tsx` stub — manage selected week + day state; fetch tasks for the visible week range + upcoming tasks; compose week-grid, day-detail, and upcoming-tasks-list; two-panel desktop / stacked mobile layout

## 6. End-to-End Verification

- [x] 6.1 Daily Checklists: confirm off-day shows flat list and game day shows three sections (team 1 has a home game today from seed data)
- [x] 6.2 Daily Checklists: check off a recurring task, refresh — completion persists
- [x] 6.3 Daily Checklists: add a one-off task via dialog — appears in list; delete it — removed
- [x] 6.4 Recurring Tasks: add a new game-day recurring task, enable it — appears in checklists on game day
- [x] 6.5 Recurring Tasks: disable a task — no longer appears in checklists
- [x] 6.6 Calendar: navigate weeks, verify task counts update; select a game day — sections appear; add a task from calendar — appears in checklists
- [x] 6.7 Verify all views are usable at 375px width (no overflow, no clipped buttons)
