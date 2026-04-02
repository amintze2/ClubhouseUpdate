CREATE TABLE meals (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  game_id bigint NOT NULL REFERENCES games(id) UNIQUE,
  pre_game_snack text,
  post_game_meal text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Player dietary info split for normalization
CREATE TABLE player_preferences (
  player_id bigint PRIMARY KEY REFERENCES users(id),
  preferred_name text,
  other_details text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE player_restrictions (
  player_id bigint NOT NULL REFERENCES users(id),
  restriction text NOT NULL,
  is_custom boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, restriction)
);
