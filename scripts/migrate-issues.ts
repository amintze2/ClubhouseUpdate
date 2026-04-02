import { getOldClient, getNewClient, logSkipped, chunkArray, timer } from "./migrate-utils";

export async function migrateIssues(userIdMap: Map<number, number>): Promise<void> {
  const old = getOldClient();
  const neo = getNewClient();
  const elapsed = timer();

  // Truncate in reverse FK order
  await neo.from("issue_comments").delete().neq("id", -1);
  await neo.from("issues").delete().neq("id", -1);

  // ── Issues ─────────────────────────────────────────────────────────────────
  const { data: issues, error: issueErr } = await old.from("issues").select("*");
  if (issueErr) throw new Error(`Failed to read issues: ${issueErr.message}`);

  const VALID_STATUSES = new Set(["new", "in_progress", "resolved"]);
  let issueSkipped = 0;
  const mappedIssues = (issues ?? []).flatMap((r: any) => {
    const newPlayerId = r.player_id ? userIdMap.get(r.player_id) : null;
    if (r.player_id && !newPlayerId) { logSkipped("issues", r, `player_id ${r.player_id} not in id map`); issueSkipped++; return []; }
    const newTeamId = r.team_id; // team ids may differ — carry over, FK check in validate script
    return [{
      id: r.id,
      team_id: newTeamId,
      player_id: newPlayerId ?? null,
      title: r.title,
      description: r.description ?? null,
      status: VALID_STATUSES.has(r.status) ? r.status : "new",
      is_flagged: r.is_flagged ?? false,
      routed_to: "clubhouse_manager",
      created_at: r.created_at,
    }];
  });

  for (const chunk of chunkArray(mappedIssues, 500)) {
    const { error: e } = await neo.from("issues").insert(chunk);
    if (e) throw new Error(`Failed to insert issues: ${e.message}`);
  }

  // ── Issue Comments ─────────────────────────────────────────────────────────
  const { data: comments, error: commentErr } = await old.from("issue_comments").select("*");
  if (commentErr) throw new Error(`Failed to read issue_comments: ${commentErr.message}`);

  // Old app never stored user_id — keep NULL for all migrated comments
  const mappedComments = (comments ?? []).map((r: any) => ({
    id: r.id,
    issue_id: r.issue_id,
    user_id: null, // historical comments have no author
    body: r.body ?? r.content ?? "",
    created_at: r.created_at,
  }));

  for (const chunk of chunkArray(mappedComments, 500)) {
    const { error: e } = await neo.from("issue_comments").insert(chunk);
    if (e) throw new Error(`Failed to insert issue_comments: ${e.message}`);
  }

  console.log(`  issues: ${mappedIssues.length} migrated, ${issueSkipped} skipped (${elapsed()})`);
  console.log(`  issue_comments: ${mappedComments.length} migrated (user_id=NULL for all historical comments)`);
}

if (require.main === module) {
  migrateIssues(new Map()).catch((e) => { console.error(e.message); process.exit(1); });
}
