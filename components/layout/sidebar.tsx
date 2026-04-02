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

interface SidebarProps {
  role: UserRole;
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const items = NAV_ITEMS[role] ?? [];

  return (
    <aside className="hidden md:flex flex-col w-48 shrink-0 border-r border-gray-200 bg-white h-full">
      <nav className="flex flex-col gap-1 p-2 pt-4">
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
