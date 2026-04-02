import { getOldClient, getNewClient, chunkArray, timer } from "./migrate-utils";

export async function migrateGames(): Promise<void> {
  const old = getOldClient();
  const neo = getNewClient();
  const elapsed = timer();

  const { data: rows, error } = await old.from("games").select("*");
  if (error) throw new Error(`Failed to read old games: ${error.message}`);
  if (!rows || rows.length === 0) { console.log("  games: 0 rows"); return; }

  // Fetch new teams for home/away id remapping (old ids may differ if teams were re-seeded)
  const { data: oldTeams } = await old.from("teams").select("id, team_name");
  const { data: newTeams } = await neo.from("teams").select("id, team_name");
  const oldIdToName = new Map((oldTeams ?? []).map((t: any) => [t.id, t.team_name]));
  const nameToNewId = new Map((newTeams ?? []).map((t: any) => [t.team_name, t.id]));

  const mapped = rows
    .map((r: any) => {
      const homeName = oldIdToName.get(r.home_team_id);
      const awayName = oldIdToName.get(r.away_team_id);
      const newHomeId = homeName ? nameToNewId.get(homeName) : null;
      const newAwayId = awayName ? nameToNewId.get(awayName) : null;
      if (!newHomeId || !newAwayId) return null;
      return {
        home_team_id: newHomeId,
        away_team_id: newAwayId,
        game_date: r.date ?? r.game_date,
        game_time: r.time ?? r.game_time ?? null,
        is_makeup: r.is_makeup ?? false,
      };
    })
    .filter(Boolean);

  for (const chunk of chunkArray(mapped as any[], 500)) {
    const { error: upsertErr } = await neo
      .from("games")
      .upsert(chunk, { onConflict: "home_team_id,away_team_id,game_date" });
    if (upsertErr) throw new Error(`Failed to upsert games: ${upsertErr.message}`);
  }

  console.log(`  games: ${mapped.length} migrated (${rows.length - mapped.length} skipped) (${elapsed()})`);
}

if (require.main === module) {
  migrateGames().catch((e) => { console.error(e.message); process.exit(1); });
}
