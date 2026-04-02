## ADDED Requirements

### Requirement: Weekly calendar grid
The Task Calendar SHALL display a week-at-a-glance grid with navigation controls.

#### Scenario: Grid shows current week by default
- **WHEN** a user navigates to `/calendar`
- **THEN** the grid displays the 7 days of the current week (Sunday–Saturday), with today highlighted

#### Scenario: Week navigation
- **WHEN** a user clicks the previous or next week arrow
- **THEN** the grid shifts by 7 days in the corresponding direction and the day-detail panel updates to show the first day of the new week

#### Scenario: Task count per day
- **WHEN** the grid renders
- **THEN** each day cell shows the total count of applicable tasks (one-off + enabled recurring) for that date

#### Scenario: Game indicator per day
- **WHEN** a team has a home game on a given date
- **THEN** that day cell shows a "Home" badge; away games show an "Away" badge; no game shows no badge

### Requirement: Day detail panel
Clicking a day in the grid SHALL display that day's tasks in a detail panel.

#### Scenario: Day selected
- **WHEN** a user clicks a day cell
- **THEN** the detail panel shows all tasks for that date (one-off + applicable recurring), grouped by game-day sections if it is a home game day, or as a flat list if it is an off day

#### Scenario: Task checkable from calendar
- **WHEN** a user checks or unchecks a task in the day detail panel
- **THEN** the same optimistic update + rollback behavior as in Daily Checklists applies

#### Scenario: Add task from calendar
- **WHEN** a user clicks "Add Task" in the day detail panel
- **THEN** the same task creation dialog opens with `task_date` pre-filled to the selected day

### Requirement: Upcoming tasks list
Below the calendar grid, a scrollable list SHALL show upcoming one-off tasks across all future dates.

#### Scenario: Upcoming tasks shown
- **WHEN** the calendar page loads
- **THEN** all one-off tasks with `task_date >= today` are listed, sorted by date then time, showing date, title, and category badge

#### Scenario: Jump to date from upcoming list
- **WHEN** a user clicks a task in the upcoming list
- **THEN** the calendar grid navigates to the week containing that task's date and that day is selected in the detail panel

### Requirement: Mobile layout stacks panels vertically
On viewports narrower than 768px the calendar grid and day detail panel SHALL stack vertically.

#### Scenario: Mobile stacked layout
- **WHEN** viewport width is less than 768px
- **THEN** the calendar grid appears above the day detail panel, full width, with no side-by-side layout
