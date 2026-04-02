"use client";

import type { GameSeries } from "@/lib/api/meals";

interface SeriesCardProps {
  series: GameSeries;
  hasRestrictions: boolean;
  onClick: () => void;
}

function formatDateRange(games: GameSeries["games"]): string {
  if (games.length === 0) return "";
  const fmt = (d: string) => {
    const [, month, day] = d.split("-");
    return `${new Date(d + "T12:00:00").toLocaleString("en-US", { month: "short" })} ${parseInt(day)}`;
  };
  if (games.length === 1) return fmt(games[0].game_date);
  return `${fmt(games[0].game_date)}–${fmt(games[games.length - 1].game_date)}`;
}

function planningStatus(series: GameSeries): { label: string; color: string } {
  const planned = series.meals.filter((m) => m && (m.pre_game_snack || m.post_game_meal)).length;
  const total = series.games.length;
  if (planned === 0) return { label: "Not Planned", color: "text-gray-400 bg-gray-50 border-gray-100" };
  if (planned === total) return { label: "All Planned", color: "text-green-700 bg-green-50 border-green-200" };
  return { label: `${planned} of ${total} Planned`, color: "text-yellow-700 bg-yellow-50 border-yellow-200" };
}

export function SeriesCard({ series, hasRestrictions, onClick }: SeriesCardProps) {
  const status = planningStatus(series);
  const dateRange = formatDateRange(series.games);

  return (
    <button
      onClick={onClick}
      className="w-full text-left border border-gray-100 rounded-xl p-4 hover:border-blue-200 hover:bg-blue-50/30 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900 truncate">vs {series.opponent}</h3>
            {hasRestrictions && (
              <span className="text-yellow-500 text-sm shrink-0" title="Players have dietary restrictions">⚠</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {dateRange} · {series.games.length} game{series.games.length !== 1 ? "s" : ""}
          </p>
        </div>
        <span className={`text-xs font-medium border rounded-full px-2 py-0.5 shrink-0 ${status.color}`}>
          {status.label}
        </span>
      </div>
    </button>
  );
}
