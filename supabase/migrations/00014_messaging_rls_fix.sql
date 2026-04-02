-- Allow CMs to find the bulletin conversation even before joining it.
-- Without this, ensureBulletinMembership can't find an existing bulletin
-- (conversations_participant_read filters by participation), so it creates
-- a duplicate on every page load.
CREATE POLICY "conversations_bulletin_cm_read" ON conversations
  FOR SELECT TO authenticated
  USING (
    type = 'bulletin'
    AND auth.jwt() ->> 'role_' = 'clubhouse_manager'
  );

-- Fix circular RLS on conversation_participants.
-- The original "conv_participants_read" policy queried conversation_participants
-- from within its own policy, causing infinite recursion → 500 errors.
-- Solution: use a SECURITY DEFINER function that bypasses RLS for the subquery.

DROP POLICY "conv_participants_read" ON conversation_participants;

CREATE OR REPLACE FUNCTION auth_user_conversation_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT conversation_id
  FROM conversation_participants
  WHERE user_id = (auth.jwt() ->> 'sub')::bigint;
$$;

CREATE POLICY "conv_participants_read" ON conversation_participants
  FOR SELECT TO authenticated
  USING (conversation_id IN (SELECT auth_user_conversation_ids()));

-- Allow participants to update their own last_read_at (needed for markRead)
CREATE POLICY "conv_participants_update_own" ON conversation_participants
  FOR UPDATE TO authenticated
  USING (user_id = (auth.jwt() ->> 'sub')::bigint)
  WITH CHECK (user_id = (auth.jwt() ->> 'sub')::bigint);
