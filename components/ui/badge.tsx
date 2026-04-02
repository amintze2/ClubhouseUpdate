import type { TaskCategory, TaskVisibility, GameDayPeriod } from "@/lib/types";

type BadgeVariant =
  | "category"
  | "visibility"
  | "period"
  | "status"
  | "game-home"
  | "game-away"
  | "default";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  category:    "bg-gray-100 text-gray-600",
  visibility:  "bg-blue-50 text-blue-700",
  period:      "bg-purple-50 text-purple-700",
  status:      "bg-yellow-50 text-yellow-700",
  "game-home": "bg-green-50 text-green-700",
  "game-away": "bg-orange-50 text-orange-700",
  default:     "bg-gray-100 text-gray-600",
};

export function Badge({ label, variant = "default", className = "" }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
        VARIANT_CLASSES[variant],
        className,
      ].join(" ")}
    >
      {label}
    </span>
  );
}

// Convenience helpers
export function categoryLabel(cat: TaskCategory): string {
  const map: Record<TaskCategory, string> = {
    sanitation: "Sanitation", laundry: "Laundry", food: "Food",
    equipment: "Equipment", field: "Field", admin: "Admin",
    medical: "Medical", general: "General",
  };
  return map[cat] ?? cat;
}

export function visibilityLabel(v: TaskVisibility): string {
  return v === "all" ? "Every Day" : v === "game_day" ? "Game Day" : "Off Day";
}

export function periodLabel(p: GameDayPeriod): string {
  return p === "morning" ? "Morning" : p === "pre_game" ? "Pre-Game" : "Post-Game";
}
