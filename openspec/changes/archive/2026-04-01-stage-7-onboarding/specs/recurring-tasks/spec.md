## ADDED Requirements

### Requirement: Re-run Onboarding button on Recurring Tasks page
A "Re-run Onboarding" button SHALL appear on the Recurring Tasks page for users with `role === "clubhouse_manager"`. Clicking it opens a dialog asking whether to replace all existing recurring tasks or add to them.

#### Scenario: Button visible to CM only
- **WHEN** a clubhouse manager views the Recurring Tasks page
- **THEN** a "Re-run Onboarding" button is visible

#### Scenario: Replace mode confirmation dialog
- **WHEN** a CM clicks "Re-run Onboarding" and chooses "Replace all existing tasks"
- **THEN** a confirmation dialog warns that all current recurring tasks will be deleted, and requires explicit confirmation before proceeding

#### Scenario: Merge mode proceeds without extra confirmation
- **WHEN** a CM clicks "Re-run Onboarding" and chooses "Add to existing"
- **THEN** they are taken directly to the onboarding wizard without a destructive-action confirmation

#### Scenario: Wizard in re-run mode
- **WHEN** the wizard is opened via re-run
- **THEN** the wizard behaves identically to first-run but passes the selected mode (replace/merge) to the generate-tasks API on submit
