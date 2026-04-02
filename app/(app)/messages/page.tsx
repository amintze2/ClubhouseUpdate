"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/toast";
import { createSupabaseClient } from "@/lib/supabase";
import {
  getConversations, getMessages, sendMessage, markRead,
  createConversation, ensureBulletinMembership, getTeammates,
  findExistingDirect,
  type ConversationWithMeta, type MessageWithSender,
} from "@/lib/api/messaging";
import { ConversationList } from "@/components/messaging/conversation-list";
import { ThreadView } from "@/components/messaging/thread-view";
import { NewConversationDialog } from "@/components/messaging/new-conversation-dialog";
import type { User } from "@/lib/types";

type Teammate = Pick<User, "id" | "user_name" | "role">;

export default function MessagesPage() {
  const { user, accessToken } = useAuth();
  const { showToast } = useToast();
  const supabase = createSupabaseClient(accessToken ?? undefined);

  const [conversations, setConversations] = useState<ConversationWithMeta[]>([]);
  const [selected, setSelected] = useState<ConversationWithMeta | null>(null);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [teammates, setTeammates] = useState<Teammate[]>([]);
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "thread">("list");

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isCM = user?.role === "clubhouse_manager";

  useEffect(() => {
    if (!user) return;
    async function init() {
      if (isCM) {
        await ensureBulletinMembership(supabase, user!.id, user!.team_id).catch(() => {});
      }
      const [convs, mates] = await Promise.all([
        getConversations(supabase, user!.id),
        getTeammates(supabase, user!.team_id, user!.id),
      ]);
      setConversations(convs);
      setTeammates(mates);
    }
    init().catch(() => {});
  }, [user?.id, accessToken]);

  async function openConversation(conv: ConversationWithMeta) {
    // Unsubscribe from previous
    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    setSelected(conv);
    setMobileView("thread");

    // Load messages and mark read
    try {
      const [msgs] = await Promise.all([
        getMessages(supabase, conv.id),
        markRead(supabase, conv.id, user!.id),
      ]);
      setMessages(msgs);
      // Clear unread badge
      setConversations((prev) =>
        prev.map((c) => (c.id === conv.id ? { ...c, unread_count: 0 } : c))
      );
    } catch {
      setMessages([]);
    }

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages-${conv.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conv.id}`,
        },
        (payload) => {
          const m = payload.new as any;
          if (m.sender_id === user?.id) return; // already added optimistically
          setMessages((prev) => {
            if (prev.some((x) => x.id === m.id)) return prev;
            return [...prev, { ...m, sender_name: null }];
          });
          markRead(supabase, conv.id, user!.id).catch(() => {});
        }
      )
      .subscribe();
    channelRef.current = channel;
  }

  useEffect(() => {
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, []);

  async function handleSend(content: string) {
    if (!selected || !user) return;
    try {
      const msg = await sendMessage(supabase, selected.id, user.id, content);
      setMessages((prev) => [...prev, msg]);
      // Update preview in list
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selected.id
            ? { ...c, last_message: content, last_message_at: msg.created_at }
            : c
        ).sort((a, b) => (b.last_message_at ?? "").localeCompare(a.last_message_at ?? ""))
      );
    } catch {
      showToast("Failed to send message", "error");
    }
  }

  async function handleCreate(type: "direct" | "group", name: string | null, participantIds: number[]) {
    if (!user) return;

    // Check for existing DM
    if (type === "direct" && participantIds.length === 1) {
      const existing = await findExistingDirect(supabase, user.id, participantIds[0]);
      if (existing) {
        const conv = conversations.find((c) => c.id === existing);
        if (conv) { openConversation(conv); return; }
      }
    }

    const convId = await createConversation(supabase, type, name, participantIds, user.id);
    // Refresh conversations
    const convs = await getConversations(supabase, user.id);
    setConversations(convs);
    const newConv = convs.find((c) => c.id === convId);
    if (newConv) openConversation(newConv);
  }

  if (!user) return null;

  return (
    <div className="flex h-full">
      {/* Conversation list — hidden on mobile when thread is open */}
      <div className={`${mobileView === "thread" ? "hidden md:flex" : "flex"} w-full md:w-80 lg:w-96 border-r border-gray-100 flex-col shrink-0`}>
        <ConversationList
          conversations={conversations}
          selectedId={selected?.id ?? null}
          onSelect={openConversation}
          onNew={() => setNewDialogOpen(true)}
          showBulletin={isCM}
        />
      </div>

      {/* Thread — hidden on mobile when list is shown */}
      <div className={`${mobileView === "list" ? "hidden md:flex" : "flex"} flex-1 flex-col overflow-hidden`}>
        {selected ? (
          <ThreadView
            conversation={selected}
            messages={messages}
            currentUserId={user.id}
            onSend={handleSend}
            onBack={() => { setMobileView("list"); }}
          />
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center text-sm text-gray-400">
            Select a conversation to start messaging
          </div>
        )}
      </div>

      <NewConversationDialog
        open={newDialogOpen}
        onClose={() => setNewDialogOpen(false)}
        teammates={teammates}
        onCreate={handleCreate}
      />
    </div>
  );
}
