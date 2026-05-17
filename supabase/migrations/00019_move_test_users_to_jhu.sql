-- Move all test users to the JHU team (id=22) so production clubhouse
-- managers signing in on real teams (Long Island Ducks, Lancaster Stormers,
-- etc.) don't see seeded dev data or earlier Test Team accounts.
--
-- Covers:
--   1. Seeded dev users (slugger_user_id LIKE 'dev-%') that were placed on
--      teams 1-4 by supabase/seed.sql.
--   2. JHU testers who landed on team_id=11 ("Test Team") via the auth
--      bootstrap fallback before team 22 (Johns Hopkins) existed.
UPDATE public.users
SET team_id = 22
WHERE slugger_user_id LIKE 'dev-%' OR team_id = 11;
