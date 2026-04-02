## Context

Stage 1a laid down the full task schema (`tasks`, `recurring_tasks`, `recurring_task_completions`) with RLS. Stage 1b delivered auth and the app shell with stub pages. Stage 2 fills in the three task views that are the primary daily workflow for clubhouse managers. The data model is fixed — no schema changes needed. All implementation is UI + a thin API layer on top of existing Supabase tables.

The key behavior difference from the old app: recurring task completions are now persisted to the DB (not React state), so they survive page refresh. One-off task CRUD uses optimistic updates to keep the UI snappy despite round-trip latency.

## Goals / Non-Goals

**Goals:**
- Functional Daily Checklists view with game-day sectioning derived from the `games` table
- Functional Recurring Tasks management (CRUD + enable/disable)
- Functional Task Calendar with weekly grid and day-detail panel
- Typed API layer (`lib/api/tasks.ts`) all three views share
- Optimistic updates with rollback + toast on all mutations
- All views usable at 375px width

**Non-Goals:**
- Push notifications or background sync
- Multi-user task assignment (tasks are per-user only in v1)
- Bulk operations (select all, bulk delete)
- Drag-and-drop reordering

## Decisions

### D1: API layer as plain async functions, not a hook library
Each view fetches its own data via direct `async` calls in `useEffect` or server-fetched where possible. No custom `useTasks()` abstraction — the three views have different enough data needs that a shared hook would add complexity without value. The `lib/api/tasks.ts` module exports typed functions; views call them directly.

**Alternative considered:** React Query / SWR for caching and background refetch. Rejected for Stage 2 — adds a dependency and complexity that isn't needed until real users generate enough load to care about refetch intervals.

### D2: Game-day detection via `games` table lookup, not client-side series
Each view that needs `isGameDay` fetches today's games for the user's team with a simple `eq('home_team_id', teamId).eq('game_date', today)` query. The series derivation helper (`lib/series.ts`) is not used here — it's for multi-game series grouping (Stage 3+ inventory). A single date lookup is sufficient and cheaper.

**Alternative considered:** Re-using `seriesFromGames`. Unnecessary — series context doesn't matter for task day-type detection.

### D3: One-off task time → section mapping is client-side
The period assignment logic (before 12:00 → Morning, 12:00–game time → Pre-Game, after game time → Post-Game) runs in the component, not the DB. The game time comes from the day's game row; default is 19:00 if no game time is set. This avoids a computed column in Postgres and keeps the logic easy to adjust.

### D4: Optimistic updates for all mutations
Every checkbox toggle, enable/disable, and CRUD operation updates local state first, fires the Supabase call, and rolls back + toasts on error. This is especially important for checkbox toggles which happen frequently and must feel instant.

### D5: Shared UI primitives in `components/ui/`
Toast, Dialog, Badge, and Button are created as minimal shared components rather than installing a full component library. Keeps the bundle small and gives full control over styling. If a component library becomes warranted (Stage 4+), these can be swapped out.

## Risks / Trade-offs

- **Stale game data** → If games aren't imported for the current date, `isGameDay` returns false and tasks show in off-day mode. Mitigation: seed data covers today (per Stage 1b), and the import script can be re-run.
- **Recurring task completion race** → If a user toggles a completion on two devices simultaneously, the last write wins. Acceptable for v1 — single-user per session in practice.
- **No pagination on calendar** → The calendar fetches all tasks in a date range (±2 weeks). At typical usage volumes (< 50 tasks/week) this is fine. Mitigation: add a `limit` if performance degrades.

## Open Questions

*(none — schema and RLS are finalized, requirements are clear)*
