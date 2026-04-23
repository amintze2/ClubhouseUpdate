"use client";

import { Suspense, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { DevToolbar } from "@/components/layout/dev-toolbar";

const isDev = process.env.NEXT_PUBLIC_DEV_MODE === "true";

// Routes restricted to clubhouse managers only
const CM_ONLY_ROUTES = ["/checklists", "/calendar", "/recurring-tasks", "/inventory", "/meals"];

// Routes restricted to players only
const PLAYER_ONLY_ROUTES = ["/player-info", "/player-meals", "/player-report"];

// Default landing page per role
function defaultRoute(role: string): string {
  if (role === "general_manager") return "/reports";
  if (role === "player") return "/player-info";
  return "/checklists";
}

function AppLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated, error } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isRerun = searchParams.get("rerun") === "1";

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.role === "clubhouse_manager" && !user.has_completed_onboarding) {
        router.replace("/onboarding");
      } else if (pathname === "/onboarding" && !isRerun) {
        router.replace(defaultRoute(user.role));
      } else if (
        user.role !== "clubhouse_manager" &&
        CM_ONLY_ROUTES.some((r) => pathname.startsWith(r))
      ) {
        router.replace(defaultRoute(user.role));
      } else if (
        user.role !== "player" &&
        PLAYER_ONLY_ROUTES.some((r) => pathname.startsWith(r))
      ) {
        router.replace(defaultRoute(user.role));
      }
    }
  }, [isLoading, isAuthenticated, user, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500 text-sm">Authenticating…</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center h-screen p-6">
        <div className="max-w-sm w-full text-center">
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Authentication Error</h1>
          <p className="text-sm text-gray-500">
            {error ?? "Unable to authenticate. This app must be opened inside the Slugger platform."}
          </p>
        </div>
      </div>
    );
  }

  // Onboarding-incomplete CM (or rerun) — show wizard without sidebar; return null while redirect fires
  if (user.role === "clubhouse_manager" && (!user.has_completed_onboarding || isRerun)) {
    if (pathname !== "/onboarding") return null;
    return (
      <>
        {children}
        {isDev && <DevToolbar />}
      </>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role={user.role} userName={user.user_name} teamName={user.team_name ?? null} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile-only profile strip */}
        <div className="md:hidden flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-white">
          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold shrink-0">
            {(user.user_name ?? "?").split(" ").slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? "").join("")}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold text-gray-900 truncate">{user.user_name ?? "—"}</span>
            <span className="text-xs text-gray-400 mx-1">·</span>
            <span className="text-xs text-gray-400">{user.team_name ?? "—"}</span>
          </div>
          {user.role === "clubhouse_manager" ? (
            <button
              onClick={() => router.push("/onboarding?rerun=1&mode=replace")}
              className="text-xs text-gray-400 hover:text-gray-600 shrink-0"
            >
              Re-run Setup
            </button>
          ) : (
            <span className="text-xs text-gray-400 shrink-0">
              {user.role === "general_manager" ? "GM" : "Player"}
            </span>
          )}
        </div>
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {children}
        </main>
      </div>

      <MobileNav role={user.role} />

      {isDev && <DevToolbar />}
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="text-gray-500 text-sm">Authenticating…</div></div>}>
      <AppLayoutInner>{children}</AppLayoutInner>
    </Suspense>
  );
}
