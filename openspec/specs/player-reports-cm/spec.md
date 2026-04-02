## ADDED Requirements

### Requirement: CM sees all issues for their team
The `/reports` page for a clubhouse manager SHALL display all issues submitted by players on their team, ordered by most recent first. Each row SHALL show the player name, a short description preview, status badge, GM-flagged indicator, and submission date.

#### Scenario: Issues list loads on page open
- **WHEN** a CM navigates to `/reports`
- **THEN** all issues for their team are shown in a table, newest first

#### Scenario: GM-flagged issues are visually distinct
- **WHEN** an issue has `gm_flagged = true`
- **THEN** a flag indicator is visible on that row

#### Scenario: Empty state
- **WHEN** no issues exist for the team
- **THEN** the page shows "No reports yet."

### Requirement: CM can filter issues by status
The issue table SHALL support filtering by status: All, New, In Progress, Resolved. The active filter SHALL be visually highlighted.

#### Scenario: Filter by status
- **WHEN** CM selects a status filter
- **THEN** only issues with that status are shown

#### Scenario: Default filter shows all
- **WHEN** CM first opens the page
- **THEN** all issues are shown (no filter active)

### Requirement: CM can open an issue detail panel
Clicking an issue row SHALL open an inline detail panel showing the full description, team context (home/away + away team name if applicable), player name, submission date, current status, and the full comment thread.

#### Scenario: Detail panel opens on row click
- **WHEN** CM clicks an issue row
- **THEN** a detail panel appears showing all issue fields and existing comments

#### Scenario: Away context shown when applicable
- **WHEN** the issue has `team_context = 'away'`
- **THEN** the detail panel shows the away team name

### Requirement: CM can update issue status
The detail panel SHALL provide action buttons to transition issue status. Available transitions: New → In Progress, In Progress → Resolved, Resolved → Reopen (back to New).

#### Scenario: Mark In Progress
- **WHEN** CM clicks "Mark In Progress" on a New issue
- **THEN** the issue status updates to `in_progress` immediately

#### Scenario: Mark Resolved
- **WHEN** CM clicks "Mark Resolved" on an In Progress issue
- **THEN** the issue status updates to `resolved`

#### Scenario: Reopen
- **WHEN** CM clicks "Reopen" on a Resolved issue
- **THEN** the issue status returns to `new`

### Requirement: CM can add comments to an issue
The detail panel SHALL include a comment composer. Submitting a comment SHALL append it to the thread with the CM's name and timestamp.

#### Scenario: Add comment
- **WHEN** CM types a comment and submits
- **THEN** the comment appears in the thread attributed to the CM

#### Scenario: Empty comment blocked
- **WHEN** CM attempts to submit an empty comment
- **THEN** the submit button is disabled and no request is made
