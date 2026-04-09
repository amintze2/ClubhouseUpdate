## REMOVED Requirements

### Requirement: Wizard renders only for new CMs
**Reason**: Replaced by the `onboarding-chat` capability. Access control (CM role + `has_completed_onboarding`) is preserved in the new chat interface.
**Migration**: See `onboarding-chat` spec — the same access rules apply to the new chat UI.

### Requirement: Wizard has 7 sequential steps
**Reason**: The 7-step form is fully replaced by a conversational AI interface. The step structure (Facility Basics, Laundry, Food, Field, Medical, Game-Day, Contacts) becomes internal domain knowledge in the AI system prompt, not visible UI.
**Migration**: No migration needed for end users — the `/onboarding` route now renders the chat UI.

### Requirement: Step 1 — Facility Basics
**Reason**: Removed with wizard.
**Migration**: The AI elicits equivalent information conversationally.

### Requirement: Step 2 — Laundry & Cleaning
**Reason**: Removed with wizard.
**Migration**: The AI elicits equivalent information conversationally.

### Requirement: Step 3 — Food & Meals
**Reason**: Removed with wizard.
**Migration**: The AI elicits equivalent information conversationally.

### Requirement: Step 4 — Field & Equipment
**Reason**: Removed with wizard.
**Migration**: The AI elicits equivalent information conversationally.

### Requirement: Step 5 — Medical & Safety
**Reason**: Removed with wizard.
**Migration**: The AI elicits equivalent information conversationally.

### Requirement: Step 6 — Game-Day Specifics
**Reason**: Removed with wizard.
**Migration**: The AI elicits equivalent information conversationally.

### Requirement: Step 7 — Key Contacts
**Reason**: Removed with wizard. Contact collection is deferred to a future change.
**Migration**: Contacts are not collected during onboarding in this version.

### Requirement: Wizard submit calls the generate-tasks API
**Reason**: Replaced by the preview confirm flow in `onboarding-chat`. The `/api/onboarding/generate-tasks` route is kept but its input schema changes (see `onboarding-task-generation` spec).
**Migration**: See `onboarding-chat` spec — confirm button POSTs `GeneratedTask[]` directly.
