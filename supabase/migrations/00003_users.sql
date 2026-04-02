-- Created via the Slugger auth bootstrap flow.
-- slugger_user_id is the unique identifier from Slugger's payload.
CREATE TABLE users (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slugger_user_id text UNIQUE NOT NULL,
  user_name text,
  email text,
  role user_role NOT NULL,
  team_id bigint NOT NULL REFERENCES teams(id),
  has_completed_onboarding boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
