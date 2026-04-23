"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { UserRole } from "@/lib/types";

interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  clubhouse_manager: [
    { label: "Checklists", href: "/checklists" },
    { label: "Calendar", href: "/calendar" },
    { label: "Inventory", href: "/inventory" },
    { label: "Meals", href: "/meals" },
    { label: "Messages", href: "/messages" },
    { label: "Recurring", href: "/recurring-tasks" },
    { label: "Contacts", href: "/key-contacts" },
  ],
  general_manager: [
    { label: "Reports", href: "/reports" },
  ],
  player: [
    { label: "My Info", href: "/player-info" },
    { label: "Meals", href: "/player-meals" },
    { label: "Report Issue", href: "/player-report" },
  ],
};

const MAX_VISIBLE = 5;

interface MobileNavProps {
  role: UserRole;
}

export function MobileNav({ role }: MobileNavProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const allItems = NAV_ITEMS[role] ?? [];

  const visible = allItems.slice(0, MAX_VISIBLE);
  const overflow = allItems.slice(MAX_VISIBLE);

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-40">
      <div className="flex">
        {visible.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex-1 flex flex-col items-center justify-center py-2 text-xs font-medium transition-colors",
                active ? "text-blue-600" : "text-gray-500",
              ].join(" ")}
            >
              {item.label}
            </Link>
          );
        })}

        {overflow.length > 0 && (
          <button
            onClick={() => setMoreOpen((o) => !o)}
            className="flex-1 flex flex-col items-center justify-center py-2 text-xs font-medium text-gray-500"
          >
            More
          </button>
        )}
      </div>

      {moreOpen && overflow.length > 0 && (
        <div className="border-t border-gray-200 bg-white">
          {overflow.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                className={[
                  "block px-4 py-3 text-sm font-medium border-b border-gray-100",
                  active ? "text-blue-600 bg-blue-50" : "text-gray-700",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
