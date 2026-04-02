"use client";

import { addDays, formatDate, toDateString, todayString } from "@/lib/tasks-utils";
import type { Game, Task, RecurringTask } from "@/lib/types";

interface WeekGridProps {
  weekStart: string; // "YYYY-MM-DD" Sunday of the week
  selectedDay: string;
  tasks: Task[];
  recurringTasks: RecurringTask[];
  games: Game[];
  teamId: number;
  onSelectDay: (date: string) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function WeekGrid({
  weekStart, selectedDay, tasks, recurringTasks, games, teamId,
  onSelectDay, onPrevWeek, onNextWeek,
}: WeekGridProps) {
  const today = todayString();
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  function taskCountForDay(date: string): number {
    const oneoffs = tasks.filter((t) => t.task_date === date).length;
    const game = games.find((g) => g.home_team_id === teamId && g.game_date === date);
    const isGameDay = !!game;
    const recurring = recurringTasks.filter((rt) => {
      if (!rt.is_enabled) return false;
      if (rt.visibility === "game_day" && !isGameDay) return false;
      if (rt.visibility === "off_day" && isGameDay) return false;
      return true;
    }).length;
    return oneoffs + recurring;
  }

  function gameForDay(date: string): { type: "home" | "away" } | null {
    const home = games.find((g) => g.home_team_id === teamId && g.game_date === date);
    if (home) return { type: "home" };
    const away = games.find((g) => g.away_team_id === teamId && g.game_date === date);
    if (away) return { type: "away" };
    return null;
  }

  // Header: "Apr 1 – Apr 7, 2026"
  const [wy, wm, wd] = weekStart.split("-").map(Number);
  const weekEndDate = new Date(wy, wm - 1, wd + 6);
  const weekLabel = `${formatDate(weekStart)} – ${formatDate(toDateString(weekEndDate))}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={onPrevWeek} className="p-1.5 rounded hover:bg-gray-100 text-gray-500">‹</button>
        <span className="text-sm font-medium text-gray-700">{weekLabel}</span>
        <button onClick={onNextWeek} className="p-1.5 rounded hover:bg-gray-100 text-gray-500">›</button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DAY_LABELS.map((label) => (
          <div key={label} className="text-center text-xs text-gray-400 font-medium pb-1">{label}</div>
        ))}
        {days.map((date) => {
          const count = taskCountForDay(date);
          const game = gameForDay(date);
          const isToday = date === today;
          const isSelected = date === selectedDay;

          return (
            <button
              key={date}
              onClick={() => onSelectDay(date)}
              className={[
                "flex flex-col items-center justify-center rounded-lg py-2 min-h-[60px] transition-colors text-xs",
                isSelected ? "bg-blue-600 text-white" : isToday ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50 text-gray-700",
              ].join(" ")}
            >
              <span className="font-semibold text-sm">{parseInt(date.split("-")[2])}</span>
              {count > 0 && (
                <span className={`mt-0.5 text-xs ${isSelected ? "text-blue-200" : "text-gray-400"}`}>
                  {count}
                </span>
              )}
              {game && (
                <span className={[
                  "mt-0.5 text-[10px] px-1 rounded",
                  isSelected ? "bg-blue-500 text-blue-100" :
                    game.type === "home" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700",
                ].join(" ")}>
                  {game.type === "home" ? "H" : "A"}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
