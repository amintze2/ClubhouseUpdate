## Context

The `issues` and `issue_comments` tables are already created and RLS-scoped (migrations 00010 + 00011). Seed data includes 3 issues in different states. The `/reports` and `/player-report` pages are stubs. This stage wires them up.

Three distinct experiences share the issue data:
- **CM** (`clubhouse_manager`): full read + write on their team's issues; can add comments, transition status
- **GM** (`general_manager`): read + flag/unflag on their team's issues; read comments; no status transitions; realtime updates
- **Player** (`player`): can only submit new issues; can read their own; cannot see other players' reports

## Goals / Non-Goals

**Goals:**
- CM dashboard: filterable issue table, inline detail panel, comment composer, status action buttons (Mark In Progress, Mark Resolved, Reopen)
- GM dashboard: same table layout (read-only), flag/unflag button, Supabase Realtime subscription for new comments
- Player form: home/away toggle, conditional away team name input, description, submit with optimistic feedback
- Graceful empty states for each role

**Non-Goals:**
- Field manager routing (future — `routed_to` stays `'clubhouse_manager'` for all new submissions)
- Push notifications or email on new report
- Issue editing or deletion
- Pagination (issue counts are low per team)

## Decisions

### Shared `/reports` route, role-branched rendering
Both CM and GM land on `/reports`. The page reads `user.role` from `useAuth()` and renders either `<CMReportsView>` or `<GMReportsView>`. This avoids duplicating the route and keeps the sidebar nav entry simple.

**Alternative considered:** separate `/reports/cm` and `/reports/gm` routes. Rejected — adds routing complexity for identical navigation structure.

### Detail panel as inline drawer (not modal)
Clicking an issue row expands a detail panel to the right of the table (desktop) or below (mobile). This keeps the issue list visible while reviewing a report, which matches how CMs work through a queue.

**Alternative:** modal dialog. Rejected — hides context (the list) while reviewing.

### Realtime scope: GM only
Realtime subscription on `issue_comments` is added only in the GM view. CMs actively interact (post comments, change status) so they see changes immediately. GMs are passive observers who benefit most from live updates.

Implementation: `supabase.channel()` with a postgres_changes filter on `issue_id IN (...)`. Subscribe on mount, unsubscribe on unmount.

### Player away team name: free text, not dropdown
Away team name on player submissions is a free-text input, not a dropdown from the `teams` table. Visiting teams aren't always in the local DB (away game could be at any team's stadium). This matches the schema (`away_team_name text`).

### API layer: `lib/api/issues.ts`
Functions:
- `getIssues(supabase, teamId)` — for CM/GM: fetches all issues for team ordered by created_at desc; joins `users` for player name
- `getIssueComments(supabase, issueId)` — returns comments with user name
- `createIssue(supabase, data)` — player submission; sets `routed_to = 'clubhouse_manager'`
- `updateIssueStatus(supabase, id, status)` — CM only
- `updateIssueFlag(supabase, id, gmFlagged)` — GM only
- `addComment(supabase, issueId, userId, comment)` — CM/GM

Player name join: `issues` doesn't embed user info, so `getIssues` uses a PostgREST FK join: `.select('*, users!issues_player_id_fkey(user_name)')`. Same `as any[]` pattern used in games FK joins.

## Risks / Trade-offs

- **Realtime connection overhead** → Subscribe only in GM view, unsubscribe on unmount; single channel per page load
- **Player name RLS gap** → CM already has `users_cm_read_all` policy from migration 00012 (added for meal dietary restrictions), so the FK join for player names will work for CMs. GM does not have this policy — need to add a `users_gm_read_team` policy in a new migration.
- **No pagination** → Acceptable for v1; team issue volume is low. Add if needed.

## Open Questions

None — schema, RLS, and seed data are already in place. The GM `users` read policy is the only missing piece (handled in a new migration in the tasks).
