CREATE TABLE contacts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  team_id bigint NOT NULL REFERENCES teams(id),
  contact_name text NOT NULL,
  contact_role text NOT NULL,
  phone text,
  email text,
  notes text,
  display_order integer NOT NULL DEFAULT 0,
  created_by bigint REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_contacts_team ON contacts(team_id);
