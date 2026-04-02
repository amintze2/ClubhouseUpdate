"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/toast";
import { createSupabaseClient } from "@/lib/supabase";
import {
  getIssues, getIssueComments, updateIssueFlag, addComment,
  type IssueWithPlayer, type IssueCommentWithAuthor,
} from "@/lib/api/issues";
import { IssueTable } from "./issue-table";
import { IssueDetailPanel } from "./issue-detail-panel";
import { Button } from "@/components/ui/button";

export function GMReportsView() {
  const { user, accessToken } = useAuth();
  const { showToast } = useToast();
  const supabase = createSupabaseClient(accessToken ?? undefined);

  const [issues, setIssues] = useState<IssueWithPlayer[]>([]);
  const [selected, setSelected] = useState<IssueWithPlayer | null>(null);
  const [comments, setComments] = useState<IssueCommentWithAuthor[]>([]);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!user) return;
    getIssues(supabase, user.team_id).then(setIssues).catch(() => {});
  }, [user?.team_id, accessToken]);

  async function selectIssue(issue: IssueWithPlayer) {
    // Unsubscribe from previous channel
    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    setSelected(issue);
    setCommentText("");
    try {
      const c = await getIssueComments(supabase, issue.id);
      setComments(c);
    } catch {
      setComments([]);
    }

    // Subscribe to new comments on this issue
    const channel = supabase
      .channel(`issue-comments-${issue.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "issue_comments",
          filter: `issue_id=eq.${issue.id}`,
        },
        (payload) => {
          const row = payload.new as any;
          setComments((prev) => {
            if (prev.some((c) => c.id === row.id)) return prev;
            return [...prev, { ...row, author_name: null }];
          });
        }
      )
      .subscribe();
    channelRef.current = channel;
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  async function handleFlagToggle(issue: IssueWithPlayer) {
    const prev = issues;
    const newFlag = !issue.gm_flagged;
    const updated = { ...issue, gm_flagged: newFlag };
    setIssues((arr) => arr.map((x) => (x.id === issue.id ? updated : x)));
    if (selected?.id === issue.id) setSelected(updated);
    try {
      await updateIssueFlag(supabase, issue.id, newFlag);
    } catch {
      setIssues(prev);
      if (selected?.id === issue.id) setSelected(issue);
      showToast("Failed to update flag", "error");
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

  const panelActions = selected ? (
    <>
      <div className="flex justify-end">
        <Button
          size="sm"
          variant={selected.gm_flagged ? "secondary" : "ghost"}
          onClick={() => handleFlagToggle(selected)}
        >
          🚩 {selected.gm_flagged ? "Unflag" : "Flag"}
        </Button>
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
        <div className="flex-1 overflow-y-auto">
          <IssueTable
            issues={issues}
            selectedId={selected?.id ?? null}
            onSelect={selectIssue}
            showFlagToggle
            onFlagToggle={handleFlagToggle}
          />
        </div>
      </div>

      {/* Right: detail */}
      <div className="flex-1 overflow-hidden">
        {selected ? (
          <IssueDetailPanel
            issue={selected}
            comments={comments}
            actions={panelActions}
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
