/**
 * migrate-all.ts
 *
 * Runs all migration scripts in dependency order.
 * Halts on first failure — dependent scripts are not run.
 *
 * Usage:
 *   npx tsx scripts/migrate-all.ts
 *
 * Required env vars (in .env.local):
 *   OLD_SUPABASE_URL
 *   OLD_SUPABASE_SERVICE_ROLE_KEY
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import * as dotenv from "dotenv";
import { validateEnv, timer } from "./migrate-utils";
import { migrateTeams } from "./migrate-teams";
import { migrateUsers } from "./migrate-users";
import { migrateGames } from "./migrate-games";
import { migrateTasks } from "./migrate-tasks";
import { migrateInventory } from "./migrate-inventory";
import { migrateMeals } from "./migrate-meals";
import { migratePlayerData } from "./migrate-player-data";
import { migrateMessages } from "./migrate-messages";
import { migrateIssues } from "./migrate-issues";

dotenv.config({ path: ".env.local" });

validateEnv([
  "OLD_SUPABASE_URL",
  "OLD_SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
]);

async function main() {
  const totalTimer = timer();
  console.log("🚀  Starting data migration\n");

  // Run in dependency order. userIdMap is passed to all scripts that need FK resolution.
  console.log("Step 1/9  teams");
  await migrateTeams();

  console.log("Step 2/9  users");
  const { idMap: userIdMap } = await migrateUsers();

  console.log("Step 3/9  games");
  await migrateGames();

  console.log("Step 4/9  tasks + recurring_tasks");
  await migrateTasks(userIdMap);

  console.log("Step 5/9  inventory");
  await migrateInventory(userIdMap);

  console.log("Step 6/9  meals");
  await migrateMeals(userIdMap);

  console.log("Step 7/9  player data");
  await migratePlayerData(userIdMap);

  console.log("Step 8/9  messages");
  await migrateMessages(userIdMap);

  console.log("Step 9/9  issues");
  await migrateIssues(userIdMap);

  console.log(`\n✅  Migration complete in ${totalTimer()}`);
  console.log("   Run `npx tsx scripts/validate-migration.ts` to verify.");
}

main().catch((e) => {
  console.error(`\n❌  Migration failed: ${e.message}`);
  process.exit(1);
});
