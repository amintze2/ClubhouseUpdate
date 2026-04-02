import type { IssueWithPlayer } from "@/lib/api/issues";
import { StatusBadge } from "./status-badge";

interface IssueTableProps {
  issues: IssueWithPlayer[];
  selectedId: number | null;
  onSelect: (issue: IssueWithPlayer) => void;
  showFlagToggle?: boolean;
  onFlagToggle?: (issue: IssueWithPlayer) => void;
}

export function IssueTable({ issues, selectedId, onSelect, showFlagToggle, onFlagToggle }: IssueTableProps) {
  if (issues.length === 0) {
    return <p className="text-sm text-gray-400 py-6 text-center">No reports yet.</p>;
  }

  return (
    <div className="divide-y divide-gray-100">
      {issues.map((issue) => (
        <div
          key={issue.id}
          className={`flex items-start gap-3 hover:bg-gray-50 transition-colors ${
            selectedId === issue.id ? "bg-blue-50 border-l-2 border-blue-500" : ""
          }`}
        >
          <button
            onClick={() => onSelect(issue)}
            className="flex-1 min-w-0 text-left px-4 py-3"
          >
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-sm font-medium text-gray-800">
                {issue.player_name ?? "Unknown"}
              </span>
              <StatusBadge status={issue.status} />
              {issue.gm_flagged && (
                <span className="text-orange-500 text-xs" title="Flagged by GM">🚩</span>
              )}
              <span className="text-xs text-gray-400 ml-auto shrink-0">
                {new Date(issue.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-xs text-gray-500 truncate">{issue.description}</p>
          </button>
          {showFlagToggle && onFlagToggle && (
            <button
              onClick={() => onFlagToggle(issue)}
              className={`shrink-0 text-sm px-3 py-3 hover:bg-gray-100 ${issue.gm_flagged ? "text-orange-500" : "text-gray-300 hover:text-orange-400"}`}
              title={issue.gm_flagged ? "Unflag" : "Flag"}
            >
              🚩
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
