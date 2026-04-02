"use client";

import { useState } from "react";
import { OneOffTaskRow, RecurringTaskRow } from "./task-row";
import type { Task, RecurringTask } from "@/lib/types";

export interface SectionItem {
  type: "oneoff" | "recurring";
  task: Task | RecurringTask;
  checked: boolean;
}

interface TaskSectionProps {
  title: string;
  items: SectionItem[];
  onToggleOneOff: (task: Task) => void;
  onDeleteOneOff: (task: Task) => void;
  onToggleRecurring: (task: RecurringTask) => void;
  defaultOpen?: boolean;
}

export function TaskSection({
  title,
  items,
  onToggleOneOff,
  onDeleteOneOff,
  onToggleRecurring,
  defaultOpen = true,
}: TaskSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const total = items.length;
  const done = items.filter((i) => i.checked).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden mb-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-700">{title}</span>
          <span className="text-xs text-gray-400">{done}/{total}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:block w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-gray-400 text-sm">{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {open && (
        <div className="divide-y divide-gray-50">
          {items.length === 0 && (
            <p className="px-4 py-3 text-sm text-gray-400 italic">No tasks</p>
          )}
          {items.map((item) =>
            item.type === "oneoff" ? (
              <OneOffTaskRow
                key={`oo-${(item.task as Task).id}`}
                task={item.task as Task}
                checked={item.checked}
                onToggle={() => onToggleOneOff(item.task as Task)}
                onDelete={() => onDeleteOneOff(item.task as Task)}
              />
            ) : (
              <RecurringTaskRow
                key={`rt-${(item.task as RecurringTask).id}`}
                task={item.task as RecurringTask}
                checked={item.checked}
                onToggle={() => onToggleRecurring(item.task as RecurringTask)}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}
