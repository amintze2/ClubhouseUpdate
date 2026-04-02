## ADDED Requirements

### Requirement: Player can set preferred name and other details
The player-info page SHALL provide a form with a preferred name text input (optional) and an "Other Details" free-text area. Saving SHALL upsert the player's row in `player_preferences`.

#### Scenario: Existing preferences pre-filled
- **WHEN** a player opens the player-info page
- **THEN** the form is pre-filled with their saved preferred name and other details

#### Scenario: Save persists preferences
- **WHEN** player saves the form
- **THEN** preferred_name and other_details are written to player_preferences

### Requirement: Player can set dietary restrictions
The player-info form SHALL include a multi-select dietary restrictions section with 11 presets: Vegetarian, Vegan, Gluten-Free, Nut Allergy, Dairy-Free, Halal, Kosher, Shellfish Allergy, Soy Allergy, Egg Allergy, Low Sodium. Selected restrictions SHALL render as dismissible chip tags. A free-text "Other" input SHALL allow custom restrictions. Saving SHALL replace all existing restrictions for the player.

#### Scenario: Presets render as chips when selected
- **WHEN** player selects a preset restriction
- **THEN** it appears as a dismissible chip tag

#### Scenario: Custom restriction added via Other input
- **WHEN** player types a custom restriction and confirms
- **THEN** it appears as a chip with is_custom = true

#### Scenario: Chips dismissible
- **WHEN** player clicks the × on a chip
- **THEN** that restriction is removed from the selection

#### Scenario: Save replaces all restrictions
- **WHEN** player saves with a new set of restrictions
- **THEN** all previous restrictions are deleted and the new set is inserted
