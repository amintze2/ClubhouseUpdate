-- Allow GMs to read users on their team (needed for player name join on reports page)
CREATE POLICY "users_gm_read_team" ON users
  FOR SELECT TO authenticated
  USING (
    auth.jwt() ->> 'role_' = 'general_manager'
    AND team_id = (auth.jwt() ->> 'team_id')::bigint
  );
