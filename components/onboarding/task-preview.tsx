"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { GeneratedTask } from "@/lib/api/onboarding";

const PERIOD_LABEL: Record<string, string> = {
  morning: "Morning",
  pre_game: "Pre-Game",
  post_game: "Post-Game",
};

const CATEGORY_LABEL: Record<string, string> = {
  sanitation: "Sanitation",
  laundry: "Laundry",
  food: "Food",
  equipment: "Equipment",
  field: "Field",
  admin: "Admin",
  medical: "Medical",
  general: "General",
};

interface Props {
  tasks: GeneratedTask[];
  userId: number;
  teamId: number;
  mode: "replace" | "merge";
  onBack: () => void;
  onSuccess: () => void;
}

export function TaskPreview({ tasks, userId, teamId, mode, onBack, onSuccess }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const gameDayTasks = tasks.filter((t) => t.visibility === "game_day");
  const offDayTasks = tasks.filter((t) => t.visibility === "off_day");
  const allDayTasks = tasks.filter((t) => t.visibility === "all");

  const periodGroups = (list: GeneratedTask[]) => {
    const groups: Record<string, GeneratedTask[]> = { morning: [], pre_game: [], post_game: [] };
    for (const t of list) {
      if (t.game_day_period) groups[t.game_day_period].push(t);
    }
    return groups;
  };

  async function handleConfirm() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/onboarding/generate-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, team_id: teamId, tasks, mode }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Request failed");
      }
      onSuccess();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Setup failed — please try again", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center pt-12 px-4">
      <div className="w-full max-w-xl">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-100">
            <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">
              Review Your Schedule
            </p>
            <h2 className="text-lg font-semibold text-gray-900">
              Here&rsquo;s what I&rsquo;ll set up for you
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {tasks.length} tasks total — confirm to save, or go back to refine.
            </p>
          </div>

          {/* Task groups */}
          <div className="px-6 py-4 space-y-5 max-h-[60vh] overflow-y-auto">
            {/* Game Day */}
            {gameDayTasks.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Game Day ({gameDayTasks.length})
                </p>
                {Object.entries(periodGroups(gameDayTasks)).map(([period, list]) =>
                  list.length === 0 ? null : (
                    <div key={period} className="mb-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        {PERIOD_LABEL[period]}
                      </p>
                      <ul className="space-y-1">
                        {list.map((t, i) => (
                          <TaskRow key={i} task={t} />
                        ))}
                      </ul>
                    </div>
                  )
                )}
              </div>
            )}

            {/* Off Day */}
            {offDayTasks.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Off Day ({offDayTasks.length})
                </p>
                <ul className="space-y-1">
                  {offDayTasks.map((t, i) => (
                    <TaskRow key={i} task={t} />
                  ))}
                </ul>
              </div>
            )}

            {/* All Days */}
            {allDayTasks.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Every Day ({allDayTasks.length})
                </p>
                <ul className="space-y-1">
                  {allDayTasks.map((t, i) => (
                    <TaskRow key={i} task={t} />
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3">
            <Button variant="secondary" onClick={onBack} disabled={submitting} className="w-32">
              ← Refine
            </Button>
            <Button onClick={handleConfirm} disabled={submitting} className="flex-1">
              {submitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  Saving…
                </span>
              ) : (
                "Looks good — save my schedule"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskRow({ task }: { task: GeneratedTask }) {
  return (
    <li className="flex items-start gap-2 py-1">
      <span className="mt-0.5 inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500 shrink-0">
        {CATEGORY_LABEL[task.category] ?? task.category}
      </span>
      <div className="min-w-0">
        <span className="text-sm text-gray-800">{task.title}</span>
        {task.default_time && (
          <span className="ml-2 text-xs text-gray-400">{task.default_time}</span>
        )}
      </div>
    </li>
  );
}
