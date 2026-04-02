-- Allow clubhouse managers to read all users (needed to join player names
-- for dietary restrictions in meal planning, including visiting team players).
CREATE POLICY "users_cm_read_all" ON users
  FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'role_' = 'clubhouse_manager');

-- Allow clubhouse managers to read ALL player restrictions, not just their own
-- team. Visiting team players' restrictions must be visible in the meal
-- planning dialog when hosting that team.
DROP POLICY IF EXISTS "player_restrictions_access" ON player_restrictions;

CREATE POLICY "player_restrictions_access" ON player_restrictions
  FOR ALL TO authenticated
  USING (
    player_id = (auth.jwt() ->> 'sub')::bigint
    OR auth.jwt() ->> 'role_' = 'clubhouse_manager'
  )
  WITH CHECK (
    player_id = (auth.jwt() ->> 'sub')::bigint
  );
