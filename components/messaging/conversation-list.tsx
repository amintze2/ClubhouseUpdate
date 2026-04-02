"use client";

import { useState } from "react";
import type { ConversationWithMeta } from "@/lib/api/messaging";

type Tab = "direct" | "group" | "bulletin";

interface ConversationListProps {
  conversations: ConversationWithMeta[];
  selectedId: string | null;
  onSelect: (conv: ConversationWithMeta) => void;
  onNew: () => void;
  showBulletin: boolean;
}

function formatTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function ConversationList({ conversations, selectedId, onSelect, onNew, showBulletin }: ConversationListProps) {
  const [tab, setTab] = useState<Tab>("direct");

  const tabs: { value: Tab; label: string }[] = [
    { value: "direct", label: "Direct" },
    { value: "group", label: "Groups" },
    ...(showBulletin ? [{ value: "bulletin" as Tab, label: "Bulletin" }] : []),
  ];

  const filtered = conversations.filter((c) => c.type === tab);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Messages</h2>
        <button
          onClick={onNew}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50"
        >
          + New
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-3 pb-2 border-b border-gray-100">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              tab === t.value ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
        {filtered.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">No conversations yet.</p>
        )}
        {filtered.map((conv) => (
          <button
            key={conv.id}
            onClick={() => onSelect(conv)}
            className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors ${
              selectedId === conv.id ? "bg-blue-50 border-l-2 border-blue-500" : ""
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className={`text-sm truncate ${conv.unread_count > 0 ? "font-semibold text-gray-900" : "font-medium text-gray-800"}`}>
                  {conv.display_name}
                </span>
                <span className="text-xs text-gray-400 shrink-0 ml-2">
                  {formatTime(conv.last_message_at)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 truncate flex-1">
                  {conv.last_message ?? "No messages yet"}
                </p>
                {conv.unread_count > 0 && (
                  <span className="ml-2 shrink-0 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {conv.unread_count > 9 ? "9+" : conv.unread_count}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
