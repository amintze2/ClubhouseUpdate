## ADDED Requirements

### Requirement: Series restock banner appears after series end
The inventory page SHALL display a banner when today is the day after the last home game of a completed series (consecutive home games against the same opponent). The banner SHALL read "Series vs. [Opponent] ended — review your restock needs?" and link to the restock panel.

#### Scenario: Banner shown day after series ends
- **WHEN** the last home game of a series was yesterday
- **THEN** the restock banner appears at the top of the inventory page

#### Scenario: Banner not shown mid-series
- **WHEN** the current home series is still ongoing
- **THEN** no restock banner is shown

#### Scenario: Banner not shown when no recent series
- **WHEN** there is no home series that ended within the last 2 days
- **THEN** no restock banner is shown

### Requirement: Restock panel lists items needing attention
Clicking the banner SHALL open a full-screen restock panel listing all items where `stock_status` is `low` or `out`. Each row SHALL show: item name, current stock, par level, quantity needed (par_level - current_stock), price per unit if set, and line total (quantity_needed × price_per_unit) if price is set. A total restock cost SHALL appear at the top for all items with prices, with a note indicating the count of unpriced items.

#### Scenario: Restock panel shows low and out items
- **WHEN** manager opens the restock panel
- **THEN** only items with status low or out are listed

#### Scenario: Line totals calculated when price exists
- **WHEN** an item has price_per_unit set
- **THEN** line total = (par_level - current_stock) × price_per_unit is shown

#### Scenario: Total cost reflects priced items only
- **WHEN** some items have no price set
- **THEN** total shows sum of priced items and "N items unpriced" note

### Requirement: Shopping list copies to clipboard
The restock panel SHALL include a "Copy Shopping List" button that copies a plain-text shopping list to the clipboard in the format:
```
Shopping List — Series vs. [Opponent]
☐ [Item Name] — [qty] [unit]
☐ [Item Name] — [qty] [unit] ($[price] ea)
Total: $[total] ([N] items unpriced)
```

#### Scenario: Copy button puts text on clipboard
- **WHEN** manager clicks "Copy Shopping List"
- **THEN** the formatted list is copied to the clipboard and a success toast is shown

### Requirement: Bulk mark all restocked
The restock panel SHALL include a "Mark All Restocked" button. Pressing it SHALL set `stock_status = 'stocked'` and `current_stock = par_level` for all items currently listed in the panel, then close the panel.

#### Scenario: Mark All Restocked updates all items
- **WHEN** manager clicks "Mark All Restocked"
- **THEN** all listed items have status set to stocked and current_stock set to par_level
- **THEN** the restock panel closes
