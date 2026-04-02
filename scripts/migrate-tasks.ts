import { getOldClient, getNewClient, logSkipped, chunkArray, timer } from "./migrate-utils";

// task_type int → visibility enum (one-off tasks)
function mapTaskType(taskType: number | null): string | null {
  if (taskType === null || taskType === undefined) return "all";
  if (taskType === 1) return "game_day";
  if (taskType === 2) return "off_day";
  return null; // unknown — skip
}

// repeating_day int → visibility enum (recurring tasks)
function mapRepeatingDay(repeatingDay: number | null): string {
  if (repeatingDay === 0) return "off_day";
  return "game_day"; // null = game_day
}

// task_category mapping (old → new; assume same values, default to 'general')
const VALID_CATEGORIES = new Set([
  "sanitation", "laundry", "food", "equipment", "field", "admin", "medical", "general",
]);

function mapCategory(cat: string | null): string {
  return cat && VALID_CATEGORIES.has(cat) ? cat : "general";
}

export async function migrateTasks(userIdMap: Map<number, number>): Promise<void> {
  const old = getOldClient();
  const neo = getNewClient();
  const elapsed = timer();

  const { data: rows, error } = await old.from("tasks").select("*");
  if (error) throw new Error(`Failed to read old tasks: ${error.message}`);
  if (!rows || rows.length === 0) { console.log("  tasks/recurring_tasks: 0 rows"); return; }

  // Truncate new tables first
  await neo.from("recurring_task_completions").delete().neq("recurring_task_id", -1);
  await neo.from("tasks").delete().neq("id", -1);
  await neo.from("recurring_tasks").delete().neq("id", -1);

  const oneOff: any[] = [];
  const recurring: any[] = [];
  let skipped = 0;

  for (const r of rows as any[]) {
    const newUserId = userIdMap.get(r.user_id);
    if (!newUserId) { logSkipped("tasks", r, `user_id ${r.user_id} not in id map`); skipped++; continue; }

    if (r.is_repeating) {
      recurring.push({
        user_id: newUserId,
        title: r.title,
        description: r.description ?? null,
        default_time: r.task_time ?? r.default_time ?? null,
        category: mapCategory(r.category),
        visibility: mapRepeatingDay(r.repeating_day),
        game_day_period: null, // old schema had no game_day_period for recurring
        is_enabled: true,
      });
    } else {
      const visibility = mapTaskType(r.task_type);
      if (!visibility) { logSkipped("tasks", r, `unknown task_type: ${r.task_type}`); skipped++; continue; }
      oneOff.push({
        user_id: newUserId,
        title: r.title,
        description: r.description ?? null,
        task_date: r.task_date ?? r.date,
        task_time: r.task_time ?? r.time ?? null,
        category: mapCategory(r.category),
        visibility,
        game_day_period: null,
        is_complete: r.is_complete ?? false,
      });
    }
  }

  for (const chunk of chunkArray(oneOff, 500)) {
    const { error: e } = await neo.from("tasks").insert(chunk);
    if (e) throw new Error(`Failed to insert tasks: ${e.message}`);
  }
  for (const chunk of chunkArray(recurring, 500)) {
    const { error: e } = await neo.from("recurring_tasks").insert(chunk);
    if (e) throw new Error(`Failed to insert recurring_tasks: ${e.message}`);
  }

  console.log(`  tasks: ${oneOff.length} one-off, ${recurring.length} recurring, ${skipped} skipped (${elapsed()})`);
}

if (require.main === module) {
  // Run standalone with no user id mapping (best-effort)
  migrateTasks(new Map()).catch((e) => { console.error(e.message); process.exit(1); });
}
