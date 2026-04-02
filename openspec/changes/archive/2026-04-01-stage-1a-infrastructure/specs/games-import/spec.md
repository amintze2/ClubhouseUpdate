## ADDED Requirements

### Requirement: Games import script reads and inserts schedule data
The `scripts/import-games.ts` script SHALL read a CSV or JSON file of game data, map team identifiers to `teams` table IDs, and insert rows into the `games` table. It SHALL be runnable via `npx ts-node scripts/import-games.ts <filepath>`.

#### Scenario: Successful import from file
- **WHEN** the script is run with a valid CSV or JSON file path
- **THEN** all games in the file are inserted into the `games` table with correct `home_team_id`, `away_team_id`, `game_date`, `game_time`, and `is_makeup` values

#### Scenario: Team name lookup
- **WHEN** the input file contains team names or external IDs
- **THEN** the script resolves them to `teams.id` values via the `teams` table before inserting

### Requirement: Import validates for duplicate games
The script SHALL check for duplicate entries before inserting. A duplicate is defined as a row with the same `home_team_id`, `away_team_id`, and `game_date`.

#### Scenario: Duplicate detected
- **WHEN** the input file contains a game that already exists in the `games` table (same home team, away team, date)
- **THEN** the script skips that row, logs a warning, and continues without failing

#### Scenario: No duplicates in clean import
- **WHEN** no games in the input file already exist in the database
- **THEN** all rows are inserted and the script exits with a success message showing the count of inserted games

### Requirement: Import reports errors without crashing
The script SHALL handle individual row failures gracefully — log the failure with the row data, skip the row, and continue processing the remaining rows.

#### Scenario: Invalid row in input
- **WHEN** a row in the input file has a missing required field (e.g., no game date)
- **THEN** the script logs the error with the row index, skips that row, and processes the rest
