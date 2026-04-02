## ADDED Requirements

### Requirement: Player can submit an issue report
The `/player-report` page SHALL provide a form with a team context toggle (Home / Away), a description text area (required), and a Submit button. On success, a toast SHALL confirm submission and the form SHALL reset.

#### Scenario: Submit a home-context issue
- **WHEN** player selects "Home", enters a description, and submits
- **THEN** an issue is created with `team_context = 'home'` and a success toast appears

#### Scenario: Description is required
- **WHEN** player attempts to submit with an empty description
- **THEN** a validation error is shown and no request is made

#### Scenario: Form resets after successful submit
- **WHEN** submission succeeds
- **THEN** the form returns to its initial empty state

### Requirement: Away context requires a team name
When the player selects "Away", an additional text field SHALL appear for the away team name. This field is optional — if blank, the issue is submitted with `away_team_name = null`.

#### Scenario: Away team name field appears on Away selection
- **WHEN** player toggles to "Away"
- **THEN** an "Away Team" text input appears below the toggle

#### Scenario: Away team name field hides on Home selection
- **WHEN** player toggles back to "Home"
- **THEN** the "Away Team" input is hidden and its value is cleared

#### Scenario: Submit away issue with team name
- **WHEN** player selects "Away", enters a team name and description, and submits
- **THEN** issue is created with `team_context = 'away'` and `away_team_name` set

### Requirement: Player cannot see other players' reports
The `/player-report` page is submission-only. Players SHALL NOT see a list of other players' submitted issues.

#### Scenario: No issue list shown to players
- **WHEN** a player views `/player-report`
- **THEN** only the submission form is displayed, with no issue history list
