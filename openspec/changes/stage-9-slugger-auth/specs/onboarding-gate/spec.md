## MODIFIED Requirements

### Requirement: New CMs are redirected to onboarding on login
The `app/(app)/layout.tsx` client component SHALL check `user.has_completed_onboarding` after auth resolves. If `user.role === "clubhouse_manager"` and `has_completed_onboarding === false` and the current path is not `/onboarding`, it SHALL call `router.replace("/onboarding")` and return `null` until the redirect fires.

#### Scenario: New CM redirected
- **WHEN** a CM with `has_completed_onboarding = false` navigates to any `/(app)/` route other than `/onboarding`
- **THEN** they are immediately redirected to `/onboarding` and no page content is shown

#### Scenario: Completed CM not redirected
- **WHEN** a CM with `has_completed_onboarding = true` navigates to `/`
- **THEN** they are redirected to `/checklists` via the normal auth redirect

#### Scenario: Layout renders null during redirect
- **WHEN** the gate condition is true and redirect is firing
- **THEN** no page content or sidebar is shown (returns null)

#### Scenario: No redirect loop on onboarding page
- **WHEN** a new CM is already on `/onboarding`
- **THEN** the gate does not redirect them again
