## Why

Clubhouse managers need to track supply levels across categories and know when to restock between series. The current app has no inventory module; this adds it from scratch.

## What Changes

- New inventory overview page (`/inventory`) — collapsible category sections, quick status dropdown per item (Stocked / Low / Out), edit dialog for precise stock management
- Series restock banner — appears after the last home game of a series, links to a restock panel with line items, total cost, shopping list copy, and bulk "Mark All Restocked" action
- Add / edit / delete inventory items scoped to team
- Stock status is the primary UX control; numeric stock values are secondary (edit dialog only)
- Auto-derive stock status from `current_stock` vs `par_level` when edit dialog saves; quick dropdown writes status directly and optionally syncs numeric value

## Capabilities

### New Capabilities

- `inventory`: Item management, category sections, quick status updates, edit dialog, add/delete — the core inventory CRUD and UI
- `inventory-restock`: Series-end restock banner, restock panel, shopping list clipboard export, bulk mark-restocked action

### Modified Capabilities

<!-- none -->

## Impact

- `app/(app)/inventory/page.tsx` — replace stub
- `lib/api/inventory.ts` — new API module
- `components/inventory/` — new component folder
- `lib/tasks-utils.ts` — may reuse series-derivation logic for detecting series end
- Reads `games` table (series end detection) and `inventory_items` table
- No schema changes — `inventory_items` table already exists in migration
