import { getOldClient, getNewClient, timer, truncateTable } from "./migrate-utils";

export async function migrateTeams(): Promise<void> {
  const old = getOldClient();
  const neo = getNewClient();
  const elapsed = timer();

  const { data: rows, error } = await old.from("teams").select("*");
  if (error) throw new Error(`Failed to read old teams: ${error.message}`);
  if (!rows || rows.length === 0) { console.log("  teams: 0 rows (nothing to migrate)"); return; }

  // teams has no unique constraint on team_name — truncate then insert
  await truncateTable(neo, "teams");
  const { error: insertErr } = await neo
    .from("teams")
    .insert(rows.map((r: any) => ({ team_name: r.team_name })));
  if (insertErr) throw new Error(`Failed to insert teams: ${insertErr.message}`);

  console.log(`  teams: ${rows.length} rows migrated (${elapsed()})`);
}

if (require.main === module) {
  migrateTeams().catch((e) => { console.error(e.message); process.exit(1); });
}
