## ADDED Requirements

### Requirement: Wizard renders only for new CMs
The `/onboarding` page SHALL only be accessible to users with `role === "clubhouse_manager"` and `has_completed_onboarding === false`. All other roles SHALL be redirected to `/`.

#### Scenario: New CM can access onboarding
- **WHEN** a clubhouse manager with `has_completed_onboarding = false` navigates to `/onboarding`
- **THEN** the wizard is displayed

#### Scenario: Completed CM cannot re-access onboarding directly
- **WHEN** a clubhouse manager with `has_completed_onboarding = true` navigates to `/onboarding`
- **THEN** they are redirected to `/`

### Requirement: Wizard has 7 sequential steps
The wizard SHALL present 7 named steps in order. A step indicator SHALL show current step and total count. The user can move back to previous steps but cannot skip ahead.

Steps in order:
1. Facility Basics
2. Laundry & Cleaning
3. Food & Meals
4. Field & Equipment
5. Medical & Safety
6. Game-Day Specifics
7. Key Contacts

#### Scenario: Step indicator shows progress
- **WHEN** a user is on step 3
- **THEN** the indicator shows "Step 3 of 7" and the step name

#### Scenario: Back navigation returns to previous step
- **WHEN** a user clicks Back on step 4
- **THEN** they are taken to step 3 with their previously entered answers still present

#### Scenario: Cannot skip forward
- **WHEN** a user is on step 2
- **THEN** there is no way to navigate directly to step 5

### Requirement: Step 1 — Facility Basics
Collects: number of players on roster (number input), whether there is a home clubhouse (yes/no), whether there is a visiting clubhouse (yes/no), whether laundry is on-site or outsourced (radio).

#### Scenario: Required fields validated on Next
- **WHEN** a user clicks Next with no roster size entered
- **THEN** an inline validation error is shown and step does not advance

### Requirement: Step 2 — Laundry & Cleaning
Collects: laundry equipment available (checkboxes: washers on-site, dryers on-site, dry cleaning pickup), laundry frequency for uniforms (daily / every other day / weekly), laundry frequency for towels (same options).

#### Scenario: Equipment checkboxes are optional
- **WHEN** no equipment is checked
- **THEN** the user can still advance to the next step

### Requirement: Step 3 — Food & Meals
Collects: food preparation method (radio: in-house / vendor orders / both), which meals are provided (checkboxes: pre-game snacks, post-game meals), whether coffee/drink station is managed (yes/no).

#### Scenario: All fields optional
- **WHEN** a user clicks Next without selecting any option
- **THEN** they advance to step 4 with defaults

### Requirement: Step 4 — Field & Equipment
Collects: field prep responsibilities (checkboxes: none, bases/lines, batting cage, bullpen area), equipment room tasks (checkboxes: daily organization, weekly deep clean).

#### Scenario: All checkboxes optional
- **WHEN** no options are checked
- **THEN** the user can still advance

### Requirement: Step 5 — Medical & Safety
Collects: AED check responsibility (yes/no), first aid restocking responsibility (yes/no), training room coordination (yes/no).

#### Scenario: All fields optional
- **WHEN** a user leaves all toggles at default
- **THEN** they can advance to step 6

### Requirement: Step 6 — Game-Day Specifics
Collects: typical arrival time before game (time input, e.g. "3 hours before"), post-game teardown duration estimate (select: under 30 min / 30–60 min / 60+ min), any other game-day notes (free-text textarea, optional).

#### Scenario: Arrival time is optional
- **WHEN** the time input is left blank
- **THEN** the user can still advance

### Requirement: Step 7 — Key Contacts
Collects up to 3 named contact entries: Head Trainer, Field Manager, Visiting Clubhouse Contact. Each has name (text), phone (text, optional), and email (text, optional) fields. All 3 entries are optional.

#### Scenario: Empty key contacts step is allowed
- **WHEN** all three contact entries are left blank
- **THEN** the user can submit the wizard

#### Scenario: Partially filled contacts are saved
- **WHEN** a user fills in name only for Head Trainer and leaves others blank
- **THEN** only the Head Trainer contact is created

### Requirement: Wizard submit calls the generate-tasks API
The final step's "Finish Setup" button SHALL POST all collected answers to `/api/onboarding/generate-tasks`. A loading state SHALL be shown while the request is in flight. On success, the user is redirected to `/recurring-tasks`.

#### Scenario: Loading state shown during submission
- **WHEN** a user clicks "Finish Setup"
- **THEN** the button shows a spinner and is disabled until the request completes

#### Scenario: Success redirects to recurring tasks
- **WHEN** the API returns 200
- **THEN** the user is redirected to `/recurring-tasks`

#### Scenario: Error shows toast
- **WHEN** the API returns an error
- **THEN** an error toast is shown and the user remains on step 7 to retry
