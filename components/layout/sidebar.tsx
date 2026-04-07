"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/lib/types";

interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  clubhouse_manager: [
    { label: "Daily Checklists", href: "/checklists" },
    { label: "Task Calendar", href: "/calendar" },
    { label: "Recurring Tasks", href: "/recurring-tasks" },
    { label: "Inventory", href: "/inventory" },
    { label: "Meal Planning", href: "/meals" },
    { label: "Messages", href: "/messages" },
    { label: "Player Reports", href: "/reports" },
    { label: "Key Contacts", href: "/key-contacts" },
  ],
  general_manager: [
    { label: "Player Reports", href: "/reports" },
  ],
  player: [
    { label: "Player Info", href: "/player-info" },
    { label: "Meal Schedule", href: "/player-meals" },
    { label: "Issue Reporting", href: "/player-report" },
  ],
};

const ROLE_LABEL: Record<UserRole, string> = {
  clubhouse_manager: "Clubhouse Manager",
  general_manager: "General Manager",
  player: "Player",
};

interface SidebarProps {
  role: UserRole;
  userName: string | null;
  teamName: string | null;
}

function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function Sidebar({ role, userName, teamName }: SidebarProps) {
  const pathname = usePathname();
  const items = NAV_ITEMS[role] ?? [];

  return (
    <aside className="hidden md:flex flex-col w-48 shrink-0 border-r border-gray-200 bg-white h-full">
      {/* Profile chip */}
      <div className="px-3 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold shrink-0">
            {initials(userName)}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-900 truncate">{userName ?? "—"}</p>
            <p className="text-xs text-gray-400 truncate">{teamName ?? "—"}</p>
            <p className="text-xs text-gray-400">{ROLE_LABEL[role]}</p>
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-1 p-2 pt-3">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100",
              ].join(" ")}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
