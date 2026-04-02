-- Items are scoped to a team.
-- stock_status is the primary UI field; current_stock/par_level are for precise tracking.
-- When both numeric fields are set, stock_status is derived from them.
-- When only stock_status is set (quick-dropdown), numeric fields may not reflect exact counts.
CREATE TABLE inventory_items (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  team_id bigint NOT NULL REFERENCES teams(id),
  item_name text NOT NULL,
  category inventory_category NOT NULL,
  unit text,
  current_stock integer NOT NULL DEFAULT 0,
  par_level integer NOT NULL DEFAULT 0,
  stock_status stock_status NOT NULL DEFAULT 'stocked',
  price_per_unit numeric(10,2),
  purchase_link text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_inventory_team ON inventory_items(team_id);
