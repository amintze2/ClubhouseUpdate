## 1. API Layer

- [x] 1.1 Write `lib/api/issues.ts` — `getIssues(supabase, teamId)` (with player name join), `getIssueComments(supabase, issueId)` (with author name join), `createIssue(supabase, data)`, `updateIssueStatus(supabase, id, status)`, `updateIssueFlag(supabase, id, gmFlagged)`, `addComment(supabase, issueId, userId, comment)`
- [x] 1.2 Add migration `00013_reports_rls.sql` — add `users_gm_read_team` SELECT policy on `users` for `general_manager` role scoped to `team_id` (needed for player name join on reports page)

## 2. Shared Components

- [x] 2.1 Write `components/reports/issue-table.tsx` — table rows with player name, description preview (truncated), status badge (color-coded: gray/yellow/green), flag icon, date; clicking a row selects it; accepts `onSelect` prop
- [x] 2.2 Write `components/reports/status-badge.tsx` — pill badge for `new` (gray), `in_progress` (yellow), `resolved` (green)
- [x] 2.3 Write `components/reports/issue-detail-panel.tsx` — full description, context (Home / Away + team name), player name, date, status badge, comment thread list, optional action slot (for status buttons + comment composer)

## 3. CM Reports View

- [x] 3.1 Write `components/reports/cm-reports-view.tsx` — fetches issues on mount; status filter tabs (All / New / In Progress / Resolved); renders `IssueTable` + `IssueDetailPanel`; passes status action buttons and comment composer as children to panel
- [x] 3.2 Add status action buttons in CM detail panel — "Mark In Progress" (when new), "Mark Resolved" (when in_progress), "Reopen" (when resolved); calls `updateIssueStatus`, updates local state optimistically
- [x] 3.3 Add comment composer in CM detail panel — textarea + submit button; disabled when empty; calls `addComment`, appends comment to thread optimistically

## 4. GM Reports View

- [x] 4.1 Write `components/reports/gm-reports-view.tsx` — same table layout as CM; flag toggle button on each row and in detail panel; calls `updateIssueFlag`; no status buttons, no comment composer
- [x] 4.2 Add Supabase Realtime subscription in `gm-reports-view.tsx` — subscribe to `issue_comments` INSERT for the selected issue on detail panel open; append new comment to thread; unsubscribe when panel closes or component unmounts

## 5. Reports Page

- [x] 5.1 Replace `app/(app)/reports/page.tsx` — reads `user.role` from `useAuth()`; renders `<CMReportsView>` for `clubhouse_manager`, `<GMReportsView>` for `general_manager`; stubs a "Not available" message for other roles

## 6. Player Submission Form

- [x] 6.1 Replace `app/(app)/player-report/page.tsx` — home/away toggle (default Home); conditional "Away Team" text input shown only when Away selected; description textarea (required); submit calls `createIssue`; success toast + form reset; loading state on submit button

## 7. End-to-End Verification

- [x] 7.1 As Casey Morgan (CM): open `/reports` — seed issues appear with correct status badges and flag indicators
- [x] 7.2 CM: click an issue → detail panel opens with full description, player name, and existing comments
- [x] 7.3 CM: change status (New → In Progress → Resolved → Reopen) — updates persist after page refresh
- [x] 7.4 CM: add a comment — appears in thread with name and timestamp
- [x] 7.5 As GM user: open `/reports` — flag toggle and comment composer work
- [x] 7.6 As Jordan Lee (player): open `/player-report` — submit a Home issue; success toast shown, form resets; switch to Away, enter team name and description, submit — issue created with correct context
- [x] 7.7 Verify players cannot see other players' issues (RLS: player only sees own rows)

