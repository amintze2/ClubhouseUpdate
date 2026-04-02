import { getOldClient, getNewClient, logSkipped, chunkArray, timer } from "./migrate-utils";

export async function migratePlayerData(userIdMap: Map<number, number>): Promise<void> {
  const old = getOldClient();
  const neo = getNewClient();
  const elapsed = timer();

  // ── player_preferences ──────────────────────────────────────────────────────
  const { data: prefs, error: prefErr } = await old.from("player_preferences").select("*");
  if (prefErr) throw new Error(`Failed to read player_preferences: ${prefErr.message}`);

  await neo.from("player_preferences").delete().neq("user_id", -1);

  let prefCount = 0;
  let prefSkipped = 0;
  if (prefs && prefs.length > 0) {
    const mappedPrefs = (prefs as any[]).flatMap((r) => {
      const newUserId = userIdMap.get(r.user_id);
      if (!newUserId) { logSkipped("player_preferences", r, `user_id ${r.user_id} not in id map`); prefSkipped++; return []; }
      return [{ user_id: newUserId, preferred_name: r.preferred_name ?? null, other_details: r.other_details ?? null }];
    });
    for (const chunk of chunkArray(mappedPrefs, 500)) {
      const { error: e } = await neo.from("player_preferences").insert(chunk);
      if (e) throw new Error(`Failed to insert player_preferences: ${e.message}`);
    }
    prefCount = mappedPrefs.length;
  }

  // ── player_restrictions ─────────────────────────────────────────────────────
  const { data: restricts, error: restErr } = await old.from("player_restrictions").select("*");
  if (restErr) throw new Error(`Failed to read player_restrictions: ${restErr.message}`);

  await neo.from("player_restrictions").delete().neq("user_id", -1);

  let restCount = 0;
  let restSkipped = 0;
  if (restricts && restricts.length > 0) {
    const mappedRestricts = (restricts as any[]).flatMap((r) => {
      const newUserId = userIdMap.get(r.user_id);
      if (!newUserId) { logSkipped("player_restrictions", r, `user_id ${r.user_id} not in id map`); restSkipped++; return []; }
      return [{ user_id: newUserId, restriction: r.restriction }];
    });
    for (const chunk of chunkArray(mappedRestricts, 500)) {
      const { error: e } = await neo.from("player_restrictions").insert(chunk);
      if (e) throw new Error(`Failed to insert player_restrictions: ${e.message}`);
    }
    restCount = mappedRestricts.length;
  }

  console.log(`  player_preferences: ${prefCount} migrated, ${prefSkipped} skipped (${elapsed()})`);
  console.log(`  player_restrictions: ${restCount} migrated, ${restSkipped} skipped`);
}

if (require.main === module) {
  migratePlayerData(new Map()).catch((e) => { console.error(e.message); process.exit(1); });
}
