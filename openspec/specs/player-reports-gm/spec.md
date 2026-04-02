## ADDED Requirements

### Requirement: GM sees all issues for their team (read-only)
The `/reports` page for a general manager SHALL display the same issue table as the CM view, but with no status action buttons and no comment composer. The GM SHALL be able to open a detail panel and read the full thread.

#### Scenario: GM issue list loads
- **WHEN** a GM navigates to `/reports`
- **THEN** all issues for their team are shown with no edit controls

#### Scenario: Status buttons not shown
- **WHEN** GM views an issue detail panel
- **THEN** no "Mark In Progress", "Mark Resolved", or "Reopen" buttons are visible

#### Scenario: Comment composer not shown
- **WHEN** GM views an issue detail panel
- **THEN** no comment input field is visible

### Requirement: GM can flag and unflag issues
Each issue row (and the detail panel) SHALL include a flag toggle. Toggling it SHALL flip `gm_flagged` on the issue.

#### Scenario: Flag an issue
- **WHEN** GM clicks the flag button on an unflagged issue
- **THEN** `gm_flagged` becomes true and the flag indicator appears on the row

#### Scenario: Unflag an issue
- **WHEN** GM clicks the flag button on a flagged issue
- **THEN** `gm_flagged` becomes false and the flag indicator is removed

### Requirement: GM view updates in real time
The GM detail panel SHALL subscribe to new comments on the currently open issue via Supabase Realtime. New comments SHALL appear without a page refresh.

#### Scenario: New comment appears live
- **WHEN** a CM adds a comment while the GM has that issue open
- **THEN** the comment appears in the GM's detail panel without refreshing

#### Scenario: Subscription cleans up on close
- **WHEN** GM closes the detail panel or navigates away
- **THEN** the Realtime subscription is unsubscribed
