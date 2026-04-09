import type { TaskCategory, TaskVisibility, GameDayPeriod } from "@/lib/types";

export interface GeneratedTask {
  title: string;
  description: string | null;
  category: TaskCategory;
  visibility: TaskVisibility;
  game_day_period: GameDayPeriod | null;
  default_time: string | null; // "HH:MM"
}

export interface KeyContact {
  label: string;
  name: string;
  phone: string;
  email: string;
}
