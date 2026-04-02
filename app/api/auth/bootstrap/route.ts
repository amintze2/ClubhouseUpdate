/**
 * POST /api/auth/bootstrap
 *
 * Receives the Slugger auth payload, verifies identity via a three-path chain,
 * upserts the user in our DB, and returns a signed Supabase JWT.
 *
 * Path 1: GET https://alpb-analytics.com/api/users/me (authoritative)
 * Path 2: Use sluggerUser payload directly (fallback if Path 1 non-200)
 * Path 3: Decode bootstrapToken as Cognito RS256 JWT (fallback if Path 2 unavailable)
 *
 * In dev mode (NEXT_PUBLIC_DEV_MODE=true): skip Path 1 and Path 3, trust mock payload.
 */

import { NextRequest, NextResponse } from "next/server";
import { SignJWT, importJWK, decodeJwt } from "jose";
import { createClient } from "@supabase/supabase-js";
import { mapSluggerRole } from "@/lib/role-mapping";
import type { SluggerUser } from "@/lib/slugger-sdk";
import type { UserRole } from "@/lib/types";

interface BootstrapRequestBody {
  token: string;
  sluggerUser: SluggerUser;
}

interface VerifiedIdentity {
  sluggerUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  teamId: string;
  role: UserRole;
}

// ── Supabase service-role client (bypasses RLS for upsert) ───────────────────
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ── Path 1: Slugger API ───────────────────────────────────────────────────────
async function verifyViaSluggerApi(
  token: string,
  sluggerUser: SluggerUser
): Promise<VerifiedIdentity | null> {
  try {
    const res = await fetch("https://alpb-analytics.com/api/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;

    const body = await res.json();
    console.log("Slugger /api/users/me response:", JSON.stringify(body));
    // Response shape: { success: true, data: { id, email, role, teamRole, ... } }
    const u = body.data ?? body;
    return {
      sluggerUserId: String(u.id ?? sluggerUser.id),
      email: u.email ?? sluggerUser.email,
      firstName: u.firstName ?? sluggerUser.firstName,
      lastName: u.lastName ?? sluggerUser.lastName,
      teamId: String(u.teamId ?? sluggerUser.teamId),
      role: mapSluggerRole(sluggerUser.role, u.teamRole),
    };
  } catch {
    return null;
  }
}

// ── Path 2: Payload fallback ──────────────────────────────────────────────────
function verifyViaPayload(sluggerUser: SluggerUser): VerifiedIdentity {
  return {
    sluggerUserId: sluggerUser.id,
    email: sluggerUser.email,
    firstName: sluggerUser.firstName,
    lastName: sluggerUser.lastName,
    teamId: String(sluggerUser.teamId),
    role: mapSluggerRole(sluggerUser.role),
  };
}

// ── Path 3: Cognito fallback ──────────────────────────────────────────────────
async function verifyViaCognito(
  token: string,
  sluggerUser: SluggerUser
): Promise<VerifiedIdentity | null> {
  const region = process.env.COGNITO_REGION;
  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  if (!region || !userPoolId) return null;

  try {
    // Fetch JWKS
    const jwksUrl = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;
    const jwksRes = await fetch(jwksUrl);
    if (!jwksRes.ok) return null;
    const jwks = await jwksRes.json();

    // Decode token header to find the matching key
    const decoded = decodeJwt(token);
    if (!decoded) return null;

    // Verify using jose's importJWK
    const headerB64 = token.split(".")[0];
    const header = JSON.parse(Buffer.from(headerB64, "base64url").toString());
    const kid = header.kid;
    const jwk = jwks.keys?.find((k: { kid?: string }) => k.kid === kid);
    if (!jwk) return null;

    const publicKey = await importJWK(jwk, "RS256");
    const { jwtVerify } = await import("jose");
    await jwtVerify(token, publicKey);

    // If we get here, signature is valid — use payload user for identity
    return {
      sluggerUserId: sluggerUser.id,
      email: sluggerUser.email,
      firstName: sluggerUser.firstName,
      lastName: sluggerUser.lastName,
      teamId: String(sluggerUser.teamId),
      role: mapSluggerRole(sluggerUser.role),
    };
  } catch {
    return null;
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let body: BootstrapRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { token, sluggerUser } = body;
  if (!token || !sluggerUser) {
    return NextResponse.json({ error: "Missing token or sluggerUser" }, { status: 400 });
  }

  const jwtSecret = process.env.SUPABASE_JWT_SECRET;
  if (!jwtSecret) {
    return NextResponse.json({ error: "Server misconfiguration: missing JWT secret" }, { status: 500 });
  }

  // ── Identity verification ─────────────────────────────────────────────────
  let identity: VerifiedIdentity;

  const isDev = process.env.NEXT_PUBLIC_DEV_MODE === "true";

  if (isDev) {
    // Dev mode: trust mock payload directly, skip external calls
    identity = verifyViaPayload(sluggerUser);
  } else {
    // Path 1: Slugger API
    const path1 = await verifyViaSluggerApi(token, sluggerUser);
    if (path1) {
      identity = path1;
    } else {
      // Path 2: Payload fallback
      identity = verifyViaPayload(sluggerUser);

      // Path 3: Cognito — enhance with verified token if env vars set
      // (Path 2 already gives us the identity; Path 3 would upgrade confidence
      // but the spec uses payload as Path 2 so we proceed with it)
      const path3 = await verifyViaCognito(token, sluggerUser);
      if (path3) {
        identity = path3;
      }
    }
  }

  // ── Upsert user ───────────────────────────────────────────────────────────
  const supabase = getServiceClient();
  const userName = [identity.firstName, identity.lastName].filter(Boolean).join(" ") || null;

  const { data: user, error: upsertError } = await supabase
    .from("users")
    .upsert(
      {
        slugger_user_id: identity.sluggerUserId,
        user_name: userName,
        email: identity.email,
        role: identity.role,
        team_id: Number(identity.teamId),
      },
      { onConflict: "slugger_user_id", ignoreDuplicates: false }
    )
    .select("*, teams(team_name)")
    .single();

  if (upsertError || !user) {
    console.error("Bootstrap upsert error:", upsertError);
    return NextResponse.json({ error: "Failed to upsert user" }, { status: 500 });
  }

  // ── Sign Supabase JWT ─────────────────────────────────────────────────────
  const secretBytes = new TextEncoder().encode(jwtSecret);
  const now = Math.floor(Date.now() / 1000);

  const accessToken = await new SignJWT({
    sub: String(user.id),
    team_id: String(user.team_id),
    role_: user.role as string,
    role: "authenticated",
    iss: "supabase",
    aud: "authenticated",
    iat: now,
    exp: now + 3600,
  })
    .setProtectedHeader({ alg: "HS256" })
    .sign(secretBytes);

  // ── Response ──────────────────────────────────────────────────────────────
  const { teams, ...userRow } = user as typeof user & { teams?: { team_name: string } };

  return NextResponse.json({
    user: {
      ...userRow,
      team_name: teams?.team_name ?? null,
    },
    session: {
      access_token: accessToken,
      expires_in: 3600,
    },
  });
}
