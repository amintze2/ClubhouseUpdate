"use client";

import { Badge, categoryLabel, visibilityLabel, periodLabel } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/tasks-utils";
import type { RecurringTask } from "@/lib/types";

interface TaskCardProps {
  task: RecurringTask;
  onToggleEnabled: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function TaskCard({ task, onToggleEnabled, onEdit, onDelete }: TaskCardProps) {
  return (
    <div className={`bg-white border rounded-xl p-4 flex flex-col gap-2 ${!task.is_enabled ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{task.title}</p>
          {task.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{task.description}</p>
          )}
        </div>

        {/* Enable/disable toggle */}
        <button
          onClick={onToggleEnabled}
          className={[
            "shrink-0 relative inline-flex h-5 w-9 rounded-full transition-colors focus:outline-none",
            task.is_enabled ? "bg-blue-600" : "bg-gray-200",
          ].join(" ")}
          aria-label={task.is_enabled ? "Disable" : "Enable"}
        >
          <span
            className={[
              "inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform mt-0.5",
              task.is_enabled ? "translate-x-4" : "translate-x-0.5",
            ].join(" ")}
          />
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 items-center">
        <Badge label={categoryLabel(task.category)} variant="category" />
        <Badge label={visibilityLabel(task.visibility)} variant="visibility" />
        {task.game_day_period && (
          <Badge label={periodLabel(task.game_day_period)} variant="period" />
        )}
        {task.default_time && (
          <span className="text-xs text-gray-400">{formatTime(task.default_time)}</span>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <Button variant="ghost" size="sm" onClick={onEdit}>Edit</Button>
        <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-500 hover:text-red-600 hover:bg-red-50">Delete</Button>
      </div>
    </div>
  );
}
