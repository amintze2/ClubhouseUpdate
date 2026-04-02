import { getOldClient, getNewClient, logSkipped, chunkArray, timer } from "./migrate-utils";

export async function migrateMessages(userIdMap: Map<number, number>): Promise<void> {
  const old = getOldClient();
  const neo = getNewClient();
  const elapsed = timer();

  // Truncate in reverse FK order
  await neo.from("messages").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await neo.from("conversation_participants").delete().neq("conversation_id", "00000000-0000-0000-0000-000000000000");
  await neo.from("conversations").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  // ── Conversations ──────────────────────────────────────────────────────────
  const { data: convs, error: convErr } = await old.from("conversations").select("*");
  if (convErr) throw new Error(`Failed to read conversations: ${convErr.message}`);

  const VALID_CONV_TYPES = new Set(["direct", "group", "bulletin"]);
  const mappedConvs = (convs ?? []).map((r: any) => ({
    id: r.id,
    type: VALID_CONV_TYPES.has(r.type) ? r.type : "group",
    name: r.name ?? null,
    created_by: r.created_by ? (userIdMap.get(r.created_by) ?? null) : null,
    created_at: r.created_at,
  }));

  for (const chunk of chunkArray(mappedConvs, 500)) {
    const { error: e } = await neo.from("conversations").insert(chunk);
    if (e) throw new Error(`Failed to insert conversations: ${e.message}`);
  }

  // ── Participants ───────────────────────────────────────────────────────────
  const { data: participants, error: partErr } = await old.from("conversation_participants").select("*");
  if (partErr) throw new Error(`Failed to read conversation_participants: ${partErr.message}`);

  let partSkipped = 0;
  const mappedParts = (participants ?? []).flatMap((r: any) => {
    const newUserId = userIdMap.get(r.user_id);
    if (!newUserId) { logSkipped("conversation_participants", r, `user_id ${r.user_id} not in id map`); partSkipped++; return []; }
    return [{ conversation_id: r.conversation_id, user_id: newUserId, last_read_at: r.last_read_at ?? null }];
  });

  for (const chunk of chunkArray(mappedParts, 500)) {
    const { error: e } = await neo.from("conversation_participants").insert(chunk);
    if (e) throw new Error(`Failed to insert conversation_participants: ${e.message}`);
  }

  // ── Messages ───────────────────────────────────────────────────────────────
  const { data: msgs, error: msgErr } = await old.from("messages").select("*");
  if (msgErr) throw new Error(`Failed to read messages: ${msgErr.message}`);

  let msgSkipped = 0;
  const mappedMsgs = (msgs ?? []).flatMap((r: any) => {
    const newSenderId = r.sender_id ? userIdMap.get(r.sender_id) : null;
    if (r.sender_id && !newSenderId) { logSkipped("messages", r, `sender_id ${r.sender_id} not in id map`); msgSkipped++; return []; }
    return [{
      id: r.id,
      conversation_id: r.conversation_id,
      sender_id: newSenderId ?? null,
      content: r.content,
      created_at: r.created_at,
    }];
  });

  for (const chunk of chunkArray(mappedMsgs, 500)) {
    const { error: e } = await neo.from("messages").insert(chunk);
    if (e) throw new Error(`Failed to insert messages: ${e.message}`);
  }

  console.log(`  conversations: ${mappedConvs.length} migrated (${elapsed()})`);
  console.log(`  conversation_participants: ${mappedParts.length} migrated, ${partSkipped} skipped`);
  console.log(`  messages: ${mappedMsgs.length} migrated, ${msgSkipped} skipped`);
}

if (require.main === module) {
  migrateMessages(new Map()).catch((e) => { console.error(e.message); process.exit(1); });
}
