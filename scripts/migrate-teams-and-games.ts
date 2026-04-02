/**
 * Migrates teams and games from the old project to the new project.
 *
 * Strategy:
 * - Teams: match by name. Insert any that don't exist yet. Build old_id → new_id map.
 * - Games: clear all dev games, then insert all 1000 real games with remapped team IDs.
 *   Old schema: { id, home_team_id, away_team_id, date, time }
 *   New schema: { id, home_team_id, away_team_id, game_date, game_time, is_makeup }
 */

import { getOldClient, getNewClient, chunkArray, timer } from "./migrate-utils";

async function run() {
  const old = getOldClient();
  const neo = getNewClient();
  const elapsed = timer();

  // ── 1. Fetch old teams ────────────────────────────────────────────────────
  const { data: oldTeams, error: oldTeamsErr } = await old.from("teams").select("id, team_name");
  if (oldTeamsErr) throw new Error(`Failed to read old teams: ${oldTeamsErr.message}`);
  console.log(`  old teams: ${oldTeams!.length}`);

  // ── 2. Fetch new teams ────────────────────────────────────────────────────
  const { data: newTeams, error: newTeamsErr } = await neo.from("teams").select("id, team_name");
  if (newTeamsErr) throw new Error(`Failed to read new teams: ${newTeamsErr.message}`);
  console.log(`  new teams (before): ${newTeams!.length}`);

  // ── 3. Insert missing teams ───────────────────────────────────────────────
  const existingNames = new Set(newTeams!.map((t: any) => t.team_name));
  const toInsert = oldTeams!.filter((t: any) => !existingNames.has(t.team_name));

  if (toInsert.length > 0) {
    const { error: insertErr } = await neo
      .from("teams")
      .insert(toInsert.map((t: any) => ({ team_name: t.team_name })));
    if (insertErr) throw new Error(`Failed to insert missing teams: ${insertErr.message}`);
    console.log(`  inserted ${toInsert.length} new teams: ${toInsert.map((t: any) => t.team_name).join(", ")}`);
  } else {
    console.log("  no new teams to insert");
  }

  // ── 4. Re-fetch new teams to get all IDs ─────────────────────────────────
  const { data: allNewTeams, error: allNewErr } = await neo.from("teams").select("id, team_name");
  if (allNewErr) throw new Error(`Failed to re-read new teams: ${allNewErr.message}`);
  console.log(`  new teams (after): ${allNewTeams!.length}`);

  // Build name → new_id map
  const nameToNewId = new Map<string, number>(
    allNewTeams!.map((t: any) => [t.team_name as string, t.id as number])
  );

  // Build old_id → new_id map
  const oldIdToNewId = new Map<number, number>();
  for (const ot of oldTeams!) {
    const newId = nameToNewId.get(ot.team_name);
    if (!newId) throw new Error(`No new team found for old team: ${ot.team_name}`);
    oldIdToNewId.set(ot.id, newId);
  }

  console.log("  team ID mapping:");
  for (const [oldId, newId] of oldIdToNewId.entries()) {
    const name = oldTeams!.find((t: any) => t.id === oldId)?.team_name;
    console.log(`    old ${oldId} → new ${newId}  (${name})`);
  }

  // ── 5. Fetch all old games ────────────────────────────────────────────────
  const { data: oldGames, error: oldGamesErr } = await old
    .from("games")
    .select("id, home_team_id, away_team_id, date, time")
    .order("date");
  if (oldGamesErr) throw new Error(`Failed to read old games: ${oldGamesErr.message}`);
  console.log(`\n  old games: ${oldGames!.length}`);

  // ── 6. Clear meals (FK → games) then dev games ───────────────────────────
  const { error: mealDelErr } = await neo.from("meals").delete().neq("id", -1);
  if (mealDelErr) throw new Error(`Failed to clear meals: ${mealDelErr.message}`);
  const { error: delErr } = await neo.from("games").delete().neq("id", -1);
  if (delErr) throw new Error(`Failed to clear games: ${delErr.message}`);
  console.log("  cleared dev games from new project");

  // ── 7. Insert real games in chunks ───────────────────────────────────────
  const mapped = oldGames!.map((g: any) => {
    const homeId = oldIdToNewId.get(g.home_team_id);
    const awayId = oldIdToNewId.get(g.away_team_id);
    if (!homeId) throw new Error(`No mapping for home_team_id ${g.home_team_id}`);
    if (!awayId) throw new Error(`No mapping for away_team_id ${g.away_team_id}`);
    return {
      home_team_id: homeId,
      away_team_id: awayId,
      game_date: g.date,
      game_time: g.time ?? null,
      is_makeup: false,
    };
  });

  const chunks = chunkArray(mapped, 200);
  let inserted = 0;
  for (const chunk of chunks) {
    const { error: chunkErr } = await neo.from("games").insert(chunk);
    if (chunkErr) throw new Error(`Failed to insert games chunk: ${chunkErr.message}`);
    inserted += chunk.length;
    process.stdout.write(`  inserted ${inserted}/${mapped.length} games\r`);
  }
  console.log(`\n  games migration complete (${elapsed()})`);
}

run().catch((e) => { console.error(`❌  ${e.message}`); process.exit(1); });
