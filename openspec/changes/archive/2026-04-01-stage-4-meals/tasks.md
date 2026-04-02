## 1. API Layer

- [x] 1.1 Write `lib/api/meals.ts` — `getHomeGameSeries(supabase, teamId)` returning `{ opponent: string; games: Game[]; meals: (Meal | null)[] }[]` using the same consecutive-game grouping logic as inventory
- [x] 1.2 Add `upsertMeals(supabase, rows: { game_id: number; pre_game_snack: string; post_game_meal: string }[])` to `lib/api/meals.ts` — batch upsert on conflict game_id
- [x] 1.3 Add `getHomeDietaryRestrictions(supabase, teamId)` to `lib/api/meals.ts` — returns `{ player_name: string; restrictions: string[] }[]` for all players on the home team who have restrictions
- [x] 1.4 Add `getPlayerProfile(supabase, playerId)` to `lib/api/meals.ts` — returns `{ preferences: PlayerPreference | null; restrictions: string[] }`
- [x] 1.5 Add `savePlayerProfile(supabase, playerId, data: { preferred_name: string | null; other_details: string | null; restrictions: string[] })` to `lib/api/meals.ts` — upserts preferences and replaces all restrictions

## 2. Meal Planning Components (CM)

- [x] 2.1 Write `components/meals/series-card.tsx` — card showing opponent, date range, game count, planning status badge, dietary restriction warning icon
- [x] 2.2 Write `components/meals/series-dialog.tsx` — multi-game planning dialog with dietary summary at top, one row per game (date/time, pre-game snack textarea, post-game meal textarea, "Copy from above" button), Save and Cancel buttons

## 3. Player Components

- [x] 3.1 Write `components/player/restriction-chips.tsx` — multi-select UI with 11 preset chips + free-text "Other" input; selected items render as dismissible tags
- [x] 3.2 Write `components/player/profile-form.tsx` — form combining preferred name input, restriction-chips, and other-details textarea with Save button

## 4. Pages

- [x] 4.1 Replace `app/(app)/meals/page.tsx` stub — fetch series data; render series cards; open series dialog on click; wire save with optimistic update and toast
- [x] 4.2 Replace `app/(app)/player-info/page.tsx` stub — fetch player profile; render profile-form; wire save with toast
- [x] 4.3 Replace `app/(app)/player-meals/page.tsx` stub — fetch meals for team's upcoming home games; render read-only table sorted by date; show empty state if none

## 5. End-to-End Verification

- [x] 5.1 Meals page: series cards appear with correct opponent, date range, and "Not Planned" / partial status
- [x] 5.2 Open a series dialog: dietary summary shows (or "No restrictions on file" if none); fill in meals for all games; save → status updates to "All Planned"
- [x] 5.3 "Copy from above" button: fills current row from the row above
- [x] 5.4 Re-open a planned series: text areas are pre-filled with saved values
- [x] 5.5 Player-info: select dietary restrictions, add an "Other" custom one, save; reload — chips re-appear
- [x] 5.6 Player-meals: after planning meals as CM, switch to Jordan Lee (player) → meal schedule shows planned games
- [x] 5.7 Verify all views usable at 375px width
