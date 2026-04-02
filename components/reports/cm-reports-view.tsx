"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/toast";
import { createSupabaseClient } from "@/lib/supabase";
import {
  getIssues, getIssueComments, updateIssueStatus, addComment,
  type IssueWithPlayer, type IssueCommentWithAuthor,
} from "@/lib/api/issues";
import { IssueTable } from "./issue-table";
import { IssueDetailPanel } from "./issue-detail-panel";
import { StatusBadge } from "./status-badge";
import { Button } from "@/components/ui/button";
import type { IssueStatus } from "@/lib/types";

type Filter = "all" | IssueStatus;
const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
];

export function CMReportsView() {
  const { user, accessToken } = useAuth();
  const { showToast } = useToast();
  const supabase = createSupabaseClient(accessToken ?? undefined);

  const [issues, setIssues] = useState<IssueWithPlayer[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<IssueWithPlayer | null>(null);
  const [comments, setComments] = useState<IssueCommentWithAuthor[]>([]);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    getIssues(supabase, user.team_id).then(setIssues).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.team_id, accessToken]);

  async function selectIssue(issue: IssueWithPlayer) {
    setSelected(issue);
    setCommentText("");
    try {
      const c = await getIssueComments(supabase, issue.id);
      setComments(c);
    } catch {
      setComments([]);
    }
  }

  async function handleStatusChange(status: IssueStatus) {
    if (!selected) return;
    const prev = issues;
    const updated = { ...selected, status };
    setSelected(updated);
    setIssues((arr) => arr.map((x) => (x.id === selected.id ? updated : x)));
    try {
      await updateIssueStatus(supabase, selected.id, status);
    } catch {
      setIssues(prev);
      setSelected(selected);
      showToast("Failed to update status", "error");
    }
  }

  async function handleAddComment() {
    if (!selected || !user || !commentText.trim()) return;
    setSubmitting(true);
    const text = commentText.trim();
    setCommentText("");
    try {
      const comment = await addComment(supabase, selected.id, user.id, text);
      setComments((c) => [...c, comment]);
    } catch {
      setCommentText(text);
      showToast("Failed to add comment", "error");
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = filter === "all" ? issues : issues.filter((i) => i.status === filter);

  const statusActions = selected ? (
    <>
      <div className="flex gap-2 flex-wrap">
        {selected.status === "new" && (
          <Button size="sm" onClick={() => handleStatusChange("in_progress")}>Mark In Progress</Button>
        )}
        {selected.status === "in_progress" && (
          <Button size="sm" onClick={() => handleStatusChange("resolved")}>Mark Resolved</Button>
        )}
        {selected.status === "resolved" && (
          <Button size="sm" variant="secondary" onClick={() => handleStatusChange("new")}>Reopen</Button>
        )}
      </div>
      <div className="flex gap-2">
        <textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Add a comment…"
          rows={2}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <Button
          size="sm"
          onClick={handleAddComment}
          disabled={!commentText.trim() || submitting}
          className="self-end"
        >
          Post
        </Button>
      </div>
    </>
  ) : null;

  return (
    <div className="flex h-full">
      {/* Left: list */}
      <div className="w-full md:w-80 lg:w-96 border-r border-gray-100 flex flex-col shrink-0">
        {/* Filter tabs */}
        <div className="flex gap-1 px-3 py-2 border-b border-gray-100 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors ${
                filter === f.value
                  ? "bg-blue-600 text-white"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {f.label}
              {f.value !== "all" && (
                <span className="ml-1 opacity-70">
                  ({issues.filter((i) => i.status === f.value).length})
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          <IssueTable
            issues={filtered}
            selectedId={selected?.id ?? null}
            onSelect={selectIssue}
          />
        </div>
      </div>

      {/* Right: detail */}
      <div className="flex-1 overflow-hidden">
        {selected ? (
          <IssueDetailPanel
            issue={selected}
            comments={comments}
            actions={statusActions}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-gray-400">
            Select a report to view details
          </div>
        )}
      </div>
    </div>
  );
}
