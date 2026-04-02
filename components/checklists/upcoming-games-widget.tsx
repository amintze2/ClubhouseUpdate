import { formatDate, formatTime } from "@/lib/tasks-utils";
import type { UpcomingGame } from "@/lib/api/tasks";

interface UpcomingGamesWidgetProps {
  games: UpcomingGame[];
}

export function UpcomingGamesWidget({ games }: UpcomingGamesWidgetProps) {
  if (games.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
      {games.map((g) => (
        <div
          key={g.id}
          className="shrink-0 bg-green-50 border border-green-100 rounded-lg px-3 py-2 text-xs"
        >
          <p className="font-semibold text-green-800">{formatDate(g.game_date)}</p>
          <p className="text-green-600">vs {g.opponent_name}</p>
          {g.game_time && <p className="text-green-500 mt-0.5">{formatTime(g.game_time)}</p>}
        </div>
      ))}
    </div>
  );
}
