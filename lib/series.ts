import type { Game, Team } from "@/lib/types";

export interface Series {
  opponent: Pick<Team, "id" | "team_name">;
  games: Game[];
}

interface SeriesOptions {
  /** Maximum gap in days between consecutive games to still be considered the same series. Default: 1 */
  maxGapDays?: number;
}

/**
 * Groups a flat array of games into series for a given home team.
 *
 * A series is defined as consecutive home games against the same opponent
 * with no gap between game dates exceeding maxGapDays (default: 1).
 *
 * Same-day games (double headers) are treated as gap = 0 and always group together.
 * Away games (where home_team_id !== teamId) are excluded.
 * Games within each series are sorted by game_date ascending, then game_time ascending.
 *
 * The opponent objects are built from the games array — pass enriched Game rows
 * that include away_team data if you need team_name populated.
 */
export function seriesFromGames(
  games: Game[],
  teamId: number,
  options: SeriesOptions = {}
): Series[] {
  const { maxGapDays = 1 } = options;

  // Filter to home games only, sorted by date then time
  const homeGames = games
    .filter((g) => g.home_team_id === teamId)
    .sort((a, b) => {
      const dateCmp = a.game_date.localeCompare(b.game_date);
      if (dateCmp !== 0) return dateCmp;
      // Same date: sort by time (nulls last)
      if (!a.game_time && !b.game_time) return 0;
      if (!a.game_time) return 1;
      if (!b.game_time) return -1;
      return a.game_time.localeCompare(b.game_time);
    });

  if (homeGames.length === 0) return [];

  const series: Series[] = [];
  let currentGames: Game[] = [homeGames[0]];

  for (let i = 1; i < homeGames.length; i++) {
    const prev = currentGames[currentGames.length - 1];
    const curr = homeGames[i];

    const sameOpponent = prev.away_team_id === curr.away_team_id;
    const gap = daysBetween(prev.game_date, curr.game_date);
    const withinGap = gap <= maxGapDays;

    if (sameOpponent && withinGap) {
      currentGames.push(curr);
    } else {
      series.push(buildSeries(currentGames));
      currentGames = [curr];
    }
  }

  // Push the last group
  series.push(buildSeries(currentGames));

  return series;
}

function buildSeries(games: Game[]): Series {
  const first = games[0];
  return {
    opponent: {
      id: first.away_team_id,
      // team_name is populated by the caller if they join team data;
      // falls back to empty string if raw Game rows are used
      team_name: (first as Game & { away_team?: Pick<Team, "team_name"> })
        .away_team?.team_name ?? "",
    },
    games,
  };
}

/** Returns the number of calendar days between two ISO date strings ("YYYY-MM-DD"). */
function daysBetween(dateA: string, dateB: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const a = new Date(dateA).getTime();
  const b = new Date(dateB).getTime();
  return Math.round(Math.abs(b - a) / msPerDay);
}
