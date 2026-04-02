/**
 * Games import script
 *
 * Usage:
 *   npx ts-node --project tsconfig.scripts.json scripts/import-games.ts <filepath>
 *
 * Accepts a JSON or CSV file. The file should contain an array of game records.
 *
 * JSON format:
 *   [
 *     {
 *       "home_team": "Long Island Ducks",   // team name OR numeric id
 *       "away_team": "Lancaster Stormers",  // team name OR numeric id
 *       "game_date": "2026-04-01",          // YYYY-MM-DD
 *       "game_time": "19:00",               // HH:MM, optional
 *       "is_makeup": false                  // optional, defaults to false
 *     }
 *   ]
 *
 * CSV format (header row required):
 *   home_team,away_team,game_date,game_time,is_makeup
 *   Long Island Ducks,Lancaster Stormers,2026-04-01,19:00,false
 */

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// ---- Types ----------------------------------------------------------------

interface RawGameRecord {
  home_team: string | number;
  away_team: string | number;
  game_date: string;
  game_time?: string;
  is_makeup?: boolean | string;
}

// ---- Helpers ---------------------------------------------------------------

function parseCSV(content: string): RawGameRecord[] {
  const lines = content.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const record: Record<string, string> = {};
    headers.forEach((h, i) => (record[h] = values[i] ?? ""));
    return record as unknown as RawGameRecord;
  });
}

function parseFile(filepath: string): RawGameRecord[] {
  const content = fs.readFileSync(filepath, "utf-8");
  const ext = path.extname(filepath).toLowerCase();
  if (ext === ".csv") return parseCSV(content);
  if (ext === ".json") return JSON.parse(content) as RawGameRecord[];
  throw new Error(`Unsupported file extension: ${ext}. Use .json or .csv`);
}

function normalizeMakeup(value: boolean | string | undefined): boolean {
  if (value === undefined || value === "") return false;
  if (typeof value === "boolean") return value;
  return value.toLowerCase() === "true";
}

// ---- Main ------------------------------------------------------------------

async function main() {
  const filepath = process.argv[2];
  if (!filepath) {
    console.error("Usage: npx ts-node scripts/import-games.ts <filepath>");
    process.exit(1);
  }

  if (!fs.existsSync(filepath)) {
    console.error(`File not found: ${filepath}`);
    process.exit(1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error(
      "Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    );
    process.exit(1);
  }

  // Use service role key as the apikey — bypasses RLS
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`Reading: ${filepath}`);
  let records: RawGameRecord[];
  try {
    records = parseFile(filepath);
  } catch (err) {
    console.error(`Failed to parse file: ${(err as Error).message}`);
    process.exit(1);
  }
  console.log(`Found ${records.length} records`);

  // Load all teams for name → id lookup
  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("id, team_name");
  if (teamsError) {
    console.error("Failed to load teams:", teamsError.message);
    process.exit(1);
  }
  const teamByName = new Map(teams.map((t) => [t.team_name.toLowerCase(), t.id]));
  const teamById = new Map(teams.map((t) => [t.id, t.id]));

  function resolveTeam(value: string | number): number | null {
    if (typeof value === "number") return teamById.get(value) ?? null;
    const id = teamByName.get(String(value).toLowerCase());
    return id ?? null;
  }

  let inserted = 0;
  let skippedDuplicate = 0;
  let skippedError = 0;

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const rowLabel = `Row ${i + 1}`;

    try {
      // Validate required fields
      if (!row.home_team || !row.away_team || !row.game_date) {
        throw new Error(
          `Missing required field(s): home_team=${row.home_team}, away_team=${row.away_team}, game_date=${row.game_date}`
        );
      }

      const homeTeamId = resolveTeam(row.home_team);
      const awayTeamId = resolveTeam(row.away_team);

      if (!homeTeamId) throw new Error(`Unknown home_team: "${row.home_team}"`);
      if (!awayTeamId) throw new Error(`Unknown away_team: "${row.away_team}"`);

      // Duplicate check
      const { data: existing } = await supabase
        .from("games")
        .select("id")
        .eq("home_team_id", homeTeamId)
        .eq("away_team_id", awayTeamId)
        .eq("game_date", row.game_date)
        .maybeSingle();

      if (existing) {
        console.warn(
          `  [SKIP] ${rowLabel}: duplicate — ${row.home_team} vs ${row.away_team} on ${row.game_date}`
        );
        skippedDuplicate++;
        continue;
      }

      const { error: insertError } = await supabase.from("games").insert({
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
        game_date: row.game_date,
        game_time: row.game_time || null,
        is_makeup: normalizeMakeup(row.is_makeup),
      });

      if (insertError) throw new Error(insertError.message);

      console.log(
        `  [OK]   ${rowLabel}: ${row.home_team} vs ${row.away_team} on ${row.game_date}`
      );
      inserted++;
    } catch (err) {
      console.error(`  [ERR]  ${rowLabel}: ${(err as Error).message}`);
      skippedError++;
    }
  }

  console.log(`\nDone.`);
  console.log(`  Inserted:          ${inserted}`);
  console.log(`  Skipped (dupes):   ${skippedDuplicate}`);
  console.log(`  Skipped (errors):  ${skippedError}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
