import { getOldClient, getNewClient, logSkipped, chunkArray, timer } from "./migrate-utils";

const CATEGORY_MAP: Record<string, string> = {
  laundry_cleaning: "laundry_cleaning",
  hygiene_personal: "hygiene_personal",
  medical_safety: "medical_safety",
  equipment_field: "equipment_field",
  food_beverage: "food_beverage",
  miscellaneous: "miscellaneous",
  // common legacy names
  laundry: "laundry_cleaning",
  hygiene: "hygiene_personal",
  medical: "medical_safety",
  equipment: "equipment_field",
  food: "food_beverage",
  misc: "miscellaneous",
};

function deriveStockStatus(current: number, required: number): string {
  if (current === 0) return "out";
  if (current >= required) return "stocked";
  return "low";
}

export async function migrateInventory(userIdMap: Map<number, number>): Promise<void> {
  const old = getOldClient();
  const neo = getNewClient();
  const elapsed = timer();

  const { data: rows, error } = await old.from("inventory").select("*");
  if (error) throw new Error(`Failed to read old inventory: ${error.message}`);
  if (!rows || rows.length === 0) { console.log("  inventory_items: 0 rows"); return; }

  // Truncate
  await neo.from("inventory_items").delete().neq("id", -1);

  // Fetch new teams for team id remapping
  const { data: oldTeams } = await old.from("teams").select("id, team_name");
  const { data: newTeams } = await neo.from("teams").select("id, team_name");
  const oldIdToName = new Map((oldTeams ?? []).map((t: any) => [t.id, t.team_name]));
  const nameToNewId = new Map((newTeams ?? []).map((t: any) => [t.team_name, t.id]));

  const mapped: any[] = [];
  let skipped = 0;

  for (const r of rows as any[]) {
    const category = CATEGORY_MAP[r.inventory_type ?? r.category];
    if (!category) {
      logSkipped("inventory", r, `unrecognised inventory_type: "${r.inventory_type ?? r.category}"`);
      skipped++;
      continue;
    }
    const teamName = oldIdToName.get(r.team_id);
    const newTeamId = teamName ? nameToNewId.get(teamName) : null;
    if (!newTeamId) { logSkipped("inventory", r, `cannot resolve team_id ${r.team_id}`); skipped++; continue; }

    const current = r.current_stock ?? 0;
    const par = r.required_stock ?? r.par_level ?? 0;

    mapped.push({
      team_id: newTeamId,
      item_name: r.item_name,
      category,
      unit: r.unit ?? null,
      current_stock: current,
      par_level: par,
      stock_status: deriveStockStatus(current, par),
      price_per_unit: r.price_per_unit ? Number(r.price_per_unit) : null,
      purchase_link: r.purchase_link ?? null,
      notes: r.notes ?? null,
    });
  }

  for (const chunk of chunkArray(mapped, 500)) {
    const { error: e } = await neo.from("inventory_items").insert(chunk);
    if (e) throw new Error(`Failed to insert inventory_items: ${e.message}`);
  }

  console.log(`  inventory_items: ${mapped.length} migrated, ${skipped} skipped (${elapsed()})`);
}

if (require.main === module) {
  migrateInventory(new Map()).catch((e) => { console.error(e.message); process.exit(1); });
}
