import type { SupabaseClient } from "@supabase/supabase-js";
import type { Conversation, Message, User } from "@/lib/types";

export type ConversationWithMeta = Conversation & {
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  display_name: string;
  participant_names: string[];
};

export type MessageWithSender = Message & {
  sender_name: string | null;
};

// ── Conversations ─────────────────────────────────────────────────────────────

export async function getConversations(
  supabase: SupabaseClient,
  userId: number
): Promise<ConversationWithMeta[]> {
  // Get conversations user participates in, with last_read_at
  const { data: participations, error: pErr } = await supabase
    .from("conversation_participants")
    .select("conversation_id, last_read_at")
    .eq("user_id", userId);
  if (pErr) throw pErr;
  if (!participations || participations.length === 0) return [];

  const convIds = participations.map((p: any) => p.conversation_id);
  const lastReadMap: Record<string, string | null> = {};
  for (const p of participations as any[]) {
    lastReadMap[p.conversation_id] = p.last_read_at;
  }

  // Get conversations
  const { data: convs, error: cErr } = await supabase
    .from("conversations")
    .select("*")
    .in("id", convIds);
  if (cErr) throw cErr;

  // Get all participants with names for display
  const { data: allParticipants, error: apErr } = await supabase
    .from("conversation_participants")
    .select("conversation_id, user_id, users!conversation_participants_user_id_fkey(user_name)")
    .in("conversation_id", convIds);
  if (apErr) throw apErr;

  // Get last message per conversation
  const { data: lastMsgs, error: lmErr } = await supabase
    .from("messages")
    .select("conversation_id, content, created_at")
    .in("conversation_id", convIds)
    .order("created_at", { ascending: false });
  if (lmErr) throw lmErr;

  const lastMsgMap: Record<string, { content: string; created_at: string }> = {};
  for (const m of (lastMsgs ?? []) as any[]) {
    if (!lastMsgMap[m.conversation_id]) {
      lastMsgMap[m.conversation_id] = { content: m.content, created_at: m.created_at };
    }
  }

  // Get unread counts
  const unreadResults: Record<string, number> = {};
  await Promise.all(
    convIds.map(async (cid: string) => {
      const lastRead = lastReadMap[cid];
      let query = supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", cid)
        .neq("sender_id", userId);
      if (lastRead) {
        query = query.gt("created_at", lastRead);
      }
      const { count } = await query;
      unreadResults[cid] = count ?? 0;
    })
  );

  // Build participant name map
  const participantMap: Record<string, string[]> = {};
  for (const p of (allParticipants ?? []) as any[]) {
    if (!participantMap[p.conversation_id]) participantMap[p.conversation_id] = [];
    const name = p.users?.user_name ?? "Unknown";
    participantMap[p.conversation_id].push(name);
  }

  // Get own name for DM display
  const { data: selfData } = await supabase
    .from("users")
    .select("user_name")
    .eq("id", userId)
    .single();
  const selfName = (selfData as any)?.user_name ?? "";

  return ((convs ?? []) as any[])
    .map((c): ConversationWithMeta => {
      const names = participantMap[c.id] ?? [];
      let displayName = c.name;
      if (c.type === "direct") {
        displayName = names.find((n) => n !== selfName) ?? names[0] ?? "Direct Message";
      }
      const last = lastMsgMap[c.id];
      return {
        ...c,
        display_name: displayName ?? c.name ?? "Conversation",
        participant_names: names,
        last_message: last?.content ?? null,
        last_message_at: last?.created_at ?? c.created_at,
        unread_count: unreadResults[c.id] ?? 0,
      };
    })
    .sort((a, b) => {
      const aTime = a.last_message_at ?? a.created_at;
      const bTime = b.last_message_at ?? b.created_at;
      return bTime.localeCompare(aTime);
    });
}

export async function getMessages(
  supabase: SupabaseClient,
  conversationId: string
): Promise<MessageWithSender[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*, users!messages_sender_id_fkey(user_name)")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as any[]).map((m) => ({
    ...m,
    sender_name: m.users?.user_name ?? null,
  }));
}

export async function sendMessage(
  supabase: SupabaseClient,
  conversationId: string,
  senderId: number,
  content: string
): Promise<MessageWithSender> {
  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: senderId, content })
    .select("*, users!messages_sender_id_fkey(user_name)")
    .single();
  if (error) throw error;
  const row = data as any;
  return { ...row, sender_name: row.users?.user_name ?? null };
}

export async function markRead(
  supabase: SupabaseClient,
  conversationId: string,
  userId: number
): Promise<void> {
  const { error } = await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function createConversation(
  supabase: SupabaseClient,
  type: "direct" | "group",
  name: string | null,
  participantIds: number[],
  creatorId: number
): Promise<string> {
  // Generate UUID client-side to avoid .select() after insert.
  // If we used .select("id"), PostgREST would run RETURNING which checks the
  // SELECT policy — but we're not a participant yet, so it returns 403.
  const conversationId = crypto.randomUUID();

  const { error } = await supabase
    .from("conversations")
    .insert({ id: conversationId, type, name, created_by: creatorId });
  if (error) throw error;

  const allIds = Array.from(new Set([creatorId, ...participantIds]));
  await supabase
    .from("conversation_participants")
    .insert(allIds.map((uid) => ({ conversation_id: conversationId, user_id: uid })));

  return conversationId;
}

export async function ensureBulletinMembership(
  supabase: SupabaseClient,
  userId: number,
  _teamId: number
): Promise<void> {
  // Use a SECURITY DEFINER RPC to handle this atomically server-side.
  // Client-side approaches (check-then-insert, upsert) all suffer from RLS
  // timing issues and React StrictMode double-invocation causing 409s.
  // The function uses ON CONFLICT DO NOTHING — truly idempotent, no errors.
  const { error } = await supabase.rpc("ensure_bulletin_member", { p_user_id: userId });
  if (error) throw error;
}

// Real ALPB teams. Users on these teams can only message each other; test/JHU
// users (team_id outside 1-10) can message anyone, so testers can drive
// real-team flows end-to-end.
const REAL_TEAM_MIN = 1;
const REAL_TEAM_MAX = 10;

export async function getTeammates(
  supabase: SupabaseClient,
  teamId: number,
  excludeUserId: number
): Promise<Pick<User, "id" | "user_name" | "role">[]> {
  let query = supabase
    .from("users")
    .select("id, user_name, role")
    .neq("id", excludeUserId);

  if (teamId >= REAL_TEAM_MIN && teamId <= REAL_TEAM_MAX) {
    query = query.gte("team_id", REAL_TEAM_MIN).lte("team_id", REAL_TEAM_MAX);
  }

  const { data, error } = await query.order("user_name");
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function findExistingDirect(
  supabase: SupabaseClient,
  userId: number,
  otherUserId: number
): Promise<string | null> {
  const { data } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId);

  if (!data || data.length === 0) return null;
  const myConvIds = (data as any[]).map((p) => p.conversation_id);

  const { data: convs } = await supabase
    .from("conversations")
    .select("id")
    .in("id", myConvIds)
    .eq("type", "direct");

  if (!convs || convs.length === 0) return null;

  for (const c of convs as any[]) {
    const { data: participants } = await supabase
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", c.id);
    const ids = (participants ?? []).map((p: any) => p.user_id);
    if (ids.includes(otherUserId) && ids.length === 2) return c.id;
  }
  return null;
}
