## Context

The `inventory_items` table already exists with all needed columns (`item_name`, `category`, `unit`, `current_stock`, `par_level`, `stock_status`, `price_per_unit`, `purchase_link`, `notes`, `team_id`). RLS is already enforced by JWT `team_id` claim. The six `inventory_category` enum values map directly to the six collapsible sections in the UI. No schema changes are required.

Series-end detection reuses the existing `games` table. A series is a run of consecutive home games against the same opponent. The series restock banner should appear when: today is the day after the last home game of a series (or the day of the last game, after it ends).

## Goals / Non-Goals

**Goals:**
- Full inventory CRUD scoped to team
- Quick status dropdown as the primary interaction (no number entry on the main list)
- Edit dialog for precise stock management (numeric fields + price + link + notes)
- Series restock panel with shopping list clipboard export and bulk restock action
- Mobile-first, usable at 375px

**Non-Goals:**
- Push notifications for low stock
- Multi-team inventory views
- Purchase order generation beyond clipboard text
- Historical stock tracking / audit log

## Decisions

**Status-first UX over numeric-first**
The quick dropdown writes `stock_status` directly. When the user picks "Stocked", `current_stock` is set to `par_level`. When "Out", `current_stock` is set to 0. "Low" leaves the numeric value unchanged. This keeps the simple UI simple while letting the edit dialog add precision.

Rationale: managers check inventory quickly between tasks. A checkbox-style status is faster than entering numbers for every item.

**Series-end detection at query time**
Detect series end in the app layer: fetch home games for the next ~30 days, group by consecutive same-opponent runs, check if yesterday (or today) was the last game in a completed series. This avoids a SQL function dependency and matches the `getHomeGameSeries` pattern already needed by Meals.

**No `display_order` on inventory items**
Items are sorted by name within each category. Adding drag-and-drop order is deferred — category grouping provides enough structure.

**Restock panel as an inline dialog, not a separate page**
The panel opens as a full-screen dialog triggered by the banner. This keeps routing simple and avoids a URL the CM might accidentally share.

## Risks / Trade-offs

[Series detection edge case: away series interleaved with home games] → Mitigation: group only `home_team_id = team_id` games; away games don't affect the series boundary calculation.

[`price_per_unit` is nullable; total cost calculation may be partial] → Mitigation: show "X items unpriced" in the total line, same as the plan spec.

[Quick status sets `current_stock` to `par_level` when marking Stocked, which may not reflect actual stock] → Accepted trade-off; the edit dialog is available for precision when needed.
