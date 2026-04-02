## ADDED Requirements

### Requirement: Role-based navigation renders correct tabs
The app shell SHALL render navigation items based on `user.role`. Desktop shows a sidebar; mobile (viewport < 768px) shows a bottom tab bar.

**Clubhouse Manager tabs:** Daily Checklists, Task Calendar, Recurring Tasks, Inventory, Meal Planning, Messages, Player Reports

**General Manager tabs:** Player Reports

**Player tabs:** Player Info, Meal Schedule, Issue Reporting

If a role has more than 5 tabs on mobile, a "More" tab expands the overflow items.

#### Scenario: Clubhouse manager sees full nav
- **WHEN** the authenticated user has role `clubhouse_manager`
- **THEN** all 7 navigation items are rendered

#### Scenario: General manager sees only player reports
- **WHEN** the authenticated user has role `general_manager`
- **THEN** only the Player Reports navigation item is rendered

#### Scenario: Player sees player-specific tabs
- **WHEN** the authenticated user has role `player`
- **THEN** Player Info, Meal Schedule, and Issue Reporting navigation items are rendered

#### Scenario: Mobile shows bottom tab bar
- **WHEN** viewport width is less than 768px
- **THEN** navigation renders as a bottom tab bar, not a sidebar

### Requirement: Unauthenticated users cannot access app routes
The `(app)` layout SHALL check authentication state on every render. Unauthenticated requests SHALL be shown an auth error screen, not the app.

#### Scenario: Unauthenticated access blocked
- **WHEN** a user navigates to any `/(app)/` route without a valid session
- **THEN** they see an auth error screen, not the page content

### Requirement: New clubhouse managers are gated to onboarding
If `user.role === "clubhouse_manager"` and `user.has_completed_onboarding === false`, the app shell SHALL redirect to `/onboarding` and not render the sidebar navigation. The gate SHALL NOT apply on the `/onboarding` route itself to prevent redirect loops.

#### Scenario: New CM redirected to onboarding
- **WHEN** a clubhouse manager logs in with `has_completed_onboarding = false`
- **THEN** they are redirected to `/onboarding` before seeing any other page

#### Scenario: Returning CM bypasses onboarding
- **WHEN** a clubhouse manager logs in with `has_completed_onboarding = true`
- **THEN** they are taken directly to the Daily Checklists page

#### Scenario: No redirect loop on onboarding page
- **WHEN** a new CM is already on `/onboarding`
- **THEN** the gate does not redirect them again

#### Scenario: Layout renders null while redirecting
- **WHEN** the gate condition is met and redirect is in progress
- **THEN** no sidebar or page content is rendered

### Requirement: Contact bar slot present on all authenticated pages
A contact bar placeholder SHALL appear between the header and page content on all authenticated pages for all roles. It renders as a collapsed stub in Stage 1b and becomes data-connected in Stage 3.

#### Scenario: Contact bar present for all roles
- **WHEN** any authenticated user views any app page
- **THEN** the contact bar slot is present in the layout
