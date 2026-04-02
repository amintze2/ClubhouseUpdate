import type { IssueStatus } from "@/lib/types";

const CONFIG: Record<IssueStatus, { label: string; className: string }> = {
  new: { label: "New", className: "bg-gray-100 text-gray-600" },
  in_progress: { label: "In Progress", className: "bg-yellow-100 text-yellow-700" },
  resolved: { label: "Resolved", className: "bg-green-100 text-green-700" },
};

export function StatusBadge({ status }: { status: IssueStatus }) {
  const { label, className } = CONFIG[status];
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${className}`}>
      {label}
    </span>
  );
}
