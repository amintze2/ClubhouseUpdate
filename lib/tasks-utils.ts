import type { GameDayPeriod, Task, RecurringTask } from "@/lib/types";

/**
 * Assigns a one-off task to a game-day section based on its time vs. game boundaries.
 * - Before 12:00      → morning
 * - 12:00 – game time → pre_game
 * - After game time   → post_game
 * - No time set       → morning (safe default)
 *
 * @param taskTime  "HH:MM" or null
 * @param gameTime  "HH:MM" or null — defaults to "19:00" if not provided
 */
export function assignTaskToSection(
  taskTime: string | null,
  gameTime: string | null
): GameDayPeriod {
  if (!taskTime) return "morning";

  const [th, tm] = taskTime.split(":").map(Number);
  const taskMinutes = th * 60 + tm;

  const [gh, gm] = (gameTime ?? "19:00").split(":").map(Number);
  const gameMinutes = gh * 60 + gm;

  if (taskMinutes < 12 * 60) return "morning";
  if (taskMinutes < gameMinutes) return "pre_game";
  return "post_game";
}

/** Formats a "HH:MM:SS" or "HH:MM" time string to "H:MM AM/PM". */
export function formatTime(time: string | null): string {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

/** Formats an ISO date string "YYYY-MM-DD" to a readable short form like "Tue Apr 1". */
export function formatDate(dateStr: string): string {
  // Parse as local date to avoid timezone shifts
  const [y, mo, d] = dateStr.split("-").map(Number);
  const date = new Date(y, mo - 1, d);
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

/** Returns today's date as "YYYY-MM-DD" in local time. */
export function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Returns the start and end of the ISO week (Sun–Sat) containing the given date string. */
export function weekBounds(dateStr: string): { start: string; end: string } {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const date = new Date(y, mo - 1, d);
  const day = date.getDay(); // 0 = Sunday
  const start = new Date(date);
  start.setDate(date.getDate() - day);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: toDateString(start), end: toDateString(end) };
}

export function toDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Adds `days` to a date string and returns the new date string. */
export function addDays(dateStr: string, days: number): string {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const date = new Date(y, mo - 1, d);
  date.setDate(date.getDate() + days);
  return toDateString(date);
}
