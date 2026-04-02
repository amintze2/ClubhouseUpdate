## ADDED Requirements

### Requirement: Only clubhouse managers can manage contacts
An "Edit Contacts" button SHALL appear in the contact bar only for users with the `clubhouse_manager` role. Tapping it opens a contact management panel. Players and general managers SHALL NOT see the edit button.

#### Scenario: Edit button visible to CM only
- **WHEN** a clubhouse manager expands the contact bar
- **THEN** an "Edit Contacts" button is visible

#### Scenario: Edit button hidden from other roles
- **WHEN** a player or general manager expands the contact bar
- **THEN** no edit button is shown

### Requirement: CM can add, edit, and delete contacts
The contact management panel SHALL allow a CM to add new contacts (name and role required; phone, email, notes optional), edit existing contacts, and delete contacts with confirmation. Changes SHALL be scoped to the CM's team.

#### Scenario: Add contact
- **WHEN** CM fills in name and role and saves a new contact
- **THEN** the contact appears in the bar immediately

#### Scenario: Name and role required
- **WHEN** CM attempts to save a contact with an empty name or role
- **THEN** a validation error is shown and save is blocked

#### Scenario: Edit contact
- **WHEN** CM edits an existing contact and saves
- **THEN** the updated values appear on the card

#### Scenario: Delete requires confirmation
- **WHEN** CM clicks delete on a contact
- **THEN** a confirmation prompt appears before removal

### Requirement: CM can reorder contacts
The management panel SHALL provide up/down buttons on each contact row to change display order. Moving a contact up/down SHALL swap it with its neighbour and persist the new order immediately.

#### Scenario: Move up swaps with previous
- **WHEN** CM clicks the up arrow on a contact
- **THEN** it swaps position with the contact above it

#### Scenario: First contact has no up arrow
- **WHEN** a contact is first in the list
- **THEN** no up arrow is shown

#### Scenario: Last contact has no down arrow
- **WHEN** a contact is last in the list
- **THEN** no down arrow is shown

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
