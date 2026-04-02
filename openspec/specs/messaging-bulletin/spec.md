## ADDED Requirements

### Requirement: Bulletin channel is accessible to all CMs
A single bulletin conversation SHALL exist for league-wide CM communication. When a CM opens the messages page, they SHALL be automatically added as a participant if not already. The bulletin SHALL appear in the Bulletin tab.

#### Scenario: CM is auto-joined on page load
- **WHEN** a CM opens `/messages` and is not yet a participant in the bulletin conversation
- **THEN** they are added as a participant and the bulletin appears in the Bulletin tab

#### Scenario: Bulletin visible in Bulletin tab
- **WHEN** a CM selects the Bulletin tab
- **THEN** the bulletin conversation is shown

#### Scenario: Non-CMs do not see Bulletin tab
- **WHEN** a player or GM opens `/messages`
- **THEN** the Bulletin tab is not shown

### Requirement: Bulletin cannot be deleted or left
The bulletin conversation SHALL not have a delete or leave option in the UI.

#### Scenario: No delete/leave controls on bulletin
- **WHEN** a CM views the bulletin thread
- **THEN** no option to delete or leave the conversation is visible
