import { getOldClient, getNewClient, logSkipped, timer } from "./migrate-utils";

const ROLE_MAP: Record<string, string> = {
  clubhouse_manager: "clubhouse_manager",
  general_manager: "general_manager",
  player: "player",
  // Slugger role names that may appear in older data
  cm: "clubhouse_manager",
  gm: "general_manager",
};

export async function migrateUsers(): Promise<{ idMap: Map<number, number> }> {
  const old = getOldClient();
  const neo = getNewClient();
  const elapsed = timer();

  // Fetch new teams for team name → id lookup
  const { data: newTeams } = await neo.from("teams").select("id, team_name");
  const teamNameToId = new Map((newTeams ?? []).map((t: any) => [t.team_name, t.id]));

  // Fetch old teams for old team id → team name lookup
  const { data: oldTeams } = await old.from("teams").select("id, team_name");
  const oldTeamIdToName = new Map((oldTeams ?? []).map((t: any) => [t.id, t.team_name]));

  const { data: rows, error } = await old.from("users").select("*");
  if (error) throw new Error(`Failed to read old users: ${error.message}`);
  if (!rows || rows.length === 0) { console.log("  users: 0 rows"); return { idMap: new Map() }; }

  let migrated = 0;
  let skipped = 0;

  for (const r of rows as any[]) {
    const role = ROLE_MAP[r.user_role ?? r.role];
    if (!role) {
      logSkipped("users", r, `unrecognised role: "${r.user_role ?? r.role}"`);
      skipped++;
      continue;
    }

    const teamName = oldTeamIdToName.get(r.user_team ?? r.team_id);
    const teamId = teamName ? teamNameToId.get(teamName) : null;
    if (!teamId) {
      logSkipped("users", r, `cannot resolve team id for user_team=${r.user_team ?? r.team_id}`);
      skipped++;
      continue;
    }

    const { error: upsertErr } = await neo.from("users").upsert({
      slugger_user_id: r.slugger_user_id,
      user_name: r.user_name ?? r.username ?? null,
      email: r.email ?? null,
      role,
      team_id: teamId,
      has_completed_onboarding: r.has_completed_onboarding ?? true,
    }, { onConflict: "slugger_user_id" });

    if (upsertErr) throw new Error(`Failed to upsert user ${r.slugger_user_id}: ${upsertErr.message}`);
    migrated++;
  }

  // Build old id → new id map for downstream scripts
  const { data: newUsers } = await neo.from("users").select("id, slugger_user_id");
  const { data: oldUsers } = await old.from("users").select("id, slugger_user_id");
  const slugToNewId = new Map((newUsers ?? []).map((u: any) => [u.slugger_user_id, u.id]));
  const idMap = new Map<number, number>();
  for (const u of (oldUsers ?? []) as any[]) {
    const newId = slugToNewId.get(u.slugger_user_id);
    if (newId) idMap.set(u.id, newId);
  }

  console.log(`  users: ${migrated} migrated, ${skipped} skipped (${elapsed()})`);
  return { idMap };
}

if (require.main === module) {
  migrateUsers().catch((e) => { console.error(e.message); process.exit(1); });
}
