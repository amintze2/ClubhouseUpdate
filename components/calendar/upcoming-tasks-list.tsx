"use client";

import { formatDate, formatTime } from "@/lib/tasks-utils";
import { Badge, categoryLabel } from "@/components/ui/badge";
import { weekBounds } from "@/lib/tasks-utils";
import type { Task } from "@/lib/types";

interface UpcomingTasksListProps {
  tasks: Task[];
  onJumpToDate: (date: string, weekStart: string) => void;
}

export function UpcomingTasksList({ tasks, onJumpToDate }: UpcomingTasksListProps) {
  if (tasks.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Upcoming Tasks</h3>
      <div className="flex flex-col divide-y divide-gray-50 border border-gray-100 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
        {tasks.map((task) => (
          <button
            key={task.id}
            onClick={() => onJumpToDate(task.task_date, weekBounds(task.task_date).start)}
            className="flex items-start gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="shrink-0 text-xs text-gray-400 w-16 pt-0.5">
              {formatDate(task.task_date)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800 truncate">{task.title}</p>
              <div className="flex gap-1.5 mt-0.5">
                <Badge label={categoryLabel(task.category)} variant="category" />
                {task.task_time && <span className="text-xs text-gray-400">{formatTime(task.task_time)}</span>}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
