"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/toast";
import { createSupabaseClient } from "@/lib/supabase";
import {
  getHomeGameSeries, upsertMeals, getDietaryRestrictionsForTeams,
  type GameSeries, type PlayerDietaryInfo,
} from "@/lib/api/meals";
import { SeriesCard } from "@/components/meals/series-card";
import { SeriesDialog } from "@/components/meals/series-dialog";

export default function MealsPage() {
  const { user, accessToken } = useAuth();
  const { showToast } = useToast();

  const [seriesList, setSeriesList] = useState<GameSeries[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedSeries, setSelectedSeries] = useState<GameSeries | null>(null);
  const [dialogRestrictions, setDialogRestrictions] = useState<PlayerDietaryInfo[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const supabase = createSupabaseClient(accessToken ?? undefined);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getHomeGameSeries(supabase, user.team_id)
      .then(setSeriesList)
      .catch(() => showToast("Failed to load meals", "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function openSeries(series: GameSeries) {
    setSelectedSeries(series);
    setDialogOpen(true);
    // Fetch restrictions for home team + this series' visiting team
    try {
      const teamIds = [user!.team_id, series.awayTeamId].filter((id, i, arr) => arr.indexOf(id) === i);
      const restr = await getDietaryRestrictionsForTeams(supabase, teamIds);
      setDialogRestrictions(restr);
    } catch {
      setDialogRestrictions([]);
    }
  }

  async function handleSave(rows: { game_id: number; pre_game_snack: string; post_game_meal: string }[]) {
    setDialogOpen(false);
    try {
      await upsertMeals(supabase, rows);
      const updated = await getHomeGameSeries(supabase, user!.team_id);
      setSeriesList(updated);
      showToast("Meals saved", "success");
    } catch {
      showToast("Failed to save meals — try again", "error");
    }
  }

  // Whether any series has restrictions (for the card warning icon)
  const allAwayTeamIds = seriesList.map((s) => s.awayTeamId);
  const teamIdsToCheck = [user?.team_id ?? 0, ...allAwayTeamIds];

  if (loading) return <div className="p-6 text-sm text-gray-400">Loading…</div>;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-lg font-semibold text-gray-900 mb-4">Meal Planning</h1>

      {seriesList.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">No upcoming home series</p>
      ) : (
        <div className="flex flex-col gap-3">
          {seriesList.map((series, i) => (
            <SeriesCard
              key={`${series.opponent}-${i}`}
              series={series}
              hasRestrictions={false} // loaded per-series when dialog opens
              onClick={() => openSeries(series)}
            />
          ))}
        </div>
      )}

      <SeriesDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        series={selectedSeries}
        restrictions={dialogRestrictions}
        onSave={handleSave}
      />
    </div>
  );
}
