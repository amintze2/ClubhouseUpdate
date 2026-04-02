import type { UserRole } from "@/lib/types";

/**
 * Maps Slugger role/teamRole strings to the app's UserRole enum.
 *
 * teamRole (from /api/users/me) is the authoritative source when present.
 * Assumed values — confirm via production logs once real auth is flowing:
 *   "clubhouse manager" → clubhouse_manager
 *   "manager"           → general_manager
 *   "player"            → player
 *
 * Falls back to role-based mapping for dev-mode payloads that lack teamRole.
 */
export function mapSluggerRole(sluggerRole: string, teamRole?: string): UserRole {
  if (teamRole) {
    switch (teamRole) {
      case "clubhouse manager":
        return "clubhouse_manager";
      case "manager":
        return "general_manager";
      case "player":
        return "player";
    }
  }

  // Role-based fallback (dev mode and postMessage payload path)
  switch (sluggerRole) {
    case "league":
    case "clubhouse_manager":
      return "clubhouse_manager";
    case "gm":
    case "general_manager":
      return "general_manager";
    case "player":
      return "player";
    default:
      throw new Error(`Unknown Slugger role: ${sluggerRole}`);
  }
}
