## ADDED Requirements

### Requirement: Series list shows planning status
The meals page SHALL display upcoming home game series grouped by opponent. Each series card SHALL show: opponent name, date range (e.g. "Apr 1–6"), number of games, planning status ("All Planned" / "N of M Planned" / "Not Planned"), and a warning icon if any home-team players have dietary restrictions.

#### Scenario: Series cards listed
- **WHEN** a CM opens the meals page
- **THEN** each upcoming home series appears as a card with opponent, date range, game count, and planning status

#### Scenario: Planning status reflects saved meals
- **WHEN** 2 of 6 games in a series have meals saved
- **THEN** the card shows "2 of 6 Planned"

#### Scenario: Dietary restriction warning shown
- **WHEN** any home-team player has one or more dietary restrictions
- **THEN** a warning icon appears on every series card

#### Scenario: Empty state when no upcoming series
- **WHEN** there are no upcoming home series
- **THEN** a message "No upcoming home series" is shown

### Requirement: Series planning dialog with batch save
Clicking a series card SHALL open a dialog with one row per game. Each row SHALL show the game date and time, a pre-game snack text area, and a post-game meal text area pre-filled with any existing values. Saving SHALL upsert all rows at once. The dialog SHALL show a dietary restrictions summary at the top listing home-team players with restrictions (name + restrictions). A note SHALL indicate away-team restrictions are not available.

#### Scenario: Dialog opens with existing meal data
- **WHEN** CM opens a series that has some meals already planned
- **THEN** those games' text areas are pre-filled with saved values

#### Scenario: Batch save persists all games
- **WHEN** CM fills in meals for multiple games and clicks Save
- **THEN** all games are upserted in one operation and the series card updates its status

#### Scenario: Dietary summary shows home team players
- **WHEN** home-team players have dietary restrictions
- **THEN** the dialog shows each player's name and their restrictions

### Requirement: Copy from previous game
Each game row (except the first) SHALL include a "Copy from above" button that copies the pre-game snack and post-game meal values from the row above into the current row's fields.

#### Scenario: Copy fills current row from above
- **WHEN** CM clicks "Copy from above" on a game row
- **THEN** that row's snack and meal fields are set to match the row above

#### Scenario: First row has no copy button
- **WHEN** the dialog shows the first game in a series
- **THEN** no "Copy from above" button is shown for that row
