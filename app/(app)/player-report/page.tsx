"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/toast";
import { createSupabaseClient } from "@/lib/supabase";
import { createIssue } from "@/lib/api/issues";
import { Button } from "@/components/ui/button";
import type { Team } from "@/lib/types";

export default function PlayerReportPage() {
  const { user, accessToken } = useAuth();
  const { showToast } = useToast();
  const supabase = createSupabaseClient(accessToken ?? undefined);

  const [teams, setTeams] = useState<Team[]>([]);
  const [context, setContext] = useState<"home" | "away">("home");
  const [awayTeamId, setAwayTeamId] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    supabase
      .from("teams")
      .select("*")
      .order("team_name")
      .then(({ data }) => {
        if (data) setTeams(data.filter((t) => t.id !== user?.team_id));
      });
  }, [user?.team_id]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!description.trim()) { setError("Description is required"); return; }

    setLoading(true);
    setError("");
    try {
      const selectedTeam = teams.find((t) => String(t.id) === awayTeamId);
      await createIssue(supabase, {
        player_id: user.id,
        player_team_id: user.team_id,
        team_context: context,
        away_team_name: context === "away" && selectedTeam ? selectedTeam.team_name : null,
        description: description.trim(),
      });
      showToast("Submitted. Clubhouse managers will review.", "success");
      setContext("home");
      setAwayTeamId("");
      setDescription("");
    } catch {
      showToast("Failed to submit. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-8">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Report an Issue</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Home / Away toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Game Location</label>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden w-fit">
            <button
              type="button"
              onClick={() => { setContext("home"); setAwayTeamId(""); }}
              className={`px-5 py-2 text-sm font-medium transition-colors ${
                context === "home"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => setContext("away")}
              className={`px-5 py-2 text-sm font-medium transition-colors ${
                context === "away"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Away
            </button>
          </div>
        </div>

        {/* Away team dropdown (conditional) */}
        {context === "away" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Away Team (optional)</label>
            <select
              value={awayTeamId}
              onChange={(e) => setAwayTeamId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">— Select team —</option>
              {teams.map((t) => (
                <option key={t.id} value={String(t.id)}>{t.team_name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
          <textarea
            value={description}
            onChange={(e) => { setDescription(e.target.value); setError(""); }}
            placeholder="Describe the issue…"
            rows={4}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Submitting…" : "Submit Report"}
        </Button>
      </form>
    </div>
  );
}
