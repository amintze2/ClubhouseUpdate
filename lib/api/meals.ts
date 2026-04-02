import type { SupabaseClient } from "@supabase/supabase-js";
import type { Game, Meal, PlayerPreference } from "@/lib/types";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GameSeries {
  opponent: string;
  awayTeamId: number;
  games: Game[];
  meals: (Meal | null)[];
}

// ── Series + Meals ────────────────────────────────────────────────────────────

export async function getHomeGameSeries(
  supabase: SupabaseClient,
  teamId: number
): Promise<GameSeries[]> {
  const today = new Date().toISOString().slice(0, 10);
  // Fetch upcoming + recent home games (window: today to +90 days)
  const rangeEnd = new Date();
  rangeEnd.setDate(rangeEnd.getDate() + 90);
  const rangeEndStr = rangeEnd.toISOString().slice(0, 10);

  const { data: gamesData, error: gamesError } = await supabase
    .from("games")
    .select("*, teams!games_away_team_id_fkey(team_name)")
    .eq("home_team_id", teamId)
    .gte("game_date", today)
    .lte("game_date", rangeEndStr)
    .order("game_date", { ascending: true });

  if (gamesError) throw gamesError;
  if (!gamesData || gamesData.length === 0) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawGames = gamesData as any[];

  // Group into series: consecutive dates against the same opponent (2-day gap tolerance)
  const seriesGroups: { opponent: string; awayTeamId: number; games: Game[] }[] = [];
  let current: { opponent: string; awayTeamId: number; games: Game[] } | null = null;

  for (const g of rawGames) {
    const opponent: string = g.teams?.team_name ?? "Opponent";
    const game = g as Game;
    if (!current || current.awayTeamId !== g.away_team_id) {
      if (current) seriesGroups.push(current);
      current = { opponent, awayTeamId: g.away_team_id, games: [game] };
    } else {
      const lastDate = new Date(current.games[current.games.length - 1].game_date);
      const thisDate = new Date(game.game_date);
      const dayDiff = (thisDate.getTime() - lastDate.getTime()) / 86400000;
      if (dayDiff <= 2) {
        current.games.push(game);
      } else {
        seriesGroups.push(current);
        current = { opponent, awayTeamId: g.away_team_id, games: [game] };
      }
    }
  }
  if (current) seriesGroups.push(current);

  // Fetch all meals for these games
  const allGameIds = seriesGroups.flatMap((s) => s.games.map((g) => g.id));
  const { data: mealsData } = await supabase
    .from("meals")
    .select("*")
    .in("game_id", allGameIds);

  const mealsByGameId = new Map<number, Meal>();
  for (const m of mealsData ?? []) mealsByGameId.set(m.game_id, m as Meal);

  return seriesGroups.map((s) => ({
    opponent: s.opponent,
    awayTeamId: s.awayTeamId,
    games: s.games,
    meals: s.games.map((g) => mealsByGameId.get(g.id) ?? null),
  }));
}

export async function upsertMeals(
  supabase: SupabaseClient,
  rows: { game_id: number; pre_game_snack: string; post_game_meal: string }[]
): Promise<void> {
  const { error } = await supabase
    .from("meals")
    .upsert(rows, { onConflict: "game_id" });
  if (error) throw error;
}

// ── Dietary restrictions ──────────────────────────────────────────────────────

export interface PlayerDietaryInfo {
  player_name: string;
  restrictions: string[];
}

export async function getDietaryRestrictionsForTeams(
  supabase: SupabaseClient,
  teamIds: number[]
): Promise<PlayerDietaryInfo[]> {
  if (teamIds.length === 0) return [];

  // Fetch all players on the given teams
  const { data: playersData, error: playersError } = await supabase
    .from("users")
    .select("id, user_name, team_id")
    .in("team_id", teamIds)
    .eq("role", "player");

  if (playersError) throw playersError;
  if (!playersData || playersData.length === 0) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const players = playersData as any[];
  const playerIds = players.map((p: any) => p.id);
  const playerMap = new Map(players.map((p: any) => [p.id, p]));

  const { data: restData, error: restError } = await supabase
    .from("player_restrictions")
    .select("player_id, restriction")
    .in("player_id", playerIds);

  if (restError) throw restError;
  if (!restData || restData.length === 0) return [];

  // Group by player
  const byPlayer = new Map<number, { name: string; teamId: number; restrictions: string[] }>();
  for (const row of restData as any[]) {
    const player = playerMap.get(row.player_id);
    if (!player) continue;
    const existing = byPlayer.get(row.player_id);
    if (existing) {
      existing.restrictions.push(row.restriction);
    } else {
      byPlayer.set(row.player_id, {
        name: player.user_name ?? "Player",
        teamId: player.team_id,
        restrictions: [row.restriction],
      });
    }
  }

  return Array.from(byPlayer.values()).map((p) => ({
    player_name: p.name,
    restrictions: p.restrictions,
  }));
}

// ── Player profile ────────────────────────────────────────────────────────────

export async function getPlayerProfile(
  supabase: SupabaseClient,
  playerId: number
): Promise<{ preferences: PlayerPreference | null; restrictions: string[] }> {
  const [prefResult, restResult] = await Promise.all([
    supabase.from("player_preferences").select("*").eq("player_id", playerId).maybeSingle(),
    supabase.from("player_restrictions").select("restriction").eq("player_id", playerId),
  ]);

  if (prefResult.error) throw prefResult.error;
  if (restResult.error) throw restResult.error;

  return {
    preferences: prefResult.data as PlayerPreference | null,
    restrictions: (restResult.data ?? []).map((r: { restriction: string }) => r.restriction),
  };
}

export async function savePlayerProfile(
  supabase: SupabaseClient,
  playerId: number,
  data: { preferred_name: string | null; other_details: string | null; restrictions: string[] }
): Promise<void> {
  // Upsert preferences
  const { error: prefError } = await supabase
    .from("player_preferences")
    .upsert({ player_id: playerId, preferred_name: data.preferred_name, other_details: data.other_details, updated_at: new Date().toISOString() });
  if (prefError) throw prefError;

  // Replace all restrictions: delete then insert
  const { error: delError } = await supabase
    .from("player_restrictions")
    .delete()
    .eq("player_id", playerId);
  if (delError) throw delError;

  if (data.restrictions.length > 0) {
    // Determine which are custom (those not in the preset list)
    const PRESETS = new Set([
      "Vegetarian", "Vegan", "Gluten-Free", "Nut Allergy", "Dairy-Free",
      "Halal", "Kosher", "Shellfish Allergy", "Soy Allergy", "Egg Allergy", "Low Sodium",
    ]);
    const { error: insError } = await supabase
      .from("player_restrictions")
      .insert(data.restrictions.map((r) => ({
        player_id: playerId,
        restriction: r,
        is_custom: !PRESETS.has(r),
      })));
    if (insError) throw insError;
  }
}
