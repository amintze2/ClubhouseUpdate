import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { GeneratedTask } from "@/lib/api/onboarding";

const VALID_CATEGORIES = new Set([
  "sanitation", "laundry", "food", "equipment",
  "field", "admin", "medical", "general",
]);
const VALID_VISIBILITIES = new Set(["game_day", "off_day", "all"]);
const VALID_PERIODS = new Set(["morning", "pre_game", "post_game"]);

function normalizeTask(t: Record<string, unknown>): Record<string, unknown> {
  // Ensure game_day_period is null for non-game-day tasks regardless of what the AI sent
  if (t.visibility !== "game_day") {
    return { ...t, game_day_period: null };
  }
  return t;
}

function isValidTask(t: unknown): t is GeneratedTask {
  if (!t || typeof t !== "object") return false;
  const task = t as Record<string, unknown>;
  if (typeof task.title !== "string" || !task.title.trim()) return false;
  if (!VALID_CATEGORIES.has(task.category as string)) return false;
  if (!VALID_VISIBILITIES.has(task.visibility as string)) return false;
  if (task.visibility === "game_day" && !VALID_PERIODS.has(task.game_day_period as string)) return false;
  return true;
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  let body: { user_id?: number; team_id?: number; tasks?: unknown[]; mode?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { user_id, team_id, tasks, mode = "replace" } = body;

  if (!user_id || !team_id || !Array.isArray(tasks)) {
    return NextResponse.json({ error: "Missing required fields: user_id, team_id, tasks" }, { status: 400 });
  }

  const valid = tasks.filter(isValidTask);

  if (valid.length === 0) {
    return NextResponse.json({ error: "No valid tasks provided" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  if (mode === "replace") {
    await supabase.from("recurring_tasks").delete().eq("user_id", user_id);
  }

  const { data, error } = await supabase
    .from("recurring_tasks")
    .insert(valid.map((t) => ({ ...normalizeTask(t as unknown as Record<string, unknown>), user_id })))
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("users").update({ has_completed_onboarding: true }).eq("id", user_id);

  return NextResponse.json({ tasks: data ?? [] });
}
