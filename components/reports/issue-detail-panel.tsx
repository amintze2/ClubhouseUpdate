import type { IssueWithPlayer, IssueCommentWithAuthor } from "@/lib/api/issues";
import { StatusBadge } from "./status-badge";

interface IssueDetailPanelProps {
  issue: IssueWithPlayer;
  comments: IssueCommentWithAuthor[];
  actions?: React.ReactNode;
}

export function IssueDetailPanel({ issue, comments, actions }: IssueDetailPanelProps) {
  const contextLabel =
    issue.team_context === "away"
      ? `Away${issue.away_team_name ? ` · ${issue.away_team_name}` : ""}`
      : "Home";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <StatusBadge status={issue.status} />
          {issue.gm_flagged && <span className="text-orange-500 text-xs">🚩 Flagged</span>}
        </div>
        <p className="text-sm text-gray-500 mb-1">
          <span className="font-medium text-gray-700">{issue.player_name ?? "Unknown"}</span>
          {" · "}
          {contextLabel}
          {" · "}
          {new Date(issue.created_at).toLocaleDateString()}
        </p>
        <p className="text-sm text-gray-800 leading-relaxed">{issue.description}</p>
      </div>

      {/* Comment thread */}
      <div className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-3">
        {comments.length === 0 && (
          <p className="text-xs text-gray-400">No comments yet.</p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="bg-gray-50 rounded-lg px-3 py-2">
            <p className="text-xs text-gray-500 mb-1">
              <span className="font-medium text-gray-700">{c.author_name ?? "Staff"}</span>
              {" · "}
              {new Date(c.created_at).toLocaleString()}
            </p>
            <p className="text-sm text-gray-800">{c.comment}</p>
          </div>
        ))}
      </div>

      {/* Action slot */}
      {actions && (
        <div className="px-5 py-3 border-t border-gray-100 flex flex-col gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}
