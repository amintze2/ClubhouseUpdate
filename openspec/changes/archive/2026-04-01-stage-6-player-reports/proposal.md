## Why

Players need a way to report facility and clubhouse issues directly to the CM without going through a manager. CMs need a single view to track those reports, update status, and add resolution notes. GMs need read-only visibility with the ability to flag high-priority issues.

## What Changes

- Replace `/reports` stub with a live CM + GM issue dashboard (table, detail panel, comments, status transitions)
- Replace `/player-report` stub with a player issue submission form (home/away context, description, submit)
- Add RLS-backed API layer (`lib/api/issues.ts`) for CRUD on `issues` and `issue_comments`
- No new migrations — schema, indexes, and RLS policies are already in place (migrations 00010 + 00011)
- No field manager routing — `routed_to` is always `'clubhouse_manager'` for v1

## Capabilities

### New Capabilities

- `player-reports-cm`: CM view — issue table with status badges and GM flag indicator, inline detail panel with comment thread and status action buttons
- `player-reports-gm`: GM view — same table, read-only, flag/unflag action, Supabase Realtime subscription for live comment updates
- `player-issue-submit`: Player submission form — home/away toggle, away team name field (conditional), description textarea, submit with success toast

### Modified Capabilities

<!-- none -->

## Impact

- `app/(app)/reports/page.tsx` — replaced (CM + GM share this route, behavior differs by role)
- `app/(app)/player-report/page.tsx` — replaced (player submission form)
- New: `lib/api/issues.ts`
- New: `components/reports/` — issue table, detail panel, comment thread, status buttons, issue form
- Supabase Realtime used for the first time in this project (GM view)
- No schema or migration changes needed
