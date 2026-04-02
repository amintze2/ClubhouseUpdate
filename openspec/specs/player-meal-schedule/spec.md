## ADDED Requirements

### Requirement: Player sees read-only meal schedule
The player-meals page SHALL display a table of upcoming and recent home games where meals have been planned. Columns SHALL be: Date, Opponent, Pre-Game Snack, Post-Game Meal. Games with no planned meal SHALL be omitted. If no meals have been planned, an empty state message "No meals planned yet." SHALL be shown.

#### Scenario: Only planned meals shown
- **WHEN** a player opens the meal schedule
- **THEN** only games with at least one non-empty meal field are listed

#### Scenario: Empty state when no meals planned
- **WHEN** no meals have been saved for the team's upcoming games
- **THEN** the message "No meals planned yet." is shown

#### Scenario: Sorted by date ascending
- **WHEN** multiple meals are planned
- **THEN** they appear in chronological order, earliest first
