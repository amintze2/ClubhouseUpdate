-- Atomic bulletin membership function.
-- Client-side check-then-insert is unreliable due to RLS evaluation timing
-- and React StrictMode double-invocation. This function handles it server-side:
-- SECURITY DEFINER bypasses RLS, ON CONFLICT DO NOTHING is a true no-op.
CREATE OR REPLACE FUNCTION ensure_bulletin_member(p_user_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bulletin_id uuid;
BEGIN
  SELECT id INTO v_bulletin_id FROM conversations WHERE type = 'bulletin' LIMIT 1;

  IF v_bulletin_id IS NULL THEN
    v_bulletin_id := gen_random_uuid();
    INSERT INTO conversations (id, type, name, created_by)
    VALUES (v_bulletin_id, 'bulletin', 'League Bulletin Board', p_user_id);
  END IF;

  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES (v_bulletin_id, p_user_id)
  ON CONFLICT DO NOTHING;
END;
$$;
