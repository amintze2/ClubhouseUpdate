"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/toast";
import { createSupabaseClient } from "@/lib/supabase";
import {
  getRecurringTasks, createRecurringTask, updateRecurringTask,
  deleteRecurringTask, toggleRecurringTaskEnabled,
} from "@/lib/api/tasks";
import { TaskCard } from "@/components/recurring-tasks/task-card";
import { TaskFormDialog } from "@/components/recurring-tasks/task-form-dialog";
import { DeleteConfirmDialog } from "@/components/recurring-tasks/delete-confirm-dialog";
import { Button } from "@/components/ui/button";
import type { RecurringTask, TaskVisibility, GameDayPeriod } from "@/lib/types";

type RerunStep = "mode_select" | "confirm_replace" | null;

export default function RecurringTasksPage() {
  const { user, accessToken } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const supabase = createSupabaseClient(accessToken ?? undefined);

  const [tasks, setTasks] = useState<RecurringTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<RecurringTask | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecurringTask | null>(null);
  const [rerunStep, setRerunStep] = useState<RerunStep>(null);

  useEffect(() => {
    if (!user) return;
    getRecurringTasks(supabase, user.id)
      .then(setTasks)
      .catch(() => showToast("Failed to load tasks", "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleToggleEnabled(task: RecurringTask) {
    const prev = tasks;
    setTasks((t) => t.map((x) => x.id === task.id ? { ...x, is_enabled: !x.is_enabled } : x));
    try {
      await toggleRecurringTaskEnabled(supabase, task.id, !task.is_enabled);
    } catch {
      setTasks(prev);
      showToast("Failed to save — try again", "error");
    }
  }

  async function handleSubmitForm(data: {
    title: string; description: string; category: RecurringTask["category"];
    visibility: TaskVisibility; default_time: string; game_day_period: GameDayPeriod | ""; is_enabled: boolean;
  }) {
    const payload = {
      title: data.title,
      description: data.description || null,
      category: data.category,
      visibility: data.visibility,
      default_time: data.default_time || null,
      game_day_period: (data.game_day_period || null) as GameDayPeriod | null,
      is_enabled: data.is_enabled,
    };

    if (editTarget) {
      const prev = tasks;
      setTasks((t) => t.map((x) => x.id === editTarget.id ? { ...x, ...payload } : x));
      setFormOpen(false); setEditTarget(null);
      try {
        const updated = await updateRecurringTask(supabase, editTarget.id, payload);
        setTasks((t) => t.map((x) => x.id === editTarget.id ? updated : x));
      } catch {
        setTasks(prev);
        showToast("Failed to save — try again", "error");
      }
    } else {
      setFormOpen(false);
      try {
        const created = await createRecurringTask(supabase, { ...payload, user_id: user!.id });
        setTasks((t) => [...t, created]);
      } catch {
        showToast("Failed to add task — try again", "error");
      }
    }
  }

  async function handleDelete(task: RecurringTask) {
    const prev = tasks;
    setTasks((t) => t.filter((x) => x.id !== task.id));
    try {
      await deleteRecurringTask(supabase, task.id);
    } catch {
      setTasks(prev);
      showToast("Failed to delete — try again", "error");
    }
  }

  if (loading) return <div className="p-6 text-sm text-gray-400">Loading…</div>;

  const isCM = user?.role === "clubhouse_manager";

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-gray-900">Recurring Tasks</h1>
        <div className="flex items-center gap-2">
          {isCM && (
            <Button variant="secondary" onClick={() => setRerunStep("mode_select")}>
              Re-run Onboarding
            </Button>
          )}
          <Button onClick={() => { setEditTarget(null); setFormOpen(true); }}>+ Add Task</Button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-sm mb-3">No recurring tasks yet.</p>
          <Button onClick={() => { setEditTarget(null); setFormOpen(true); }}>Add your first task</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleEnabled={() => handleToggleEnabled(task)}
              onEdit={() => { setEditTarget(task); setFormOpen(true); }}
              onDelete={() => setDeleteTarget(task)}
            />
          ))}
        </div>
      )}

      <TaskFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null); }}
        onSubmit={handleSubmitForm}
        initial={editTarget}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.title}"?`}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) handleDelete(deleteTarget); setDeleteTarget(null); }}
      />

      {/* Re-run Onboarding — mode selection */}
      {rerunStep === "mode_select" && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6 space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Re-run Onboarding</h2>
            <p className="text-sm text-gray-600">
              The wizard will regenerate your recurring tasks based on new answers. How should the
              new tasks be added?
            </p>
            <div className="space-y-2">
              <button
                onClick={() => setRerunStep("confirm_replace")}
                className="w-full text-left border border-gray-200 rounded-lg px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <p className="text-sm font-medium text-gray-900">Replace all existing tasks</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  All current recurring tasks will be deleted and replaced with the generated ones.
                </p>
              </button>
              <button
                onClick={() => {
                  setRerunStep(null);
                  router.push("/onboarding?rerun=1&mode=merge");
                }}
                className="w-full text-left border border-gray-200 rounded-lg px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <p className="text-sm font-medium text-gray-900">Add to existing</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Generated tasks will be added without removing your current ones.
                </p>
              </button>
            </div>
            <button
              onClick={() => setRerunStep(null)}
              className="text-sm text-gray-400 hover:text-gray-600 w-full text-center"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Re-run Onboarding — replace confirmation */}
      {rerunStep === "confirm_replace" && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6 space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Delete all recurring tasks?</h2>
            <p className="text-sm text-gray-600">
              This will permanently delete all {tasks.length} of your recurring tasks and replace
              them with newly generated ones. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setRerunStep("mode_select")}
                className="flex-1"
              >
                Back
              </Button>
              <button
                onClick={() => {
                  setRerunStep(null);
                  router.push("/onboarding?rerun=1&mode=replace");
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
              >
                Yes, delete and regenerate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
