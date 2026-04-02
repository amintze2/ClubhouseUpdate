"use client";

import { useState } from "react";
import { useAuth, buildMockPayloadForUser } from "@/lib/auth-context";

// Seeded dev users — matches seed.sql and dev-harness.html
const DEV_USERS = [
  { slugger_user_id: "dev-cm-1", user_name: "Casey Morgan",  role: "clubhouse_manager", team_id: 1 },
  { slugger_user_id: "dev-cm-2", user_name: "Drew Rivera",   role: "clubhouse_manager", team_id: 1 },
  { slugger_user_id: "dev-gm-1", user_name: "Taylor Brooks", role: "general_manager",   team_id: 1 },
  { slugger_user_id: "dev-p-1",  user_name: "Jordan Lee",    role: "player",            team_id: 1 },
  { slugger_user_id: "dev-p-2",  user_name: "Marcus Webb",   role: "player",            team_id: 1 },
  { slugger_user_id: "dev-p-3",  user_name: "Carlos Reyes",  role: "player",            team_id: 1 },
  { slugger_user_id: "dev-cm-3", user_name: "Sam Nguyen",    role: "clubhouse_manager", team_id: 2 },
  { slugger_user_id: "dev-gm-2", user_name: "Alex Kim",      role: "general_manager",   team_id: 2 },
  { slugger_user_id: "dev-p-4",  user_name: "Tyler Moss",    role: "player",            team_id: 2 },
  { slugger_user_id: "dev-p-5",  user_name: "Dante Fuller",  role: "player",            team_id: 2 },
  { slugger_user_id: "dev-cm-4", user_name: "Morgan Hayes",  role: "clubhouse_manager", team_id: 3 },
  { slugger_user_id: "dev-gm-3", user_name: "Chris Patel",   role: "general_manager",   team_id: 3 },
  { slugger_user_id: "dev-cm-5", user_name: "Jamie Scott",   role: "clubhouse_manager", team_id: 4 },
  { slugger_user_id: "dev-gm-4", user_name: "Robin Walsh",   role: "general_manager",   team_id: 4 },
] as const;

export function DevToolbar() {
  const { user, switchDevUser } = useAuth();
  const [open, setOpen] = useState(false);

  function handleSwitch(sluggerUserId: string) {
    const devUser = DEV_USERS.find((u) => u.slugger_user_id === sluggerUserId);
    if (!devUser) return;
    setOpen(false);
    switchDevUser(buildMockPayloadForUser(devUser));
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 flex justify-center pointer-events-none">
      <div className="pointer-events-auto mb-3 bg-gray-900 text-white rounded-full shadow-xl border-2 border-yellow-400 flex items-center gap-3 px-4 py-2 text-xs">
        <span className="font-mono text-yellow-400">[DEV]</span>
        {user ? (
          <span>
            {user.user_name ?? user.slugger_user_id}
            <span className="ml-1 text-gray-400">({user.role})</span>
          </span>
        ) : (
          <span className="text-gray-400">not authenticated</span>
        )}

        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="px-2 py-0.5 rounded bg-gray-700 hover:bg-gray-600 transition-colors"
          >
            Switch ▾
          </button>

          {open && (
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 border border-gray-600 rounded-lg shadow-xl min-w-48 py-1 max-h-72 overflow-y-auto">
              {DEV_USERS.map((u) => {
                const isCurrent = user?.slugger_user_id === u.slugger_user_id;
                return (
                  <button
                    key={u.slugger_user_id}
                    onClick={() => handleSwitch(u.slugger_user_id)}
                    className={[
                      "w-full text-left px-3 py-2 hover:bg-gray-700 transition-colors",
                      isCurrent ? "text-yellow-400" : "text-gray-200",
                    ].join(" ")}
                  >
                    <div className="font-medium">{u.user_name}</div>
                    <div className="text-gray-400 text-xs">
                      {u.role} · team {u.team_id} · {u.slugger_user_id}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
