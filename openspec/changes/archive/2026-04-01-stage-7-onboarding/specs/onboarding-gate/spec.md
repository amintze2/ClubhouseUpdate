## ADDED Requirements

### Requirement: New CMs are redirected to onboarding on login
The `app/(app)/layout.tsx` client component SHALL check `user.has_completed_onboarding` after auth resolves. If `user.role === "clubhouse_manager"` and `has_completed_onboarding === false`, it SHALL redirect to `/onboarding` and render `null` until the redirect fires.

#### Scenario: New CM redirected
- **WHEN** a CM with `has_completed_onboarding = false` navigates to any `/(app)/` route
- **THEN** they are immediately redirected to `/onboarding`

#### Scenario: Completed CM not redirected
- **WHEN** a CM with `has_completed_onboarding = true` navigates to `/`
- **THEN** they see the Daily Checklists page normally

#### Scenario: Layout renders null during redirect
- **WHEN** the gate condition is true and redirect is firing
- **THEN** no page content or sidebar is shown (renders null)

### Requirement: Onboarding page is excluded from the gate
The `/onboarding` route itself SHALL not trigger the gate redirect, to avoid an infinite loop.

#### Scenario: No redirect loop on onboarding page
- **WHEN** a new CM is already on `/onboarding`
- **THEN** the gate does not redirect them again
