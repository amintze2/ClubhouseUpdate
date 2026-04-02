/**
 * RLS Smoke Test
 *
 * Verifies Row Level Security isolates data between teams.
 * Run with: npx ts-node --project tsconfig.scripts.json scripts/smoke-test-rls.ts
 *
 * Requires: supabase start + supabase db reset
 */

import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const SECRET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
// Local Supabase default JWT secret
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET ?? "super-secret-jwt-token-with-at-least-32-characters-long";

// Service role client — bypasses RLS, used for setup/teardown only
const admin = createClient(SUPABASE_URL, SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}

/**
 * Signs a JWT with the claims our bootstrap endpoint will produce.
 * sub      = users.id (integer as text)
 * team_id  = users.team_id (integer as text)
 * role_    = users.role enum value
 */
function signUserJwt(userId: number, teamId: number, role: string): string {
  return jwt.sign(
    {
      sub: String(userId),
      team_id: String(teamId),
      role_: role,
      role: "authenticated",   // Supabase role
      iss: "supabase",
      aud: "authenticated",
    },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
}

function clientFor(token: string) {
  return createClient(SUPABASE_URL, SECRET_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function setup() {
  console.log("\nSetting up test data...");

  const { data: teams, error: teamsError } = await admin
    .from("teams")
    .insert([
      { team_name: "Smoke Test Alpha" },
      { team_name: "Smoke Test Beta" },
    ])
    .select();
  if (teamsError) throw new Error(`Teams: ${teamsError.message}`);
  const [teamA, teamB] = teams!;

  const { data: appUsers, error: usersError } = await admin
    .from("users")
    .insert([
      { slugger_user_id: "smoke-alpha", user_name: "Alpha CM", role: "clubhouse_manager", team_id: teamA.id },
      { slugger_user_id: "smoke-beta",  user_name: "Beta CM",  role: "clubhouse_manager", team_id: teamB.id },
    ])
    .select();
  if (usersError) throw new Error(`Users: ${usersError.message}`);
  const [userA, userB] = appUsers!;

  const { error: invError } = await admin.from("inventory_items").insert([
    { team_id: teamA.id, item_name: "Alpha Tide Pods", category: "laundry_cleaning", stock_status: "stocked" },
    { team_id: teamB.id, item_name: "Beta Bleach",     category: "laundry_cleaning", stock_status: "low"     },
  ]);
  if (invError) throw new Error(`Inventory: ${invError.message}`);

  console.log(`  Teams: ${teamA.id} (Alpha), ${teamB.id} (Beta)`);
  console.log(`  Users: ${userA.id} (Alpha CM), ${userB.id} (Beta CM)`);
  return { teamA, teamB, userA, userB };
}

async function cleanup(teamAId: number, teamBId: number) {
  await admin.from("inventory_items").delete().in("team_id", [teamAId, teamBId]);
  await admin.from("users").delete().in("slugger_user_id", ["smoke-alpha", "smoke-beta"]);
  await admin.from("teams").delete().in("id", [teamAId, teamBId]);
}

async function main() {
  console.log("=== RLS Smoke Test ===");

  let teamAId: number | undefined;
  let teamBId: number | undefined;

  try {
    const { teamA, teamB, userA, userB } = await setup();
    teamAId = teamA.id;
    teamBId = teamB.id;

    const tokenA = signUserJwt(userA.id, teamA.id, "clubhouse_manager");
    const tokenB = signUserJwt(userB.id, teamB.id, "clubhouse_manager");

    const clientA = clientFor(tokenA);
    const clientB = clientFor(tokenB);

    // ── User A sees their own inventory ─────────────────────────────────────
    console.log("\nTest: User A sees own inventory only");
    const { data: invA } = await clientA.from("inventory_items").select("item_name, team_id");
    assert("User A sees Alpha Tide Pods",      invA?.some(i => i.item_name === "Alpha Tide Pods") ?? false);
    assert("User A does NOT see Beta Bleach",  !(invA?.some(i => i.item_name === "Beta Bleach") ?? false));
    assert("All User A rows = Team Alpha",     (invA ?? []).every(i => i.team_id === teamAId));

    // ── User B sees their own inventory ─────────────────────────────────────
    console.log("\nTest: User B sees own inventory only");
    const { data: invB } = await clientB.from("inventory_items").select("item_name, team_id");
    assert("User B sees Beta Bleach",              invB?.some(i => i.item_name === "Beta Bleach") ?? false);
    assert("User B does NOT see Alpha Tide Pods",  !(invB?.some(i => i.item_name === "Alpha Tide Pods") ?? false));
    assert("All User B rows = Team Beta",          (invB ?? []).every(i => i.team_id === teamBId));

    // ── Cross-team insert blocked ────────────────────────────────────────────
    console.log("\nTest: Cross-team insert is blocked");
    const { error: crossErr } = await clientA.from("inventory_items").insert({
      team_id: teamBId,
      item_name: "Unauthorized Item",
      category: "miscellaneous",
      stock_status: "stocked",
    });
    assert("Cross-team insert rejected", crossErr !== null, crossErr?.message);

    // ── User A sees their own row in users ──────────────────────────────────
    console.log("\nTest: User sees own users row only");
    const { data: usersA } = await clientA.from("users").select("id");
    assert("User A sees exactly 1 user row",    (usersA?.length ?? 0) === 1);
    assert("User A sees their own id",          usersA?.[0]?.id === userA.id);

  } finally {
    if (teamAId && teamBId) {
      console.log("\nCleaning up...");
      await cleanup(teamAId, teamBId);
    }
  }

  console.log(`\n${"─".repeat(40)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });
