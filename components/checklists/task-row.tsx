"use client";

import { Badge, categoryLabel } from "@/components/ui/badge";
import { formatTime } from "@/lib/tasks-utils";
import type { Task, RecurringTask } from "@/lib/types";

interface OneOffTaskRowProps {
  task: Task;
  checked: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

export function OneOffTaskRow({ task, checked, onToggle, onDelete }: OneOffTaskRowProps) {
  return (
    <div className={`flex items-start gap-3 py-2.5 px-3 rounded-lg group ${checked ? "opacity-60" : ""}`}>
      <button
        onClick={onToggle}
        className={[
          "mt-0.5 shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
          checked ? "bg-blue-600 border-blue-600" : "border-gray-300 hover:border-blue-400",
        ].join(" ")}
        aria-label={checked ? "Mark incomplete" : "Mark complete"}
      >
        {checked && <span className="text-white text-xs">✓</span>}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${checked ? "line-through text-gray-400" : "text-gray-800"}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <Badge label={categoryLabel(task.category)} variant="category" />
          {task.task_time && (
            <span className="text-xs text-gray-400">{formatTime(task.task_time)}</span>
          )}
        </div>
      </div>

      <button
        onClick={onDelete}
        className="shrink-0 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-lg leading-none mt-0.5"
        aria-label="Delete task"
      >
        ×
      </button>
    </div>
  );
}

interface RecurringTaskRowProps {
  task: RecurringTask;
  checked: boolean;
  onToggle: () => void;
}

export function RecurringTaskRow({ task, checked, onToggle }: RecurringTaskRowProps) {
  return (
    <div className={`flex items-start gap-3 py-2.5 px-3 rounded-lg ${checked ? "opacity-60" : ""}`}>
      <button
        onClick={onToggle}
        className={[
          "mt-0.5 shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
          checked ? "bg-blue-600 border-blue-600" : "border-gray-300 hover:border-blue-400",
        ].join(" ")}
        aria-label={checked ? "Mark incomplete" : "Mark complete"}
      >
        {checked && <span className="text-white text-xs">✓</span>}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${checked ? "line-through text-gray-400" : "text-gray-800"}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <Badge label={categoryLabel(task.category)} variant="category" />
          {task.default_time && (
            <span className="text-xs text-gray-400">{formatTime(task.default_time)}</span>
          )}
          <span className="text-xs text-gray-400" title="Recurring task">↻</span>
        </div>
      </div>
    </div>
  );
}
