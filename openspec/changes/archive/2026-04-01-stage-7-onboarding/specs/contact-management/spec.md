## ADDED Requirements

### Requirement: Onboarding pre-populates key contacts
When the onboarding wizard submits, any non-empty key contact entries (Head Trainer, Field Manager, Visiting Clubhouse Contact) SHALL be inserted into the `contacts` table with the CM's `team_id`. Contacts are inserted only if the name field is non-empty; existing contacts with the same name are not replaced.

#### Scenario: Non-empty contacts are created
- **WHEN** a CM enters a name for "Head Trainer" on the key contacts step
- **THEN** a contact row is inserted with `role = "Head Trainer"` and the provided name, phone, and email

#### Scenario: Blank contact entries are skipped
- **WHEN** a CM leaves the "Field Manager" entry blank
- **THEN** no contact row is created for Field Manager

#### Scenario: Duplicate name is not re-inserted
- **WHEN** a contact with the same name already exists for this team
- **THEN** a new duplicate row is NOT inserted (upsert on name + team_id, or skip)
