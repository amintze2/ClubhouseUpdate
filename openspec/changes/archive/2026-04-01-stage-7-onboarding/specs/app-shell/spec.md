## MODIFIED Requirements

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
