-- Restrict cross-league messaging.
--
-- Real ALPB teams have team_id between 1 and 10. JHU / Test Team users live
-- on team_id 11 or 22 (post-00019). We want:
--   * Real-team users can only add real-team users to conversations.
--   * Test users can add anyone (so testers can drive end-to-end flows that
--     touch real-team accounts).
--
-- Implemented via a SECURITY DEFINER helper because the `users` table has
-- per-role RLS (players can only read their own row), so a plain subquery in
-- the policy WITH CHECK would be filtered by the caller's visibility and
-- produce false negatives.

CREATE OR REPLACE FUNCTION public.is_user_on_real_team(p_user_id bigint)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = p_user_id
      AND team_id BETWEEN 1 AND 10
  );
$$;

DROP POLICY IF EXISTS "conv_participants_manage" ON conversation_participants;

CREATE POLICY "conv_participants_manage" ON conversation_participants
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Test/JHU users (team_id outside 1-10) may add anyone.
    ((auth.jwt() ->> 'team_id')::bigint NOT BETWEEN 1 AND 10)
    OR
    -- Real-team users may only add other real-team users.
    public.is_user_on_real_team(user_id)
  );
