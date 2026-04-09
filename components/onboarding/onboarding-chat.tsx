"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls, type UIMessage } from "ai";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { TaskPreview } from "@/components/onboarding/task-preview";
import type { GeneratedTask } from "@/lib/api/onboarding";

interface Props {
  mode: "replace" | "merge";
}

export function OnboardingChat({ mode }: Props) {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const [input, setInput] = useState("");
  const [pendingTasks, setPendingTasks] = useState<GeneratedTask[] | null>(null);
  const [pendingToolCallId, setPendingToolCallId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, addToolOutput, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/onboarding/chat" }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    messages: [
      {
        id: "opening",
        role: "assistant",
        parts: [
          {
            type: "text",
            text: "Let's build your task schedule. Walk me through a typical game day — from when you arrive to when you leave, what do you do?",
          },
        ],
      },
    ] as UIMessage[],
  });

  // Scroll to bottom as messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Detect finalize_setup tool call
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== "assistant") return;
    for (const part of lastMsg.parts) {
      if (
        part.type === "tool-finalize_setup" &&
        (part.state === "input-available" || part.state === "output-available")
      ) {
        if (part.state === "input-available" && !pendingTasks) {
          const input = part.input as { recurring_tasks: GeneratedTask[] };
          setPendingTasks(input.recurring_tasks);
          setPendingToolCallId(part.toolCallId);
        }
        break;
      }
    }
  }, [messages, pendingTasks]);

  function handleBack() {
    if (pendingToolCallId) {
      addToolOutput({
        tool: "finalize_setup",
        toolCallId: pendingToolCallId,
        output: { confirmed: false, message: "User wants to refine the schedule." },
      });
    }
    setPendingTasks(null);
    setPendingToolCallId(null);
  }

  function handleSuccess() {
    updateUser({ has_completed_onboarding: true });
    router.replace("/recurring-tasks");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || status === "streaming") return;
    sendMessage({ text });
    setInput("");
  }

  const isStreaming = status === "streaming";

  // Show preview when AI has called finalize_setup
  if (pendingTasks) {
    return (
      <TaskPreview
        tasks={pendingTasks}
        userId={user!.id}
        teamId={user!.team_id}
        mode={mode}
        onBack={handleBack}
        onSuccess={handleSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-bold">AI</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">Clubhouse Setup</p>
          <p className="text-xs text-gray-400">Building your recurring task schedule</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-2xl w-full mx-auto">
        {messages.length === 0 && (
          <div className="text-center text-sm text-gray-400 mt-12">
            Starting your setup…
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            {message.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                <span className="text-white text-[10px] font-bold">AI</span>
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                message.role === "user"
                  ? "bg-blue-600 text-white rounded-br-sm"
                  : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm"
              }`}
            >
              {message.parts.map((part, i) => {
                if (part.type === "text") {
                  return <span key={i} style={{ whiteSpace: "pre-wrap" }}>{part.text}</span>;
                }
                if (part.type === "tool-finalize_setup") {
                  return (
                    <span key={i} className="text-xs text-gray-400 italic">
                      Generating your schedule…
                    </span>
                  );
                }
                return null;
              })}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isStreaming && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mr-2 mt-0.5">
              <span className="text-white text-[10px] font-bold">AI</span>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm shadow-sm px-4 py-3">
              <div className="flex gap-1 items-center h-4">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your routine…"
            disabled={isStreaming}
            className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="rounded-full bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
