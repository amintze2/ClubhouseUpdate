/**
 * Runnable test script for lib/series.ts
 * Run with: npx ts-node --project tsconfig.scripts.json scripts/test-series.ts
 */

import { seriesFromGames } from "../lib/series";
import type { Game } from "../lib/types";

const TEAM_A = 1;
const TEAM_B = 2;
const TEAM_C = 3;

let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`);
    failed++;
  }
}

function makeGame(
  id: number,
  homeTeamId: number,
  awayTeamId: number,
  gameDate: string,
  gameTime?: string
): Game {
  return {
    id,
    home_team_id: homeTeamId,
    away_team_id: awayTeamId,
    game_date: gameDate,
    game_time: gameTime ?? null,
    is_makeup: false,
    created_at: new Date().toISOString(),
  };
}

// ============================================================
console.log("\nScenario: Normal 3-game series");
// ============================================================
{
  const games = [
    makeGame(1, TEAM_A, TEAM_B, "2026-04-01"),
    makeGame(2, TEAM_A, TEAM_B, "2026-04-02"),
    makeGame(3, TEAM_A, TEAM_B, "2026-04-03"),
  ];
  const result = seriesFromGames(games, TEAM_A);
  assert("Returns 1 series", result.length === 1);
  assert("Series has 3 games", result[0].games.length === 3);
  assert("Opponent ID is TEAM_B", result[0].opponent.id === TEAM_B);
}

// ============================================================
console.log("\nScenario: Gap split (gap > maxGapDays splits series)");
// ============================================================
{
  const games = [
    makeGame(1, TEAM_A, TEAM_B, "2026-04-01"),
    makeGame(2, TEAM_A, TEAM_B, "2026-04-02"),
    makeGame(3, TEAM_A, TEAM_B, "2026-04-05"), // 3-day gap
  ];
  const result = seriesFromGames(games, TEAM_A, { maxGapDays: 1 });
  assert("Returns 2 series", result.length === 2);
  assert("First series has 2 games", result[0].games.length === 2);
  assert("Second series has 1 game", result[1].games.length === 1);
}

// ============================================================
console.log("\nScenario: Gap within threshold keeps series together");
// ============================================================
{
  const games = [
    makeGame(1, TEAM_A, TEAM_B, "2026-04-01"),
    makeGame(2, TEAM_A, TEAM_B, "2026-04-03"), // 2-day gap
  ];
  const result = seriesFromGames(games, TEAM_A, { maxGapDays: 2 });
  assert("Returns 1 series", result.length === 1);
  assert("Series has 2 games", result[0].games.length === 2);
}

// ============================================================
console.log("\nScenario: Opponent change splits series");
// ============================================================
{
  const games = [
    makeGame(1, TEAM_A, TEAM_B, "2026-04-01"),
    makeGame(2, TEAM_A, TEAM_B, "2026-04-02"),
    makeGame(3, TEAM_A, TEAM_C, "2026-04-03"),
    makeGame(4, TEAM_A, TEAM_C, "2026-04-04"),
  ];
  const result = seriesFromGames(games, TEAM_A);
  assert("Returns 2 series", result.length === 2);
  assert("First series opponent is TEAM_B", result[0].opponent.id === TEAM_B);
  assert("Second series opponent is TEAM_C", result[1].opponent.id === TEAM_C);
}

// ============================================================
console.log("\nScenario: Same-day double header (gap = 0)");
// ============================================================
{
  const games = [
    makeGame(1, TEAM_A, TEAM_B, "2026-04-01", "13:00"),
    makeGame(2, TEAM_A, TEAM_B, "2026-04-01", "18:30"), // same day
    makeGame(3, TEAM_A, TEAM_B, "2026-04-02"),
  ];
  const result = seriesFromGames(games, TEAM_A);
  assert("Returns 1 series", result.length === 1);
  assert("Series has 3 games", result[0].games.length === 3);
}

// ============================================================
console.log("\nScenario: Away games excluded");
// ============================================================
{
  const games = [
    makeGame(1, TEAM_A, TEAM_B, "2026-04-01"), // home
    makeGame(2, TEAM_B, TEAM_A, "2026-04-02"), // away — should be excluded
    makeGame(3, TEAM_A, TEAM_C, "2026-04-03"), // home
  ];
  const result = seriesFromGames(games, TEAM_A);
  assert("Returns 2 series", result.length === 2);
  assert("Total games across series = 2", result.reduce((n, s) => n + s.games.length, 0) === 2);
}

// ============================================================
console.log("\nScenario: Unsorted input is sorted within series");
// ============================================================
{
  const games = [
    makeGame(3, TEAM_A, TEAM_B, "2026-04-03"),
    makeGame(1, TEAM_A, TEAM_B, "2026-04-01"),
    makeGame(2, TEAM_A, TEAM_B, "2026-04-02"),
  ];
  const result = seriesFromGames(games, TEAM_A);
  assert("Returns 1 series", result.length === 1);
  assert("Games sorted: first is Apr 1", result[0].games[0].game_date === "2026-04-01");
  assert("Games sorted: last is Apr 3", result[0].games[2].game_date === "2026-04-03");
}

// ============================================================
console.log("\nScenario: Empty input");
// ============================================================
{
  const result = seriesFromGames([], TEAM_A);
  assert("Returns empty array", result.length === 0);
}

// ============================================================
console.log(`\n${"─".repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
