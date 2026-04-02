import { getOldClient, getNewClient, chunkArray, timer } from "./migrate-utils";

export async function migrateMeals(userIdMap: Map<number, number>): Promise<void> {
  const old = getOldClient();
  const neo = getNewClient();
  const elapsed = timer();

  const { data: rows, error } = await old.from("meals").select("*");
  if (error) throw new Error(`Failed to read old meals: ${error.message}`);
  if (!rows || rows.length === 0) { console.log("  meals: 0 rows"); return; }

  // Fetch new games for game id remapping
  const { data: newGames } = await neo.from("games").select("id, home_team_id, away_team_id, game_date");
  const { data: oldGames } = await old.from("games").select("id, home_team_id, away_team_id, date, game_date");

  // Build old team id → new team id map
  const { data: oldTeams } = await old.from("teams").select("id, team_name");
  const { data: newTeams } = await neo.from("teams").select("id, team_name");
  const oldTeamIdToName = new Map((oldTeams ?? []).map((t: any) => [t.id, t.team_name]));
  const nameToNewTeamId = new Map((newTeams ?? []).map((t: any) => [t.team_name, t.id]));

  // Build old game id → new game id map via (home_team_name, away_team_name, date)
  const newGameKey = (homeId: number, awayId: number, date: string) => `${homeId}|${awayId}|${date}`;
  const newGameMap = new Map((newGames ?? []).map((g: any) => [newGameKey(g.home_team_id, g.away_team_id, g.game_date), g.id]));
  const oldGameIdToNewId = new Map<number, number>();
  for (const og of (oldGames ?? []) as any[]) {
    const homeName = oldTeamIdToName.get(og.home_team_id);
    const awayName = oldTeamIdToName.get(og.away_team_id);
    const newHomeId = homeName ? nameToNewTeamId.get(homeName) : null;
    const newAwayId = awayName ? nameToNewTeamId.get(awayName) : null;
    const date = og.date ?? og.game_date;
    if (newHomeId && newAwayId && date) {
      const newId = newGameMap.get(newGameKey(newHomeId, newAwayId, date));
      if (newId) oldGameIdToNewId.set(og.id, newId);
    }
  }

  await neo.from("meals").delete().neq("id", -1);

  const mapped = rows
    .map((r: any) => {
      const newGameId = r.game_id ? oldGameIdToNewId.get(r.game_id) : null;
      const newUserId = r.created_by ? userIdMap.get(r.created_by) : null;
      return {
        game_id: newGameId ?? r.game_id, // keep original if no mapping found
        pre_game_snack: r.pre_game_snack ?? null,
        post_game_meal: r.post_game_meal ?? null,
        notes: r.notes ?? null,
        created_by: newUserId ?? null,
      };
    });

  for (const chunk of chunkArray(mapped, 500)) {
    const { error: e } = await neo.from("meals").insert(chunk);
    if (e) throw new Error(`Failed to insert meals: ${e.message}`);
  }

  console.log(`  meals: ${mapped.length} migrated (${elapsed()})`);
}

if (require.main === module) {
  migrateMeals(new Map()).catch((e) => { console.error(e.message); process.exit(1); });
}
