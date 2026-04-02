"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { User } from "@/lib/types";

type Teammate = Pick<User, "id" | "user_name" | "role">;

interface NewConversationDialogProps {
  open: boolean;
  onClose: () => void;
  teammates: Teammate[];
  onCreate: (type: "direct" | "group", name: string | null, participantIds: number[]) => Promise<void>;
}

export function NewConversationDialog({ open, onClose, teammates, onCreate }: NewConversationDialogProps) {
  const [type, setType] = useState<"direct" | "group">("direct");
  const [directTarget, setDirectTarget] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupMembers, setGroupMembers] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function reset() {
    setType("direct");
    setDirectTarget("");
    setGroupName("");
    setGroupMembers([]);
    setError("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  function toggleMember(id: number) {
    setGroupMembers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (type === "direct") {
      if (!directTarget) { setError("Select a teammate"); return; }
      setLoading(true);
      try {
        await onCreate("direct", null, [Number(directTarget)]);
        handleClose();
      } catch {
        setError("Failed to create conversation");
      } finally {
        setLoading(false);
      }
    } else {
      if (!groupName.trim()) { setError("Group name is required"); return; }
      if (groupMembers.length === 0) { setError("Select at least one member"); return; }
      setLoading(true);
      try {
        await onCreate("group", groupName.trim(), groupMembers);
        handleClose();
      } catch {
        setError("Failed to create conversation");
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} title="New Conversation">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Type toggle */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden w-fit">
          {(["direct", "group"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setType(t); setError(""); }}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                type === t ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {t === "direct" ? "Direct" : "Group"}
            </button>
          ))}
        </div>

        {type === "direct" ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teammate</label>
            <select
              value={directTarget}
              onChange={(e) => setDirectTarget(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">— Select —</option>
              {teammates.map((t) => (
                <option key={t.id} value={String(t.id)}>{t.user_name}</option>
              ))}
            </select>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Game Day Staff"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Members</label>
              <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                {teammates.map((t) => (
                  <label key={t.id} className="flex items-center gap-2 text-sm cursor-pointer px-1 py-0.5 rounded hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={groupMembers.includes(t.id)}
                      onChange={() => toggleMember(t.id)}
                      className="rounded"
                    />
                    {t.user_name}
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        {error && <p className="text-red-500 text-xs">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating…" : "Create"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
