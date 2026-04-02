import { createClient, SupabaseClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load .env.migration first (with override) so cloud creds take precedence over .env.local
dotenv.config({ path: ".env.migration", override: true });
dotenv.config({ path: ".env.local" });

export function validateEnv(vars: string[]): void {
  const missing = vars.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    console.error(`❌  Missing required environment variables:\n${missing.map((v) => `  - ${v}`).join("\n")}`);
    process.exit(1);
  }
}

export function getOldClient(): SupabaseClient {
  validateEnv(["OLD_SUPABASE_URL", "OLD_SUPABASE_SERVICE_ROLE_KEY"]);
  return createClient(process.env.OLD_SUPABASE_URL!, process.env.OLD_SUPABASE_SERVICE_ROLE_KEY!);
}

export function getNewClient(): SupabaseClient {
  validateEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export function logSkipped(table: string, row: Record<string, unknown>, reason: string): void {
  console.warn(`  ⚠ Skipped row in ${table}: ${reason} — ${JSON.stringify(row)}`);
}

export async function truncateTable(client: SupabaseClient, table: string): Promise<void> {
  const { error } = await client.from(table).delete().neq("id", -1);
  if (error) throw new Error(`Failed to truncate ${table}: ${error.message}`);
}

export function timer(): () => string {
  const start = Date.now();
  return () => `${((Date.now() - start) / 1000).toFixed(1)}s`;
}
