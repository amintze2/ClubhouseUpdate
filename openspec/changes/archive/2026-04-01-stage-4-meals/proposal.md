## Why

Clubhouse managers need to plan meals for home game series and see players' dietary restrictions at a glance. Players need to submit their dietary preferences and view the meal schedule. These two surfaces are tightly coupled and should ship together.

## What Changes

- New `/meals` page for clubhouse managers — series cards showing planning status, dietary restriction warnings, and batch meal planning dialog per series
- Multi-game planning dialog — one row per game with pre-game snack + post-game meal text areas, "Copy from previous game" shortcut, dietary restrictions panel at top
- New `/player-info` page — player profile form for preferred name, dietary restrictions (11 presets + free-text "Other"), and other details
- New `/player-meals` page — read-only meal schedule for players showing only games with planned meals
- API layer: series grouping, meal upsert, dietary restriction aggregation

## Capabilities

### New Capabilities

- `meal-planning`: CM-facing series list, series status, batch meal planning dialog, per-game editing, dietary restrictions display
- `player-profile`: Player-facing dietary restrictions and preferred name form
- `player-meal-schedule`: Player-facing read-only meal schedule

### Modified Capabilities

<!-- none -->

## Impact

- `app/(app)/meals/page.tsx` — replace stub
- `app/(app)/player-info/page.tsx` — replace stub
- `app/(app)/player-meals/page.tsx` — replace stub
- `lib/api/meals.ts` — new API module
- `components/meals/` — new component folder
- `components/player/` — new component folder
- Reads `games`, `meals`, `player_restrictions`, `player_preferences`, `teams` tables
- No schema changes — all tables already exist in migrations
