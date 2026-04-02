## ADDED Requirements

### Requirement: Inventory overview displays items grouped by category
The system SHALL display all inventory items for the team grouped into six collapsible category sections: Laundry & Cleaning, Hygiene & Personal Care, Medical & Safety, Equipment & Field, Food & Beverage, and Miscellaneous. An "Items Needing Attention" count badge SHALL appear at the top showing the count of items where `stock_status` is `low` or `out`.

#### Scenario: Items grouped and displayed
- **WHEN** a clubhouse manager opens the inventory page
- **THEN** items are shown in their respective category sections, each section collapsible

#### Scenario: Attention badge reflects low/out count
- **WHEN** any items have `stock_status` of `low` or `out`
- **THEN** a badge at the top shows the total count of those items

#### Scenario: Empty category hidden
- **WHEN** a category has no items
- **THEN** that category section is not shown

### Requirement: Quick status dropdown updates stock status immediately
Each inventory item SHALL display a status dropdown with three options: Stocked, Low, Out. Selecting a value SHALL write the new `stock_status` to the database immediately (no save button required). When status is changed to "Stocked", `current_stock` SHALL be set to `par_level`. When changed to "Out", `current_stock` SHALL be set to 0. Changing to "Low" SHALL leave `current_stock` unchanged.

#### Scenario: Status change saved immediately
- **WHEN** a manager selects a new status from the dropdown
- **THEN** the status updates in the DB without requiring a separate save action

#### Scenario: Stocked sets current_stock to par_level
- **WHEN** manager sets status to "Stocked"
- **THEN** `current_stock` is updated to match `par_level`

#### Scenario: Out sets current_stock to zero
- **WHEN** manager sets status to "Out"
- **THEN** `current_stock` is set to 0

### Requirement: Edit dialog allows precise item management
An edit button on each row SHALL open a dialog with fields: item name (required), unit, par level, current stock (numeric), price per unit, purchase link, notes. Saving the dialog SHALL update the item and derive `stock_status` from `current_stock` vs `par_level`: if `current_stock >= par_level` → stocked; if `current_stock > 0 && current_stock < par_level` → low; if `current_stock === 0` → out.

#### Scenario: Edit dialog opens with current values
- **WHEN** manager clicks Edit on an item
- **THEN** dialog opens pre-populated with all existing field values

#### Scenario: Stock status derived on save
- **WHEN** manager saves the edit dialog with numeric stock values
- **THEN** `stock_status` is set based on `current_stock` vs `par_level`

#### Scenario: Item name required
- **WHEN** manager attempts to save with an empty item name
- **THEN** validation error shown, save blocked

### Requirement: Add item per category
A button at the bottom of each category section SHALL open the edit dialog in "add" mode with the category pre-set. Saving SHALL create a new inventory item scoped to the team.

#### Scenario: Add item pre-sets category
- **WHEN** manager clicks "Add item" in the Laundry & Cleaning section
- **THEN** the add dialog opens with category pre-selected as laundry_cleaning

#### Scenario: New item appears in list
- **WHEN** manager saves the add dialog
- **THEN** the new item appears in the correct category section

### Requirement: Delete item with confirmation
Each edit dialog SHALL include a delete button. Pressing it SHALL show a confirmation prompt before deleting the item.

#### Scenario: Delete requires confirmation
- **WHEN** manager clicks delete in the edit dialog
- **THEN** a confirmation prompt appears before the item is removed

#### Scenario: Confirmed delete removes item
- **WHEN** manager confirms deletion
- **THEN** item is removed from the list and deleted from the database
