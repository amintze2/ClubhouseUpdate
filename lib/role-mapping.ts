import type { UserRole } from "@/lib/types";

/**
 * Maps Slugger role strings to the app's UserRole enum.
 * The Slugger role is the `role` field in the SLUGGER_AUTH payload's user object.
 */
export function mapSluggerRole(sluggerRole: string): UserRole {
  switch (sluggerRole) {
    case "league":
      return "clubhouse_manager";
    case "gm":
      return "general_manager";
    case "player":
      return "player";
    // TODO: add field_manager case when Rick White confirms how field managers
    // appear in Slugger. Expected: case "field_manager": return "field_manager"
    // (requires adding field_manager to UserRole and updating RLS policies)
    default:
      throw new Error(`Unknown Slugger role: ${sluggerRole}`);
  }
}
