"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { RecurringTask, TaskCategory, TaskVisibility, GameDayPeriod } from "@/lib/types";

const CATEGORIES: TaskCategory[] = [
  "sanitation", "laundry", "food", "equipment", "field", "admin", "medical", "general",
];

type FormData = {
  title: string;
  description: string;
  category: TaskCategory;
  visibility: TaskVisibility;
  default_time: string;
  game_day_period: GameDayPeriod | "";
  is_enabled: boolean;
};

const DEFAULT_FORM: FormData = {
  title: "", description: "", category: "general",
  visibility: "all", default_time: "", game_day_period: "", is_enabled: true,
};

interface TaskFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
  initial?: RecurringTask | null;
}

export function TaskFormDialog({ open, onClose, onSubmit, initial }: TaskFormDialogProps) {
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(initial ? {
        title: initial.title,
        description: initial.description ?? "",
        category: initial.category,
        visibility: initial.visibility,
        default_time: initial.default_time ?? "",
        game_day_period: initial.game_day_period ?? "",
        is_enabled: initial.is_enabled,
      } : DEFAULT_FORM);
      setError("");
    }
  }, [open, initial]);

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required"); return; }
    onSubmit(form);
  }

  const isEdit = !!initial;

  return (
    <Dialog open={open} onClose={onClose} title={isEdit ? "Edit Recurring Task" : "Add Recurring Task"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => { set("title", e.target.value); setError(""); }}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={form.category}
              onChange={(e) => set("category", e.target.value as TaskCategory)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Default Time</label>
            <input
              type="time"
              value={form.default_time}
              onChange={(e) => set("default_time", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
          <div className="flex gap-2">
            {(["all", "game_day", "off_day"] as TaskVisibility[]).map((v) => (
              <label key={v} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value={v}
                  checked={form.visibility === v}
                  onChange={() => { set("visibility", v); if (v === "off_day") set("game_day_period", ""); }}
                  className="text-blue-600"
                />
                <span className="text-sm text-gray-700">
                  {v === "all" ? "Every Day" : v === "game_day" ? "Game Day" : "Off Day"}
                </span>
              </label>
            ))}
          </div>
        </div>

        {(form.visibility === "game_day" || form.visibility === "all") && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Game Day Section</label>
            <select
              value={form.game_day_period}
              onChange={(e) => set("game_day_period", e.target.value as GameDayPeriod | "")}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Morning (default)</option>
              <option value="morning">Morning</option>
              <option value="pre_game">Pre-Game</option>
              <option value="post_game">Post-Game</option>
            </select>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">{isEdit ? "Save Changes" : "Add Task"}</Button>
        </div>
      </form>
    </Dialog>
  );
}

export type { FormData as RecurringTaskFormData };
