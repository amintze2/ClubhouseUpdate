# Stage 1a — Infrastructure

## What and Why

Stand up the Next.js project and create the complete Supabase database schema from scratch. This is pure infrastructure — no UI, no auth, no business logic. Everything else in the rebuild depends on this existing first.

## Scope

**Project scaffolding**
- Next.js 14 (App Router) with TypeScript, Tailwind CSS, ESLint
- Supabase JS client configured with JWT injection (`/lib/supabase.ts`)
- Shared TypeScript types (`/lib/types.ts`) — one type per table
- Folder structure matching the plan (app, lib, components, scripts, supabase)
- Vercel config (`vercel.json`) — deploys from `main`, env vars via Vercel dashboard
- `npm run dev` starts locally; `vercel deploy` succeeds with an empty shell

**Database schema**
- All enums: `user_role`, `task_visibility`, `game_day_period`, `task_category`, `inventory_category`, `stock_status`, `issue_status`, `conversation_type`
- All tables: `teams`, `users`, `games`, `tasks`, `recurring_tasks`, `recurring_task_completions`, `inventory_items`, `meals`, `player_preferences`, `player_restrictions`, `contacts`, `conversations`, `conversation_participants`, `messages`, `issues`, `issue_comments`
- `games` table includes `is_makeup boolean NOT NULL DEFAULT false` to flag postponed/rescheduled games
- All indexes defined in the plan
- Row Level Security enabled on every table with the policies from Module 2
- Schema delivered as numbered Supabase migration files (`supabase/migrations/`)

**Series derivation helper**
- `lib/series.ts` — pure TypeScript utility that groups a flat array of game rows into series
- A series = consecutive home games vs. the same opponent with no gap exceeding `maxGapDays`
- Signature: `seriesFromGames(games: Game[], options?: { maxGapDays?: number }): Series[]`
- Default `maxGapDays` is 1. Adjustable in one place if the ALPB schedule has built-in off days mid-series
- No database involvement — takes rows, returns groups

**Games import script**
- `scripts/import-games.ts` — reads a CSV/JSON export, maps team IDs, inserts into `games`, validates no duplicate date+home_team+away_team combos

## Non-Goals

- Auth (Stage 1b)
- Seed data (Stage 1b)
- Any UI or page components (Stage 1b+)
- Migration scripts for old data (Stage 8)
- Anything related to the old schema

## Deployment Context

- New Supabase project (separate from the old app's project)
- Same Vercel project as the old app, but the cutover (pointing Vercel at this repo) happens at Stage 8
- All Stage 1a work is locally testable via `supabase start` + `npm run dev` — no production touch until Stage 8

## Acceptance Criteria

- `npm run dev` starts and Tailwind renders
- `vercel deploy` succeeds with the empty shell
- `supabase db reset` applies all migrations from scratch with no errors
- RLS smoke test: a user from team A cannot query team B's inventory items
- `seriesFromGames` returns correct groupings — verified with a runnable test script covering: normal series, built-in off day (gap = 2), same-day double header, makeup game, series boundary between opponents
- Games import script runs against sample data without errors
