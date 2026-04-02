"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/toast";
import { createSupabaseClient } from "@/lib/supabase";
import {
  getTasksForDateRange, createTask, updateTask, deleteTask,
  getRecurringTasks, toggleRecurringCompletion, getCompletionsForDate,
  getGamesForDateRange,
} from "@/lib/api/tasks";
import { weekBounds, addDays, todayString } from "@/lib/tasks-utils";
import { WeekGrid } from "@/components/calendar/week-grid";
import { DayDetail } from "@/components/calendar/day-detail";
import { UpcomingTasksList } from "@/components/calendar/upcoming-tasks-list";
import { AddTaskDialog } from "@/components/checklists/add-task-dialog";
import type { Task, RecurringTask, Game, TaskCategory } from "@/lib/types";

export default function CalendarPage() {
  const { user, accessToken } = useAuth();
  const { showToast } = useToast();
  const today = todayString();

  const { start: initialWeekStart } = weekBounds(today);
  const [weekStart, setWeekStart] = useState(initialWeekStart);
  const [selectedDay, setSelectedDay] = useState(today);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);
  const [completions, setCompletions] = useState<Record<number, boolean>>({});
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const supabase = createSupabaseClient(accessToken ?? undefined);
  const weekEnd = addDays(weekStart, 6);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const rangeStart = addDays(weekStart, -7); // include prior week for upcoming list
    const rangeEnd = addDays(weekStart, 13);   // 2 weeks ahead
    Promise.all([
      getTasksForDateRange(supabase, user.id, rangeStart, rangeEnd),
      getRecurringTasks(supabase, user.id),
      getCompletionsForDate(supabase, user.id, selectedDay),
      getGamesForDateRange(supabase, user.team_id, rangeStart, rangeEnd),
    ])
      .then(([t, rt, comps, g]) => {
        setTasks(t);
        setRecurringTasks(rt);
        setCompletions(comps);
        setGames(g);
      })
      .catch(() => showToast("Failed to load calendar", "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, weekStart]);

  // Reload completions when selected day changes
  useEffect(() => {
    if (!user) return;
    getCompletionsForDate(supabase, user.id, selectedDay)
      .then(setCompletions)
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay]);

  async function handleToggleOneOff(task: Task) {
    const prev = tasks;
    setTasks((t) => t.map((x) => x.id === task.id ? { ...x, is_complete: !x.is_complete } : x));
    try { await updateTask(supabase, task.id, { is_complete: !task.is_complete }); }
    catch { setTasks(prev); showToast("Failed to save — try again", "error"); }
  }

  async function handleDeleteOneOff(task: Task) {
    const prev = tasks;
    setTasks((t) => t.filter((x) => x.id !== task.id));
    try { await deleteTask(supabase, task.id); }
    catch { setTasks(prev); showToast("Failed to delete — try again", "error"); }
  }

  async function handleToggleRecurring(task: RecurringTask) {
    const prev = completions[task.id] ?? false;
    setCompletions((c) => ({ ...c, [task.id]: !prev }));
    try { await toggleRecurringCompletion(supabase, task.id, selectedDay); }
    catch { setCompletions((c) => ({ ...c, [task.id]: prev })); showToast("Failed to save — try again", "error"); }
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
        task_date: selectedDay,
        task_time: data.task_time,
        category: data.category,
        visibility: "all",
        game_day_period: data.game_day_period,
        is_complete: false,
      });
      setTasks((t) => [...t, newTask]);
    } catch { showToast("Failed to add task — try again", "error"); }
  }

  function handleJumpToDate(date: string, ws: string) {
    setWeekStart(ws);
    setSelectedDay(date);
  }

  const selectedGame = games.find(
    (g) => g.home_team_id === user?.team_id && g.game_date === selectedDay
  ) ?? null;

  const upcomingTasks = tasks
    .filter((t) => t.task_date >= today)
    .sort((a, b) => a.task_date.localeCompare(b.task_date) || (a.task_time ?? "").localeCompare(b.task_time ?? ""));

  if (loading) return <div className="p-6 text-sm text-gray-400">Loading…</div>;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-lg font-semibold text-gray-900 mb-4">Task Calendar</h1>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Left: week grid */}
        <div className="md:w-72 shrink-0">
          <WeekGrid
            weekStart={weekStart}
            selectedDay={selectedDay}
            tasks={tasks}
            recurringTasks={recurringTasks}
            games={games}
            teamId={user!.team_id}
            onSelectDay={setSelectedDay}
            onPrevWeek={() => setWeekStart((ws) => addDays(ws, -7))}
            onNextWeek={() => setWeekStart((ws) => addDays(ws, 7))}
          />
        </div>

        {/* Right: day detail */}
        <div className="flex-1 min-w-0">
          <DayDetail
            date={selectedDay}
            tasks={tasks}
            recurringTasks={recurringTasks}
            completions={completions}
            game={selectedGame}
            onToggleOneOff={handleToggleOneOff}
            onDeleteOneOff={handleDeleteOneOff}
            onToggleRecurring={handleToggleRecurring}
            onAddTask={() => setAddOpen(true)}
          />
        </div>
      </div>

      {/* Upcoming tasks */}
      <div className="mt-6">
        <UpcomingTasksList tasks={upcomingTasks} onJumpToDate={handleJumpToDate} />
      </div>

      <AddTaskDialog open={addOpen} onClose={() => setAddOpen(false)} onSubmit={handleAddTask} defaultDate={selectedDay} isGameDay={!!selectedGame} />
    </div>
  );
}
