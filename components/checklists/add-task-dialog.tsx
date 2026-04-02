"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { TaskCategory, TaskVisibility } from "@/lib/types";

const CATEGORIES: TaskCategory[] = [
  "sanitation", "laundry", "food", "equipment", "field", "admin", "medical", "general",
];

import type { GameDayPeriod } from "@/lib/types";

interface AddTaskDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string | null;
    category: TaskCategory;
    task_time: string | null;
    game_day_period: GameDayPeriod | null;
  }) => void;
  defaultDate?: string;
  isGameDay?: boolean;
}

export function AddTaskDialog({ open, onClose, onSubmit, isGameDay = false }: AddTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TaskCategory>("general");
  const [time, setTime] = useState("");
  const [period, setPeriod] = useState<GameDayPeriod>("morning");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Title is required"); return; }
    onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      category,
      task_time: time || null,
      game_day_period: isGameDay ? period : null,
    });
    reset();
  }

  function reset() {
    setTitle(""); setDescription(""); setCategory("general"); setTime(""); setPeriod("morning"); setError("");
  }

  function handleClose() { reset(); onClose(); }

  return (
    <Dialog open={open} onClose={handleClose} title="Add Task">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setError(""); }}
            placeholder="Task title"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Optional details"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TaskCategory)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {isGameDay && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as GameDayPeriod)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="morning">Morning</option>
              <option value="pre_game">Pre-Game</option>
              <option value="post_game">Post-Game</option>
            </select>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button type="submit">Add Task</Button>
        </div>
      </form>
    </Dialog>
  );
}
