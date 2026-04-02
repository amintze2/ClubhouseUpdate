"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/toast";
import { createSupabaseClient } from "@/lib/supabase";
import type { Game, Meal } from "@/lib/types";

interface MealRow {
  game: Game;
  meal: Meal;
  opponent: string;
}

export default function PlayerMealsPage() {
  const { user, accessToken } = useAuth();
  const { showToast } = useToast();
  const [rows, setRows] = useState<MealRow[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createSupabaseClient(accessToken ?? undefined);

  useEffect(() => {
    if (!user) return;

    const today = new Date().toISOString().slice(0, 10);
    const rangeEnd = new Date();
    rangeEnd.setDate(rangeEnd.getDate() + 90);
    const rangeEndStr = rangeEnd.toISOString().slice(0, 10);

    supabase
      .from("games")
      .select("*, teams!games_away_team_id_fkey(team_name), meals(*)")
      .eq("home_team_id", user.team_id)
      .gte("game_date", today)
      .lte("game_date", rangeEndStr)
      .order("game_date", { ascending: true })
      .then(({ data, error }) => {
        if (error) { showToast("Failed to load meals", "error"); return; }
        const planned: MealRow[] = (data ?? []).flatMap((g: any) => {
          const meal = Array.isArray(g.meals) ? g.meals[0] : g.meals;
          if (!meal || (!meal.pre_game_snack && !meal.post_game_meal)) return [];
          return [{ game: g as Game, meal: meal as Meal, opponent: g.teams?.team_name ?? "Opponent" }];
        });
        setRows(planned);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function formatDate(date: string): string {
    return new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }

  if (loading) return <div className="p-6 text-sm text-gray-400">Loading…</div>;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-lg font-semibold text-gray-900 mb-4">Meal Schedule</h1>

      {rows.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">No meals planned yet.</p>
      ) : (
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[auto_1fr_1fr] gap-x-4 px-4 py-2.5 bg-gray-50 text-xs font-medium text-gray-500">
            <span>Date</span>
            <span>Pre-Game Snack</span>
            <span>Post-Game Meal</span>
          </div>
          <div className="divide-y divide-gray-50">
            {rows.map(({ game, meal, opponent }) => (
              <div key={game.id} className="grid grid-cols-[auto_1fr_1fr] gap-x-4 px-4 py-3 text-sm items-start">
                <div className="min-w-[7rem]">
                  <p className="text-gray-800 font-medium">{formatDate(game.game_date)}</p>
                  <p className="text-gray-400 text-xs">vs {opponent}</p>
                </div>
                <p className="text-gray-600">{meal.pre_game_snack || <span className="text-gray-300">—</span>}</p>
                <p className="text-gray-600">{meal.post_game_meal || <span className="text-gray-300">—</span>}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
