"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ContactBar } from "@/components/layout/contact-bar";
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

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated, error } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.role === "clubhouse_manager" && !user.has_completed_onboarding) {
        router.replace("/onboarding");
      } else if (pathname === "/onboarding") {
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

  // Onboarding-incomplete CM — show wizard without sidebar; return null while redirect fires
  if (user.role === "clubhouse_manager" && !user.has_completed_onboarding) {
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
      <Sidebar role={user.role} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <ContactBar />

        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {children}
        </main>
      </div>

      <MobileNav role={user.role} />

      {isDev && <DevToolbar />}
    </div>
  );
}
