import { getOldClient, getNewClient, timer } from "./migrate-utils";

export async function migrateTeams(): Promise<void> {
  const old = getOldClient();
  const neo = getNewClient();
  const elapsed = timer();

  const { data: rows, error } = await old.from("teams").select("*");
  if (error) throw new Error(`Failed to read old teams: ${error.message}`);
  if (!rows || rows.length === 0) { console.log("  teams: 0 rows (nothing to migrate)"); return; }

  const { error: upsertErr } = await neo
    .from("teams")
    .upsert(rows.map((r: any) => ({ team_name: r.team_name })), { onConflict: "team_name" });
  if (upsertErr) throw new Error(`Failed to upsert teams: ${upsertErr.message}`);

  console.log(`  teams: ${rows.length} rows migrated (${elapsed()})`);
}

if (require.main === module) {
  migrateTeams().catch((e) => { console.error(e.message); process.exit(1); });
}
