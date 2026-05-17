-- Fake game schedule for the Johns Hopkins test account, played against
-- the "Test Team" sandbox team. Scoped to these two teams so no real ALPB
-- club ever sees a fake game on its calendar.
--
-- Idempotent: each row is gated by NOT EXISTS on (home, away, date), so
-- re-running this migration won't duplicate games. Resolves team IDs by
-- name so it doesn't depend on the order rows were inserted.

WITH
  jhu  AS (SELECT id FROM teams WHERE team_name = 'Johns Hopkins' LIMIT 1),
  test AS (SELECT id FROM teams WHERE team_name = 'Test Team'     LIMIT 1),
  schedule (home_team_id, away_team_id, game_date, game_time, is_makeup) AS (
    SELECT home, away, game_date, game_time::time, is_makeup
    FROM (
      VALUES
        -- JHU home series vs Test Team (6 games starting today)
        ((SELECT id FROM jhu),  (SELECT id FROM test), CURRENT_DATE,      '18:35', false),
        ((SELECT id FROM jhu),  (SELECT id FROM test), CURRENT_DATE + 1,  '18:35', false),
        ((SELECT id FROM jhu),  (SELECT id FROM test), CURRENT_DATE + 2,  '18:35', false),
        ((SELECT id FROM jhu),  (SELECT id FROM test), CURRENT_DATE + 3,  '18:35', false),
        ((SELECT id FROM jhu),  (SELECT id FROM test), CURRENT_DATE + 4,  '18:35', false),
        ((SELECT id FROM jhu),  (SELECT id FROM test), CURRENT_DATE + 5,  '13:05', false),

        -- JHU away series at Test Team (6 games the following week)
        ((SELECT id FROM test), (SELECT id FROM jhu),  CURRENT_DATE + 7,  '19:05', false),
        ((SELECT id FROM test), (SELECT id FROM jhu),  CURRENT_DATE + 8,  '19:05', false),
        ((SELECT id FROM test), (SELECT id FROM jhu),  CURRENT_DATE + 9,  '19:05', false),
        ((SELECT id FROM test), (SELECT id FROM jhu),  CURRENT_DATE + 10, '19:05', false),
        ((SELECT id FROM test), (SELECT id FROM jhu),  CURRENT_DATE + 11, '19:05', false),
        ((SELECT id FROM test), (SELECT id FROM jhu),  CURRENT_DATE + 12, '13:05', false),

        -- Prior home series for calendar context
        ((SELECT id FROM jhu),  (SELECT id FROM test), CURRENT_DATE - 7,  '18:35', false),
        ((SELECT id FROM jhu),  (SELECT id FROM test), CURRENT_DATE - 6,  '18:35', false),
        ((SELECT id FROM jhu),  (SELECT id FROM test), CURRENT_DATE - 5,  '18:35', false),
        ((SELECT id FROM jhu),  (SELECT id FROM test), CURRENT_DATE - 4,  '18:35', false),
        ((SELECT id FROM jhu),  (SELECT id FROM test), CURRENT_DATE - 3,  '18:35', false),
        ((SELECT id FROM jhu),  (SELECT id FROM test), CURRENT_DATE - 2,  '13:05', false)
    ) AS s(home, away, game_date, game_time, is_makeup)
  )
INSERT INTO games (home_team_id, away_team_id, game_date, game_time, is_makeup)
SELECT s.home_team_id, s.away_team_id, s.game_date, s.game_time, s.is_makeup
FROM schedule s
WHERE s.home_team_id IS NOT NULL
  AND s.away_team_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM games g
    WHERE g.home_team_id = s.home_team_id
      AND g.away_team_id = s.away_team_id
      AND g.game_date    = s.game_date
  );
