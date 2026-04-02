"use client";

import { assignTaskToSection, formatDate } from "@/lib/tasks-utils";
import { OneOffTaskRow, RecurringTaskRow } from "@/components/checklists/task-row";
import { TaskSection } from "@/components/checklists/task-section";
import { Button } from "@/components/ui/button";
import type { Task, RecurringTask, Game } from "@/lib/types";
import type { SectionItem } from "@/components/checklists/task-section";

interface DayDetailProps {
  date: string;
  tasks: Task[];
  recurringTasks: RecurringTask[];
  completions: Record<number, boolean>;
  game: Game | null;
  onToggleOneOff: (task: Task) => void;
  onDeleteOneOff: (task: Task) => void;
  onToggleRecurring: (task: RecurringTask) => void;
  onAddTask: () => void;
}

export function DayDetail({
  date, tasks, recurringTasks, completions, game,
  onToggleOneOff, onDeleteOneOff, onToggleRecurring, onAddTask,
}: DayDetailProps) {
  const isGameDay = game !== null;
  const gameTime = game?.game_time ?? null;

  const dayTasks = tasks.filter((t) => t.task_date === date);
  const applicableRecurring = recurringTasks.filter((rt) => {
    if (!rt.is_enabled) return false;
    if (rt.visibility === "game_day" && !isGameDay) return false;
    if (rt.visibility === "off_day" && isGameDay) return false;
    return true;
  });

  const totalCount = dayTasks.length + applicableRecurring.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">{formatDate(date)}</h2>
          {isGameDay && (
            <span className="text-xs text-green-600">Home Game</span>
          )}
        </div>
        <Button size="sm" variant="secondary" onClick={onAddTask}>+ Add Task</Button>
      </div>

      {totalCount === 0 && (
        <p className="text-sm text-gray-400 text-center py-6">No tasks this day</p>
      )}

      {totalCount > 0 && !isGameDay && (
        <div className="divide-y divide-gray-50 border border-gray-100 rounded-xl overflow-hidden">
          {dayTasks.map((t) => (
            <OneOffTaskRow
              key={`oo-${t.id}`}
              task={t}
              checked={t.is_complete}
              onToggle={() => onToggleOneOff(t)}
              onDelete={() => onDeleteOneOff(t)}
            />
          ))}
          {applicableRecurring.map((rt) => (
            <RecurringTaskRow
              key={`rt-${rt.id}`}
              task={rt}
              checked={completions[rt.id] ?? false}
              onToggle={() => onToggleRecurring(rt)}
            />
          ))}
        </div>
      )}

      {totalCount > 0 && isGameDay && (
        (["morning", "pre_game", "post_game"] as const).map((period) => {
          const items: SectionItem[] = [
            ...dayTasks.filter((t) => {
              if (t.game_day_period) return t.game_day_period === period;
              return assignTaskToSection(t.task_time, gameTime) === period;
            }).map((t) => ({ type: "oneoff" as const, task: t, checked: t.is_complete })),
            ...applicableRecurring.filter((rt) => (rt.game_day_period ?? "morning") === period)
              .map((rt) => ({ type: "recurring" as const, task: rt, checked: completions[rt.id] ?? false })),
          ];
          return (
            <TaskSection
              key={period}
              title={period === "morning" ? "Morning" : period === "pre_game" ? "Pre-Game" : "Post-Game"}
              items={items}
              onToggleOneOff={onToggleOneOff}
              onDeleteOneOff={onDeleteOneOff}
              onToggleRecurring={onToggleRecurring}
              defaultOpen
            />
          );
        })
      )}
    </div>
  );
}
