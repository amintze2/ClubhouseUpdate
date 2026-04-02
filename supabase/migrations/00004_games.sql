-- Imported from the league schedule export.
-- Series grouping is derived at runtime — see lib/series.ts.
-- is_makeup flags postponed/rescheduled games for display purposes.
CREATE TABLE games (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  home_team_id bigint NOT NULL REFERENCES teams(id),
  away_team_id bigint NOT NULL REFERENCES teams(id),
  game_date date NOT NULL,
  game_time time,
  is_makeup boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_games_home_team_date ON games(home_team_id, game_date);
CREATE INDEX idx_games_date ON games(game_date);
