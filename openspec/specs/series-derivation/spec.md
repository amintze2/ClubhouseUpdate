## ADDED Requirements

### Requirement: Series derivation groups consecutive home games by opponent
The `seriesFromGames` function in `lib/series.ts` SHALL group a flat array of game rows into series. A series is defined as consecutive home games against the same opponent with no gap between game dates exceeding `maxGapDays`. The function SHALL be pure — it makes no database calls.

#### Scenario: Normal 3-game series
- **WHEN** the input contains three games with the same home and away team on consecutive dates (Apr 1, Apr 2, Apr 3)
- **THEN** the function returns one series containing all three games

#### Scenario: Series splits at opponent change
- **WHEN** the input contains two games vs. Team A followed by two games vs. Team B
- **THEN** the function returns two separate series, one per opponent

#### Scenario: Series splits at gap exceeding maxGapDays
- **WHEN** the input contains games on Apr 1, Apr 2, and Apr 5 against the same opponent and `maxGapDays` is 1
- **THEN** the function returns two series: [Apr 1, Apr 2] and [Apr 5]

#### Scenario: Gap within maxGapDays keeps series together
- **WHEN** the input contains games on Apr 1, Apr 3 against the same opponent and `maxGapDays` is 2
- **THEN** the function returns one series containing both games

#### Scenario: Default gap is 1 day
- **WHEN** the function is called with no options argument
- **THEN** `maxGapDays` defaults to 1

### Requirement: Double headers are treated as zero gap
Same-day games between the same home and away teams SHALL be grouped into the same series without counting as a gap.

#### Scenario: Same-day double header
- **WHEN** the input contains two games with identical home_team, away_team, and game_date
- **THEN** both games appear in the same series

### Requirement: Only home games are grouped into series
The function SHALL only group games where `home_team_id` matches the provided `teamId`. Away games for the same team SHALL be excluded from series grouping.

#### Scenario: Away games excluded
- **WHEN** the input contains both home and away games for team A
- **THEN** only the home games appear in the returned series

### Requirement: Games within each series are sorted by date ascending
Each series SHALL contain its games sorted by `game_date` ascending, then by `game_time` ascending for same-day games.

#### Scenario: Games sorted within series
- **WHEN** the input games are provided in non-chronological order
- **THEN** each returned series has its games sorted earliest to latest
