"use client";

import { useState } from "react";

interface MessageComposerProps {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
}

export function MessageComposer({ onSend, disabled }: MessageComposerProps) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend() {
    const content = text.trim();
    if (!content || sending || disabled) return;
    setSending(true);
    setText("");
    try {
      await onSend(content);
    } catch {
      setText(content);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex gap-2 items-end px-4 py-3 border-t border-gray-100">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Message…"
        rows={1}
        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        style={{ maxHeight: "120px", overflowY: "auto" }}
        disabled={disabled || sending}
      />
      <button
        onClick={handleSend}
        disabled={!text.trim() || sending || disabled}
        className="shrink-0 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
      >
        Send
      </button>
    </div>
  );
}
