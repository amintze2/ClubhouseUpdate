CREATE TABLE key_contacts (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_by  bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  role        text NOT NULL,
  phone       text,
  email       text,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE key_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "key_contacts_own_user"
  ON key_contacts FOR ALL TO authenticated
  USING (created_by = (auth.jwt() ->> 'sub')::bigint)
  WITH CHECK (created_by = (auth.jwt() ->> 'sub')::bigint);