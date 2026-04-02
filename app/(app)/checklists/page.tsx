"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/toast";
import { createSupabaseClient } from "@/lib/supabase";
import {
  getTasksForDate, createTask, updateTask, deleteTask,
  getRecurringTasks, toggleRecurringCompletion, getCompletionsForDate,
  getTodaysGame, getUpcomingHomeGames,
} from "@/lib/api/tasks";
import { assignTaskToSection, todayString } from "@/lib/tasks-utils";
import { TaskSection } from "@/components/checklists/task-section";
import { OneOffTaskRow, RecurringTaskRow } from "@/components/checklists/task-row";
import { AddTaskDialog } from "@/components/checklists/add-task-dialog";
import { UpcomingGamesWidget } from "@/components/checklists/upcoming-games-widget";
import type { Task, RecurringTask, Game, TaskCategory } from "@/lib/types";
import type { UpcomingGame } from "@/lib/api/tasks";
import type { SectionItem } from "@/components/checklists/task-section";

export default function ChecklistsPage() {
  const { user, accessToken } = useAuth();
  const { showToast } = useToast();
  const today = todayString();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);
  const [completions, setCompletions] = useState<Record<number, boolean>>({});
  const [todayGame, setTodayGame] = useState<Game | null>(null);
  const [upcomingGames, setUpcomingGames] = useState<UpcomingGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const supabase = createSupabaseClient(accessToken ?? undefined);

  useEffect(() => {
    if (!user) return;
    async function load() {
      setLoading(true);
      try {
        const [t, rt, comps, game, upcoming] = await Promise.all([
          getTasksForDate(supabase, user!.id, today),
          getRecurringTasks(supabase, user!.id),
          getCompletionsForDate(supabase, user!.id, today),
          getTodaysGame(supabase, user!.team_id, today),
          getUpcomingHomeGames(supabase, user!.team_id, 6),
        ]);
        setTasks(t);
        setRecurringTasks(rt);
        setCompletions(comps);
        setTodayGame(game);
        setUpcomingGames(upcoming);
      } catch {
        showToast("Failed to load tasks", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleToggleOneOff(task: Task) {
    const prev = tasks;
    setTasks((t) => t.map((x) => x.id === task.id ? { ...x, is_complete: !x.is_complete } : x));
    try {
      await updateTask(supabase, task.id, { is_complete: !task.is_complete });
    } catch {
      setTasks(prev);
      showToast("Failed to save — try again", "error");
    }
  }

  async function handleDeleteOneOff(task: Task) {
    const prev = tasks;
    setTasks((t) => t.filter((x) => x.id !== task.id));
    try {
      await deleteTask(supabase, task.id);
    } catch {
      setTasks(prev);
      showToast("Failed to delete — try again", "error");
    }
  }

  async function handleToggleRecurring(task: RecurringTask) {
    const prevChecked = completions[task.id] ?? false;
    setCompletions((c) => ({ ...c, [task.id]: !prevChecked }));
    try {
      await toggleRecurringCompletion(supabase, task.id, today);
    } catch {
      setCompletions((c) => ({ ...c, [task.id]: prevChecked }));
      showToast("Failed to save — try again", "error");
    }
  }

  async function handleAddTask(data: {
    title: string; description: string | null; category: TaskCategory; task_time: string | null; game_day_period: import("@/lib/types").GameDayPeriod | null;
  }) {
    setAddOpen(false);
    try {
      const newTask = await createTask(supabase, {
        user_id: user!.id,
        title: data.title,
        description: data.description,
        task_date: today,
        task_time: data.task_time,
        category: data.category,
        visibility: "all",
        game_day_period: data.game_day_period,
        is_complete: false,
      });
      setTasks((t) => [...t, newTask]);
    } catch {
      showToast("Failed to add task — try again", "error");
    }
  }

  if (loading) {
    return <div className="p-6 text-sm text-gray-400">Loading…</div>;
  }

  const isGameDay = todayGame !== null;
  const gameTime = todayGame?.game_time ?? null;

  const applicableRecurring = recurringTasks.filter((rt) => {
    if (!rt.is_enabled) return false;
    if (rt.visibility === "game_day" && !isGameDay) return false;
    if (rt.visibility === "off_day" && isGameDay) return false;
    return true;
  });

  const allChecked = [
    ...tasks.map((t) => t.is_complete),
    ...applicableRecurring.map((rt) => completions[rt.id] ?? false),
  ];
  const totalCount = allChecked.length;
  const doneCount = allChecked.filter(Boolean).length;

  if (!isGameDay) {
    const flatItems: SectionItem[] = [
      ...tasks.map((t) => ({ type: "oneoff" as const, task: t, checked: t.is_complete })),
      ...applicableRecurring.map((rt) => ({ type: "recurring" as const, task: rt, checked: completions[rt.id] ?? false })),
    ].sort((a, b) => {
      const ta = (a.type === "oneoff" ? (a.task as Task).task_time : (a.task as RecurringTask).default_time) ?? "99:99";
      const tb = (b.type === "oneoff" ? (b.task as Task).task_time : (b.task as RecurringTask).default_time) ?? "99:99";
      return ta.localeCompare(tb);
    });

    return (
      <div className="p-4 max-w-2xl mx-auto">
        <UpcomingGamesWidget games={upcomingGames} />
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-semibold text-gray-900">Today&apos;s Tasks</h1>
          <span className="text-sm text-gray-400">{doneCount}/{totalCount}</span>
        </div>
        {totalCount > 0 && (
          <div className="w-full h-2 bg-gray-100 rounded-full mb-4">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${Math.round((doneCount / totalCount) * 100)}%` }} />
          </div>
        )}
        <div className="divide-y divide-gray-50 border border-gray-100 rounded-xl overflow-hidden">
          {flatItems.length === 0 && (
            <p className="px-4 py-6 text-sm text-gray-400 text-center">No tasks for today</p>
          )}
          {flatItems.map((item) =>
            item.type === "oneoff" ? (
              <OneOffTaskRow key={`oo-${(item.task as Task).id}`} task={item.task as Task} checked={item.checked} onToggle={() => handleToggleOneOff(item.task as Task)} onDelete={() => handleDeleteOneOff(item.task as Task)} />
            ) : (
              <RecurringTaskRow key={`rt-${(item.task as RecurringTask).id}`} task={item.task as RecurringTask} checked={item.checked} onToggle={() => handleToggleRecurring(item.task as RecurringTask)} />
            )
          )}
        </div>
        <button onClick={() => setAddOpen(true)} className="fixed bottom-20 md:bottom-6 right-4 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg text-2xl flex items-center justify-center hover:bg-blue-700 transition-colors" aria-label="Add task">+</button>
        <AddTaskDialog open={addOpen} onClose={() => setAddOpen(false)} onSubmit={handleAddTask} isGameDay={isGameDay} />
      </div>
    );
  }

  // Game day — three sections
  // Recurring tasks with no game_day_period default to Morning on game days
  const buildSection = (period: "morning" | "pre_game" | "post_game"): SectionItem[] => [
    ...tasks.filter((t) => {
      if (t.game_day_period) return t.game_day_period === period;
      return assignTaskToSection(t.task_time, gameTime) === period;
    }).map((t) => ({ type: "oneoff" as const, task: t, checked: t.is_complete })),
    ...applicableRecurring.filter((rt) => (rt.game_day_period ?? "morning") === period)
      .map((rt) => ({ type: "recurring" as const, task: rt, checked: completions[rt.id] ?? false })),
  ];

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <UpcomingGamesWidget games={upcomingGames} />
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-lg font-semibold text-gray-900">Game Day Checklist</h1>
        <span className="text-xs bg-green-50 text-green-700 border border-green-100 rounded-full px-2 py-0.5">Home Game</span>
      </div>
      <p className="text-sm text-gray-400 mb-4">{doneCount}/{totalCount} complete</p>

      {(["morning", "pre_game", "post_game"] as const).map((period) => (
        <TaskSection
          key={period}
          title={period === "morning" ? "Morning" : period === "pre_game" ? "Pre-Game" : "Post-Game"}
          items={buildSection(period)}
          onToggleOneOff={handleToggleOneOff}
          onDeleteOneOff={handleDeleteOneOff}
          onToggleRecurring={handleToggleRecurring}
          defaultOpen={period === "morning"}
        />
      ))}

      <button onClick={() => setAddOpen(true)} className="fixed bottom-20 md:bottom-6 right-4 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg text-2xl flex items-center justify-center hover:bg-blue-700 transition-colors" aria-label="Add task">+</button>
      <AddTaskDialog open={addOpen} onClose={() => setAddOpen(false)} onSubmit={handleAddTask} isGameDay />
    </div>
  );
}
