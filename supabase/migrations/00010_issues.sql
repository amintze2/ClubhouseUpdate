CREATE TABLE issues (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  player_id bigint NOT NULL REFERENCES users(id),
  player_team_id bigint NOT NULL REFERENCES teams(id),
  team_context text NOT NULL CHECK (team_context IN ('home', 'away')),
  away_team_name text,
  description text NOT NULL,
  status issue_status NOT NULL DEFAULT 'new',
  gm_flagged boolean NOT NULL DEFAULT false,

  -- Routing: always 'clubhouse_manager' for v1.
  -- Schema supports future field manager routing without changes.
  routed_to text NOT NULL DEFAULT 'clubhouse_manager',
  routed_by bigint REFERENCES users(id),
  routed_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_issues_team ON issues(player_team_id);

CREATE TABLE issue_comments (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  issue_id bigint NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  user_id bigint REFERENCES users(id),  -- nullable for migrated comments (old app didn't track author)
  comment text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_issue_comments_issue ON issue_comments(issue_id);
