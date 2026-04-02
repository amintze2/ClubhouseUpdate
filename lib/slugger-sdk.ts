/**
 * Slugger SDK — postMessage handshake with the Slugger parent window.
 *
 * This module handles the fixed auth contract with Slugger's platform:
 * 1. Send SLUGGER_WIDGET_READY to window.parent on init
 * 2. Wait for SLUGGER_AUTH from a known origin (10-second timeout)
 * 3. Call onAuth with the payload, or onError on timeout
 *
 * In dev mode (NEXT_PUBLIC_DEV_MODE=true), the real handshake is skipped
 * and a mock user is injected from env vars or the dev toolbar.
 */

export interface SluggerUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  teamId: string;
  isAdmin: boolean;
}

export interface SluggerAuthPayload {
  bootstrapToken: string;
  user: SluggerUser;
  expiresAt: number;
}

interface InitSluggerAuthOptions {
  onAuth: (payload: SluggerAuthPayload) => void;
  onError: (reason: string) => void;
  /** Override the mock user for dev toolbar switching. If provided in dev mode, uses this instead of env vars. */
  mockPayload?: SluggerAuthPayload;
}

// Origins that are permitted to send SLUGGER_AUTH messages.
// SLUGGER_STAGING_ORIGIN is optional — set it for staging environment testing.
const SLUGGER_ALLOWED_ORIGINS: string[] = [
  "https://alpb-analytics.com",
  ...(process.env.SLUGGER_STAGING_ORIGIN
    ? [process.env.SLUGGER_STAGING_ORIGIN]
    : []),
];

const AUTH_TIMEOUT_MS = 10_000;

export function initSluggerAuth(options: InitSluggerAuthOptions): () => void {
  const { onAuth, onError, mockPayload } = options;

  // ── Dev mode bypass ──────────────────────────────────────────────────────
  if (process.env.NEXT_PUBLIC_DEV_MODE === "true") {
    const payload = mockPayload ?? buildDevMockPayload();
    // Small delay to simulate async flow so callers don't need synchronous handling
    const t = setTimeout(() => onAuth(payload), 100);
    return () => clearTimeout(t);
  }

  // ── Real Slugger handshake ────────────────────────────────────────────────
  let settled = false;

  const timeout = setTimeout(() => {
    if (settled) return;
    settled = true;
    cleanup();
    onError("No SLUGGER_AUTH received within 10 seconds. Check that the widget is embedded in the Slugger platform.");
  }, AUTH_TIMEOUT_MS);

  function handleMessage(event: MessageEvent) {
    // Silently drop messages from unknown origins
    if (!SLUGGER_ALLOWED_ORIGINS.includes(event.origin)) return;
    if (event.data?.type !== "SLUGGER_AUTH") return;
    if (settled) return;

    settled = true;
    cleanup();
    onAuth(event.data.payload as SluggerAuthPayload);
  }

  window.addEventListener("message", handleMessage);

  // Send ready signal to each known Slugger origin (never use "*")
  SLUGGER_ALLOWED_ORIGINS.forEach((origin) => {
    window.parent.postMessage(
      { type: "SLUGGER_WIDGET_READY", widgetId: "clubhouse-management" },
      origin
    );
  });

  function cleanup() {
    clearTimeout(timeout);
    window.removeEventListener("message", handleMessage);
  }

  return cleanup;
}

/** Builds a mock SluggerAuthPayload from environment variables for dev mode. */
function buildDevMockPayload(): SluggerAuthPayload {
  const role = process.env.NEXT_PUBLIC_DEV_USER_ROLE ?? "league";
  const teamId = process.env.NEXT_PUBLIC_DEV_USER_TEAM ?? "1";
  const userId = process.env.NEXT_PUBLIC_DEV_USER_ID ?? "1";

  return {
    bootstrapToken: "dev-mock-token",
    user: {
      id: `dev-${role}-${userId}`,
      email: `dev-${role}@example.com`,
      firstName: "Dev",
      lastName: role.charAt(0).toUpperCase() + role.slice(1),
      role,
      teamId,
      isAdmin: false,
    },
    expiresAt: Date.now() + 3_600_000,
  };
}

/** Creates a SluggerAuthPayload for a specific seeded dev user. Used by the dev toolbar. */
export function buildMockPayloadForUser(user: {
  slugger_user_id: string;
  user_name: string | null;
  role: string;
  team_id: number;
}): SluggerAuthPayload {
  const [firstName, ...rest] = (user.user_name ?? "Dev User").split(" ");
  const sluggerRole =
    user.role === "clubhouse_manager"
      ? "league"
      : user.role === "general_manager"
      ? "gm"
      : "player";

  return {
    bootstrapToken: "dev-mock-token",
    user: {
      id: user.slugger_user_id,
      email: `${user.slugger_user_id}@example.com`,
      firstName: firstName ?? "Dev",
      lastName: rest.join(" ") || "",
      role: sluggerRole,
      teamId: String(user.team_id),
      isAdmin: false,
    },
    expiresAt: Date.now() + 3_600_000,
  };
}
