-- Map Slugger platform team UUIDs onto our internal teams.id.
-- Slugger sends teamId as a UUID in the bootstrap token; we look up
-- the corresponding row via teams.slugger_team_id.

ALTER TABLE teams ADD COLUMN slugger_team_id uuid UNIQUE;

-- Backfill UUIDs onto existing rows by team_name.
-- Each UPDATE is a no-op if no row matches (idempotent across environments
-- where some teams may not yet exist).
UPDATE teams SET slugger_team_id = '62d3c576-60ba-4e9e-aca9-7bca378610d2' WHERE team_name = 'Long Island Ducks';
UPDATE teams SET slugger_team_id = '2c2aa5a2-dd73-451c-89ab-edb4c54cd522' WHERE team_name = 'Lancaster Stormers';
UPDATE teams SET slugger_team_id = 'd3d84718-299d-4973-b781-f35ac9c02007' WHERE team_name = 'York Revolution';
UPDATE teams SET slugger_team_id = 'a3f927e5-1a1a-4a4f-858e-1d6a292875aa' WHERE team_name = 'Southern Maryland Blue Crabs';
UPDATE teams SET slugger_team_id = '207f6237-59f0-41c9-9bc3-04f588aa8185' WHERE team_name = 'Gastonia Baseball Club';
UPDATE teams SET slugger_team_id = '486934a5-8ef5-4441-b55c-ab75be7e2fcf' WHERE team_name = 'Charleston Dirty Birds';
UPDATE teams SET slugger_team_id = '45bf18d4-df2a-472d-9e7c-11f05bc86fd8' WHERE team_name = 'Lexington Legends';
UPDATE teams SET slugger_team_id = '020c1b91-b8bf-4da8-8107-bc3915247b95' WHERE team_name = 'High Point Rockers';
UPDATE teams SET slugger_team_id = 'f012d5c6-15f9-4f5f-a047-27e254859816' WHERE team_name = 'Hagerstown Flying Boxcars';
UPDATE teams SET slugger_team_id = '10ad57e4-9ecf-4943-8b48-5d4a7d40fd18' WHERE team_name = 'Staten Island FerryHawks';
UPDATE teams SET slugger_team_id = '8986d5f1-a0e5-4a4d-ab58-58a1e9fc97ad' WHERE team_name = 'Johns Hopkins';
UPDATE teams SET slugger_team_id = '8e959434-d25b-4112-ab5e-e29e895f2626' WHERE team_name = 'ALPB Central Office';

-- Insert any teams that didn't already exist by name.
-- ON CONFLICT on slugger_team_id ensures repeat runs are safe.
INSERT INTO teams (team_name, slugger_team_id) VALUES
  ('Long Island Ducks',            '62d3c576-60ba-4e9e-aca9-7bca378610d2'),
  ('Lancaster Stormers',           '2c2aa5a2-dd73-451c-89ab-edb4c54cd522'),
  ('York Revolution',              'd3d84718-299d-4973-b781-f35ac9c02007'),
  ('Southern Maryland Blue Crabs', 'a3f927e5-1a1a-4a4f-858e-1d6a292875aa'),
  ('Gastonia Baseball Club',       '207f6237-59f0-41c9-9bc3-04f588aa8185'),
  ('Charleston Dirty Birds',       '486934a5-8ef5-4441-b55c-ab75be7e2fcf'),
  ('Lexington Legends',            '45bf18d4-df2a-472d-9e7c-11f05bc86fd8'),
  ('High Point Rockers',           '020c1b91-b8bf-4da8-8107-bc3915247b95'),
  ('Hagerstown Flying Boxcars',    'f012d5c6-15f9-4f5f-a047-27e254859816'),
  ('Staten Island FerryHawks',     '10ad57e4-9ecf-4943-8b48-5d4a7d40fd18'),
  ('Johns Hopkins',                '8986d5f1-a0e5-4a4d-ab58-58a1e9fc97ad'),
  ('ALPB Central Office',          '8e959434-d25b-4112-ab5e-e29e895f2626')
ON CONFLICT (slugger_team_id) DO NOTHING;
