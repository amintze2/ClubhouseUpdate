## ADDED Requirements

### Requirement: Contact bar visible on all pages for all roles
A collapsible contact bar SHALL appear above the main content area on every page for all authenticated roles. When collapsed, it SHALL display "Key Contacts" and the count of contacts. When expanded, it SHALL show contact cards in a horizontally scrollable row (mobile) or wrapped grid (desktop).

#### Scenario: Bar visible on every page
- **WHEN** any authenticated user navigates to any page
- **THEN** the contact bar is present above the page content

#### Scenario: Collapsed state shows count
- **WHEN** the contact bar is collapsed
- **THEN** it shows "Key Contacts" and the total number of contacts for the team

#### Scenario: Expanded state shows cards
- **WHEN** the user expands the contact bar
- **THEN** contact cards are visible in a scrollable layout

#### Scenario: Empty state
- **WHEN** no contacts exist for the team
- **THEN** collapsed state shows "Key Contacts · 0" and expanded state shows "No contacts yet"

### Requirement: Contact cards show tap-to-call and tap-to-email
Each contact card SHALL display the contact's name and role. If a phone number is set, it SHALL render as a `tel:` link. If an email is set, it SHALL render as a `mailto:` link. Both SHALL be functional on mobile (native dialer / mail client).

#### Scenario: Phone renders as tap-to-call
- **WHEN** a contact has a phone number and the user taps it on mobile
- **THEN** the device's native dialer is invoked with that number

#### Scenario: Email renders as tap-to-email
- **WHEN** a contact has an email and the user taps it
- **THEN** the device's native mail client opens with that address pre-filled

#### Scenario: Missing fields hidden
- **WHEN** a contact has no phone or no email
- **THEN** the missing field is not shown on the card
