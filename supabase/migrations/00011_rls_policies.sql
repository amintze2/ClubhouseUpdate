-- ============================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_comments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- JWT CLAIM HELPERS
--
-- Our auth bootstrap (Stage 1b) signs JWTs with:
--   sub      = users.id (integer as text)
--   team_id  = users.team_id (integer as text)
--   role_    = users.role enum value
--
-- Policies read these claims directly — no subquery into users
-- needed, which avoids circular RLS dependency.
-- ============================================================

-- ============================================================
-- TEAMS: all authenticated users can read
-- ============================================================

CREATE POLICY "teams_read_authenticated" ON teams
  FOR SELECT TO authenticated USING (true);

-- ============================================================
-- USERS: users read their own row by sub claim
-- ============================================================

CREATE POLICY "users_read_own" ON users
  FOR SELECT TO authenticated
  USING (id = (auth.jwt() ->> 'sub')::bigint);

-- ============================================================
-- GAMES: team-scoped read (home or away)
-- ============================================================

CREATE POLICY "games_read_team" ON games
  FOR SELECT TO authenticated
  USING (
    home_team_id = (auth.jwt() ->> 'team_id')::bigint
    OR away_team_id = (auth.jwt() ->> 'team_id')::bigint
  );

-- ============================================================
-- TASKS: user-scoped (sub = users.id)
-- ============================================================

CREATE POLICY "tasks_own_user" ON tasks
  FOR ALL TO authenticated
  USING (user_id = (auth.jwt() ->> 'sub')::bigint)
  WITH CHECK (user_id = (auth.jwt() ->> 'sub')::bigint);

-- ============================================================
-- RECURRING TASKS: user-scoped
-- ============================================================

CREATE POLICY "recurring_tasks_own_user" ON recurring_tasks
  FOR ALL TO authenticated
  USING (user_id = (auth.jwt() ->> 'sub')::bigint)
  WITH CHECK (user_id = (auth.jwt() ->> 'sub')::bigint);

-- ============================================================
-- RECURRING TASK COMPLETIONS: via recurring_task ownership
-- ============================================================

CREATE POLICY "rtc_own_user" ON recurring_task_completions
  FOR ALL TO authenticated
  USING (
    recurring_task_id IN (
      SELECT id FROM recurring_tasks
      WHERE user_id = (auth.jwt() ->> 'sub')::bigint
    )
  )
  WITH CHECK (
    recurring_task_id IN (
      SELECT id FROM recurring_tasks
      WHERE user_id = (auth.jwt() ->> 'sub')::bigint
    )
  );

-- ============================================================
-- INVENTORY: team-scoped
-- ============================================================

CREATE POLICY "inventory_team_scoped" ON inventory_items
  FOR ALL TO authenticated
  USING (team_id = (auth.jwt() ->> 'team_id')::bigint)
  WITH CHECK (team_id = (auth.jwt() ->> 'team_id')::bigint);

-- ============================================================
-- MEALS: team-scoped via home game
-- ============================================================

CREATE POLICY "meals_team_scoped" ON meals
  FOR ALL TO authenticated
  USING (
    game_id IN (
      SELECT id FROM games
      WHERE home_team_id = (auth.jwt() ->> 'team_id')::bigint
    )
  )
  WITH CHECK (
    game_id IN (
      SELECT id FROM games
      WHERE home_team_id = (auth.jwt() ->> 'team_id')::bigint
    )
  );

-- ============================================================
-- PLAYER PREFERENCES: player reads/writes own; CM reads team
-- ============================================================

CREATE POLICY "player_preferences_access" ON player_preferences
  FOR ALL TO authenticated
  USING (
    player_id = (auth.jwt() ->> 'sub')::bigint
    OR (
      auth.jwt() ->> 'role_' = 'clubhouse_manager'
      AND player_id IN (
        SELECT id FROM users
        WHERE team_id = (auth.jwt() ->> 'team_id')::bigint
      )
    )
  )
  WITH CHECK (
    player_id = (auth.jwt() ->> 'sub')::bigint
  );

CREATE POLICY "player_restrictions_access" ON player_restrictions
  FOR ALL TO authenticated
  USING (
    player_id = (auth.jwt() ->> 'sub')::bigint
    OR (
      auth.jwt() ->> 'role_' = 'clubhouse_manager'
      AND player_id IN (
        SELECT id FROM users
        WHERE team_id = (auth.jwt() ->> 'team_id')::bigint
      )
    )
  )
  WITH CHECK (
    player_id = (auth.jwt() ->> 'sub')::bigint
  );

-- ============================================================
-- CONTACTS: team-scoped read (all roles); CM-only write
-- ============================================================

CREATE POLICY "contacts_team_read" ON contacts
  FOR SELECT TO authenticated
  USING (team_id = (auth.jwt() ->> 'team_id')::bigint);

CREATE POLICY "contacts_cm_write" ON contacts
  FOR INSERT TO authenticated
  WITH CHECK (
    team_id = (auth.jwt() ->> 'team_id')::bigint
    AND auth.jwt() ->> 'role_' = 'clubhouse_manager'
  );

CREATE POLICY "contacts_cm_update" ON contacts
  FOR UPDATE TO authenticated
  USING (
    team_id = (auth.jwt() ->> 'team_id')::bigint
    AND auth.jwt() ->> 'role_' = 'clubhouse_manager'
  )
  WITH CHECK (
    team_id = (auth.jwt() ->> 'team_id')::bigint
    AND auth.jwt() ->> 'role_' = 'clubhouse_manager'
  );

CREATE POLICY "contacts_cm_delete" ON contacts
  FOR DELETE TO authenticated
  USING (
    team_id = (auth.jwt() ->> 'team_id')::bigint
    AND auth.jwt() ->> 'role_' = 'clubhouse_manager'
  );

-- ============================================================
-- CONVERSATIONS: participants only
-- ============================================================

CREATE POLICY "conversations_participant_read" ON conversations
  FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = (auth.jwt() ->> 'sub')::bigint
    )
  );

CREATE POLICY "conversations_create" ON conversations
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ============================================================
-- CONVERSATION PARTICIPANTS
-- ============================================================

CREATE POLICY "conv_participants_read" ON conversation_participants
  FOR SELECT TO authenticated
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants cp2
      WHERE cp2.user_id = (auth.jwt() ->> 'sub')::bigint
    )
  );

CREATE POLICY "conv_participants_manage" ON conversation_participants
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ============================================================
-- MESSAGES: participants only
-- ============================================================

CREATE POLICY "messages_participant_read" ON messages
  FOR SELECT TO authenticated
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = (auth.jwt() ->> 'sub')::bigint
    )
  );

CREATE POLICY "messages_participant_send" ON messages
  FOR INSERT TO authenticated
  WITH CHECK (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = (auth.jwt() ->> 'sub')::bigint
    )
    AND sender_id = (auth.jwt() ->> 'sub')::bigint
  );

-- ============================================================
-- ISSUES
-- ============================================================

CREATE POLICY "issues_player_create" ON issues
  FOR INSERT TO authenticated
  WITH CHECK (
    player_id = (auth.jwt() ->> 'sub')::bigint
    AND auth.jwt() ->> 'role_' = 'player'
  );

CREATE POLICY "issues_read" ON issues
  FOR SELECT TO authenticated
  USING (
    (
      auth.jwt() ->> 'role_' = 'player'
      AND player_id = (auth.jwt() ->> 'sub')::bigint
    )
    OR (
      auth.jwt() ->> 'role_' IN ('clubhouse_manager', 'general_manager')
      AND player_team_id = (auth.jwt() ->> 'team_id')::bigint
    )
  );

CREATE POLICY "issues_cm_update" ON issues
  FOR UPDATE TO authenticated
  USING (
    player_team_id = (auth.jwt() ->> 'team_id')::bigint
    AND auth.jwt() ->> 'role_' IN ('clubhouse_manager', 'general_manager')
  )
  WITH CHECK (
    player_team_id = (auth.jwt() ->> 'team_id')::bigint
    AND auth.jwt() ->> 'role_' IN ('clubhouse_manager', 'general_manager')
  );

-- ============================================================
-- ISSUE COMMENTS
-- ============================================================

CREATE POLICY "issue_comments_read" ON issue_comments
  FOR SELECT TO authenticated
  USING (
    issue_id IN (
      SELECT id FROM issues
      WHERE
        (auth.jwt() ->> 'role_' = 'player' AND player_id = (auth.jwt() ->> 'sub')::bigint)
        OR
        (auth.jwt() ->> 'role_' IN ('clubhouse_manager', 'general_manager')
         AND player_team_id = (auth.jwt() ->> 'team_id')::bigint)
    )
  );

CREATE POLICY "issue_comments_cm_write" ON issue_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'role_' IN ('clubhouse_manager', 'general_manager')
    AND issue_id IN (
      SELECT id FROM issues
      WHERE player_team_id = (auth.jwt() ->> 'team_id')::bigint
    )
  );
