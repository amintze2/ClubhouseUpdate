import type { SupabaseClient } from "@supabase/supabase-js";
import type { Task, RecurringTask, RecurringTaskCompletion, Game, GameDayPeriod } from "@/lib/types";

// ── Types ────────────────────────────────────────────────────────────────────

export type NewTask = Omit<Task, "id" | "created_at">;
export type NewRecurringTask = Omit<RecurringTask, "id" | "created_at">;

export interface UpcomingGame {
  id: number;
  game_date: string;
  game_time: string | null;
  opponent_name: string;
}

// ── One-off tasks ────────────────────────────────────────────────────────────

export async function getTasksForDate(
  supabase: SupabaseClient,
  userId: number,
  date: string
): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("task_date", date)
    .order("task_time", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data ?? [];
}

export async function getTasksForDateRange(
  supabase: SupabaseClient,
  userId: number,
  startDate: string,
  endDate: string
): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .gte("task_date", startDate)
    .lte("task_date", endDate)
    .order("task_date", { ascending: true })
    .order("task_time", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data ?? [];
}

export async function createTask(
  supabase: SupabaseClient,
  task: NewTask
): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .insert(task)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTask(
  supabase: SupabaseClient,
  id: number,
  updates: Partial<Task>
): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTask(
  supabase: SupabaseClient,
  id: number
): Promise<void> {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}

// ── Recurring tasks ──────────────────────────────────────────────────────────

export async function getRecurringTasks(
  supabase: SupabaseClient,
  userId: number
): Promise<RecurringTask[]> {
  const { data, error } = await supabase
    .from("recurring_tasks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createRecurringTask(
  supabase: SupabaseClient,
  task: NewRecurringTask
): Promise<RecurringTask> {
  const { data, error } = await supabase
    .from("recurring_tasks")
    .insert(task)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateRecurringTask(
  supabase: SupabaseClient,
  id: number,
  updates: Partial<RecurringTask>
): Promise<RecurringTask> {
  const { data, error } = await supabase
    .from("recurring_tasks")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteRecurringTask(
  supabase: SupabaseClient,
  id: number
): Promise<void> {
  const { error } = await supabase.from("recurring_tasks").delete().eq("id", id);
  if (error) throw error;
}

export async function toggleRecurringTaskEnabled(
  supabase: SupabaseClient,
  id: number,
  enabled: boolean
): Promise<void> {
  const { error } = await supabase
    .from("recurring_tasks")
    .update({ is_enabled: enabled })
    .eq("id", id);
  if (error) throw error;
}

// ── Recurring task completions ────────────────────────────────────────────────

export async function toggleRecurringCompletion(
  supabase: SupabaseClient,
  recurringTaskId: number,
  date: string
): Promise<boolean> {
  // Fetch existing completion
  const { data: existing } = await supabase
    .from("recurring_task_completions")
    .select("is_complete")
    .eq("recurring_task_id", recurringTaskId)
    .eq("completion_date", date)
    .maybeSingle();

  const newValue = existing ? !existing.is_complete : true;

  const { error } = await supabase
    .from("recurring_task_completions")
    .upsert(
      {
        recurring_task_id: recurringTaskId,
        completion_date: date,
        is_complete: newValue,
        completed_at: newValue ? new Date().toISOString() : null,
      },
      { onConflict: "recurring_task_id,completion_date" }
    );
  if (error) throw error;
  return newValue;
}

export async function getCompletionsForDate(
  supabase: SupabaseClient,
  userId: number,
  date: string
): Promise<Record<number, boolean>> {
  // Join through recurring_tasks to scope by user
  const { data, error } = await supabase
    .from("recurring_task_completions")
    .select("recurring_task_id, is_complete, recurring_tasks!inner(user_id)")
    .eq("completion_date", date)
    .eq("recurring_tasks.user_id", userId);
  if (error) throw error;

  const result: Record<number, boolean> = {};
  for (const row of data ?? []) {
    result[row.recurring_task_id] = row.is_complete;
  }
  return result;
}

// ── Games ────────────────────────────────────────────────────────────────────

export async function getTodaysGame(
  supabase: SupabaseClient,
  teamId: number,
  date: string
): Promise<Game | null> {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("home_team_id", teamId)
    .eq("game_date", date)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getGamesForDateRange(
  supabase: SupabaseClient,
  teamId: number,
  startDate: string,
  endDate: string
): Promise<Game[]> {
  // Returns both home and away games for the team in the range
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
    .gte("game_date", startDate)
    .lte("game_date", endDate)
    .order("game_date", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getUpcomingHomeGames(
  supabase: SupabaseClient,
  teamId: number,
  limit = 3
): Promise<UpcomingGame[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("games")
    .select("id, game_date, game_time, teams!games_away_team_id_fkey(team_name)")
    .eq("home_team_id", teamId)
    .gte("game_date", today)
    .order("game_date", { ascending: true })
    .limit(limit);
  if (error) throw error;

  return (data ?? []).map((g: any) => ({
    id: g.id,
    game_date: g.game_date,
    game_time: g.game_time,
    opponent_name: g.teams?.team_name ?? "Opponent",
  }));
}
