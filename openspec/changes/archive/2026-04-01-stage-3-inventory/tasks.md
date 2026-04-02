## 1. Types & API Layer

- [x] 1.1 Add `InventoryItem`, `InventoryCategory`, `StockStatus` types to `lib/types.ts`
- [x] 1.2 Write `lib/api/inventory.ts` — `getInventoryItems(supabase, teamId)`, `createInventoryItem(supabase, data)`, `updateInventoryItem(supabase, id, data)`, `deleteInventoryItem(supabase, id)`
- [x] 1.3 Add `updateInventoryStatus(supabase, id, status)` to `lib/api/inventory.ts` — quick-status helper that also syncs `current_stock` (stocked → par_level, out → 0, low → unchanged)
- [x] 1.4 Add `bulkMarkRestocked(supabase, ids)` to `lib/api/inventory.ts` — sets status=stocked and current_stock=par_level for all given ids
- [x] 1.5 Add `getSeriesEndedYesterday(supabase, teamId)` to `lib/api/inventory.ts` — returns opponent name if a home series ended yesterday or today, otherwise null

## 2. Inventory Item Components

- [x] 2.1 Write `components/inventory/item-row.tsx` — single item row with status dropdown (Stocked/Low/Out), item name, warning icon for low/out, edit button
- [x] 2.2 Write `components/inventory/category-section.tsx` — collapsible section with category label, item list, and "Add item" button at the bottom
- [x] 2.3 Write `components/inventory/item-edit-dialog.tsx` — add/edit dialog with fields: item name (required), unit, par level, current stock, price per unit, purchase link, notes; derive stock_status on save; delete button with confirmation

## 3. Restock Components

- [x] 3.1 Write `components/inventory/restock-banner.tsx` — dismissible banner showing "Series vs. [Opponent] ended — review your restock needs?" with a button to open the restock panel
- [x] 3.2 Write `components/inventory/restock-panel.tsx` — full-screen dialog listing low/out items with columns: name, current stock, par level, qty needed, price, line total; total cost row with unpriced item note; "Copy Shopping List" button; "Mark All Restocked" button

## 4. Inventory Page

- [x] 4.1 Replace `app/(app)/inventory/page.tsx` stub — fetch inventory items and series-end status; render attention badge, optional restock banner, and category sections; wire all interactions with optimistic updates and toast on error

## 5. End-to-End Verification

- [x] 5.1 Add item → appears in correct category section; edit it → changes persist; delete it → removed
- [x] 5.2 Quick status dropdown: change to Low → warning icon appears; change to Out → double warning; change to Stocked → icons gone; attention badge count updates
- [x] 5.3 Edit dialog: set current_stock=0 and par_level=12 → status auto-derives to Out; set current_stock=12 → status derives to Stocked
- [x] 5.4 Restock panel: with low/out items present, open panel → items listed with correct qty needed; click "Copy Shopping List" → toast shown; click "Mark All Restocked" → items flip to Stocked, panel closes
- [x] 5.5 Series restock banner: verify it appears when a home series ended (seed data has yesterday's series ending)
- [x] 5.6 Verify all views usable at 375px width (collapsible sections, dialogs, restock panel)
