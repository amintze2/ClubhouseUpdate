"use client";

import { useEffect, useRef } from "react";
import type { MessageWithSender } from "@/lib/api/messaging";
import type { ConversationWithMeta } from "@/lib/api/messaging";
import { MessageComposer } from "./message-composer";

interface ThreadViewProps {
  conversation: ConversationWithMeta;
  messages: MessageWithSender[];
  currentUserId: number;
  onSend: (content: string) => Promise<void>;
  onBack?: () => void;
}

function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatMessageDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

export function ThreadView({ conversation, messages, currentUserId, onSend, onBack }: ThreadViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Group messages by date
  const groups: { date: string; msgs: MessageWithSender[] }[] = [];
  for (const m of messages) {
    const date = formatMessageDate(m.created_at);
    const last = groups[groups.length - 1];
    if (last && last.date === date) {
      last.msgs.push(m);
    } else {
      groups.push({ date, msgs: [m] });
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-gray-700 text-sm mr-1"
            aria-label="Back"
          >
            ←
          </button>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{conversation.display_name}</p>
          {conversation.type === "group" && (
            <p className="text-xs text-gray-400 truncate">{conversation.participant_names.join(", ")}</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-1">
        {messages.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">No messages yet. Say hello!</p>
        )}
        {groups.map((group) => (
          <div key={group.date}>
            <div className="flex items-center gap-2 my-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400">{group.date}</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
            {group.msgs.map((m, i) => {
              const isOwn = m.sender_id === currentUserId;
              const prevMsg = group.msgs[i - 1];
              const showSender = !isOwn && m.sender_name && prevMsg?.sender_id !== m.sender_id;
              return (
                <div key={m.id} className={`flex flex-col mb-1 ${isOwn ? "items-end" : "items-start"}`}>
                  {showSender && (
                    <span className="text-xs text-gray-400 mb-0.5 ml-1">{m.sender_name}</span>
                  )}
                  <div className={`flex items-end gap-1.5 ${isOwn ? "flex-row-reverse" : ""}`}>
                    <div
                      className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                        isOwn
                          ? "bg-blue-600 text-white rounded-br-sm"
                          : "bg-gray-100 text-gray-900 rounded-bl-sm"
                      }`}
                    >
                      {m.content}
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{formatMessageTime(m.created_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <MessageComposer onSend={onSend} />
    </div>
  );
}
