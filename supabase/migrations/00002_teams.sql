-- Pre-populated from league data. Rows are reference data, not user-managed.
CREATE TABLE teams (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  team_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
