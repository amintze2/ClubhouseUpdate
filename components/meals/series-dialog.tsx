"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { GameSeries, PlayerDietaryInfo } from "@/lib/api/meals";

interface SeriesDialogProps {
  open: boolean;
  onClose: () => void;
  series: GameSeries | null;
  restrictions: PlayerDietaryInfo[];
  onSave: (rows: { game_id: number; pre_game_snack: string; post_game_meal: string }[]) => void;
}

type MealRow = { game_id: number; pre_game_snack: string; post_game_meal: string };

function formatGameDate(date: string, time: string | null): string {
  const d = new Date(date + "T12:00:00");
  const dayStr = d.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric" });
  if (!time) return dayStr;
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${dayStr} · ${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export function SeriesDialog({ open, onClose, series, restrictions, onSave }: SeriesDialogProps) {
  const [rows, setRows] = useState<MealRow[]>([]);

  useEffect(() => {
    if (open && series) {
      setRows(series.games.map((g, i) => ({
        game_id: g.id,
        pre_game_snack: series.meals[i]?.pre_game_snack ?? "",
        post_game_meal: series.meals[i]?.post_game_meal ?? "",
      })));
    }
  }, [open, series]);

  function updateRow(index: number, field: "pre_game_snack" | "post_game_meal", value: string) {
    setRows((prev) => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  }

  function copyFromAbove(index: number) {
    if (index === 0) return;
    setRows((prev) => prev.map((r, i) =>
      i === index ? { ...r, pre_game_snack: prev[i - 1].pre_game_snack, post_game_meal: prev[i - 1].post_game_meal } : r
    ));
  }

  if (!series) return null;

  return (
    <Dialog open={open} onClose={onClose} title={`vs ${series.opponent}`}>
      <div className="flex flex-col gap-4">

        {/* Dietary restrictions summary */}
        <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5">
          <p className="text-xs font-medium text-amber-800 mb-1">Dietary Restrictions</p>
          {restrictions.length === 0 ? (
            <p className="text-xs text-amber-600">No restrictions on file for either team</p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {restrictions.map((p) => (
                <li key={p.player_name} className="text-xs text-amber-700">
                  <span className="font-medium">{p.player_name}:</span> {p.restrictions.join(", ")}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Game rows */}
        <div className="flex flex-col gap-3">
          {series.games.map((game, i) => (
            <div key={game.id} className="border border-gray-100 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-700">{formatGameDate(game.game_date, game.game_time)}</p>
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => copyFromAbove(i)}
                    className="text-xs text-blue-500 hover:text-blue-700"
                  >
                    Copy from above
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Pre-Game Snack</label>
                  <textarea
                    value={rows[i]?.pre_game_snack ?? ""}
                    onChange={(e) => updateRow(i, "pre_game_snack", e.target.value)}
                    rows={2}
                    placeholder="e.g. PB&J sandwiches, fruit, Gatorade"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Post-Game Meal</label>
                  <textarea
                    value={rows[i]?.post_game_meal ?? ""}
                    onChange={(e) => updateRow(i, "post_game_meal", e.target.value)}
                    rows={2}
                    placeholder="e.g. Chicken pasta, salad, rolls"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={() => onSave(rows)}>Save</Button>
        </div>
      </div>
    </Dialog>
  );
}
