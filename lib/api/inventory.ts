import type { SupabaseClient } from "@supabase/supabase-js";
import type { InventoryItem, InventoryCategory, StockStatus } from "@/lib/types";

export type NewInventoryItem = Omit<InventoryItem, "id" | "created_at">;
export type UpdateInventoryItem = Partial<Omit<InventoryItem, "id" | "team_id" | "created_at">>;

// ── CRUD ─────────────────────────────────────────────────────────────────────

export async function getInventoryItems(
  supabase: SupabaseClient,
  teamId: number
): Promise<InventoryItem[]> {
  const { data, error } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("team_id", teamId)
    .order("item_name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createInventoryItem(
  supabase: SupabaseClient,
  item: NewInventoryItem
): Promise<InventoryItem> {
  const { data, error } = await supabase
    .from("inventory_items")
    .insert(item)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateInventoryItem(
  supabase: SupabaseClient,
  id: number,
  updates: UpdateInventoryItem
): Promise<InventoryItem> {
  const { data, error } = await supabase
    .from("inventory_items")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteInventoryItem(
  supabase: SupabaseClient,
  id: number
): Promise<void> {
  const { error } = await supabase
    .from("inventory_items")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// ── Quick status ──────────────────────────────────────────────────────────────

export async function updateInventoryStatus(
  supabase: SupabaseClient,
  id: number,
  status: StockStatus,
  parLevel: number
): Promise<InventoryItem> {
  const extraFields: Partial<InventoryItem> =
    status === "stocked" ? { current_stock: parLevel } :
    status === "out"     ? { current_stock: 0 } :
    {};
  const { data, error } = await supabase
    .from("inventory_items")
    .update({ stock_status: status, ...extraFields })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Bulk restock ──────────────────────────────────────────────────────────────

export async function bulkMarkRestocked(
  supabase: SupabaseClient,
  items: { id: number; par_level: number }[]
): Promise<void> {
  // Update each item individually — Supabase doesn't support bulk update with
  // per-row values in a single query without a stored procedure.
  await Promise.all(
    items.map(({ id, par_level }) =>
      supabase
        .from("inventory_items")
        .update({ stock_status: "stocked", current_stock: par_level })
        .eq("id", id)
    )
  );
}

// ── Series-end detection ──────────────────────────────────────────────────────

export function deriveStockStatus(currentStock: number, parLevel: number): StockStatus {
  if (currentStock === 0) return "out";
  if (currentStock < parLevel) return "low";
  return "stocked";
}

interface SeriesEndResult {
  opponentName: string;
  seriesEnd: string; // "YYYY-MM-DD"
}

export async function getSeriesEndedYesterday(
  supabase: SupabaseClient,
  teamId: number
): Promise<string | null> {
  // Fetch recent + upcoming home games to detect series boundaries
  const today = new Date();
  const rangeStart = new Date(today);
  rangeStart.setDate(today.getDate() - 10);
  const rangeEnd = new Date(today);
  rangeEnd.setDate(today.getDate() + 30);

  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("games")
    .select("game_date, away_team_id, teams!games_away_team_id_fkey(team_name)")
    .eq("home_team_id", teamId)
    .gte("game_date", fmt(rangeStart))
    .lte("game_date", fmt(rangeEnd))
    .order("game_date", { ascending: true });

  if (error || !data || data.length === 0) return null;

  // Group into series: consecutive dates against the same opponent
  const games = data as any[];

  const series: { opponentName: string; dates: string[] }[] = [];
  let current: { opponentId: number; opponentName: string; dates: string[] } | null = null;

  for (const game of games) {
    const opponentName = game.teams?.team_name ?? "Unknown";
    if (!current || current.opponentId !== game.away_team_id) {
      if (current) series.push({ opponentName: current.opponentName, dates: current.dates });
      current = { opponentId: game.away_team_id, opponentName, dates: [game.game_date] };
    } else {
      // Check consecutive (within 1 day gap allowed for makeup games)
      const lastDate = new Date(current.dates[current.dates.length - 1]);
      const thisDate = new Date(game.game_date);
      const dayDiff = (thisDate.getTime() - lastDate.getTime()) / 86400000;
      if (dayDiff <= 2) {
        current.dates.push(game.game_date);
      } else {
        series.push({ opponentName: current.opponentName, dates: current.dates });
        current = { opponentId: game.away_team_id, opponentName, dates: [game.game_date] };
      }
    }
  }
  if (current) series.push({ opponentName: current.opponentName, dates: current.dates });

  const todayStr = fmt(today);
  const yesterdayStr = fmt(new Date(today.getTime() - 86400000));

  for (const s of series) {
    const lastGame = s.dates[s.dates.length - 1];
    if (lastGame === yesterdayStr || lastGame === todayStr) {
      // Make sure there's no game today that continues this series
      if (lastGame === yesterdayStr || !s.dates.includes(todayStr)) {
        return s.opponentName;
      }
    }
  }

  return null;
}
