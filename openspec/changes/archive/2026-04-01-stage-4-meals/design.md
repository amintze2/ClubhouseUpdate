## Context

All required tables exist: `meals` (game_id UNIQUE, pre_game_snack, post_game_meal), `player_preferences` (preferred_name, other_details), `player_restrictions` (player_id, restriction, is_custom). RLS is already in place.

**RLS constraint for dietary restrictions:** The `player_restrictions` policy allows a CM to read only players on their own team. Away team players may not be registered in this system at all. This limits the dietary summary to home-team players only for now.

Series grouping logic is already established in the inventory module (`getSeriesEndedYesterday`). The same consecutive-games-vs-same-opponent grouping is used here to produce the full forward-looking series list.

## Goals / Non-Goals

**Goals:**
- CM can see all upcoming home series and their meal planning status at a glance
- CM can plan all games in a series in one dialog with batch save
- CM can copy a meal from the previous game in a series
- Players can set dietary restrictions and view the meal schedule
- Home team dietary restrictions surface in the planning dialog

**Non-Goals:**
- Away team dietary restrictions (RLS blocks cross-team reads; deferred to a future server action)
- Meal templates or suggestions
- Nutritional tracking
- Push notifications for unplanned meals

## Decisions

**Series grouping in app layer, not SQL**
Same decision as inventory: fetch games within a rolling window, group consecutive same-opponent home games. Simple, no stored procedure dependency, consistent with the inventory module.

**Batch upsert via `onConflict: 'game_id'`**
The `meals` table has a UNIQUE constraint on `game_id`, so `upsert` with `onConflict('game_id')` handles both create and update in one call. The full array is sent at once rather than one request per game.

**Player restrictions: replace-all on save**
Rather than diffing additions/removals, saving the player profile deletes all existing restrictions for that player then inserts the new set. This is simpler and safe since the player owns their own data.

**Preset restrictions as constants, not a DB table**
The 11 preset restrictions are defined as a constant in the frontend. This avoids a lookup table and keeps the form self-contained. Custom "Other" text is stored with `is_custom = true`.

**Series dialog, not separate page**
The multi-game planning dialog opens over the series list page rather than navigating to a new route. This keeps the URL clean and makes it easy to plan multiple series in one session.

## Risks / Trade-offs

[Away team dietary restrictions not shown] → Accepted for now. The UI shows a note "Away team restrictions not available" rather than silently omitting them.

[Series with makeup games may have a gap] → Mitigation: same 2-day gap tolerance used in inventory series detection.

[Large series (6 games) means tall dialog on mobile] → Mitigation: dialog scrolls vertically; each game row is compact.
