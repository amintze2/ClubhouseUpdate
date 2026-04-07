"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/toast";
import { getLeagueContacts } from "@/lib/api/contacts";
import { LeagueContactCard } from "@/components/contacts/league-contact-card";
import type { LeagueContact, LeagueContactCategory } from "@/lib/types";

const CATEGORY_LABELS: Record<LeagueContactCategory, string> = {
  trainer: "Trainers & Medical",
  clubhouse_manager: "Clubhouse Managers",
  league_office: "League Office",
  other: "Other",
};

const CATEGORY_ORDER: LeagueContactCategory[] = [
  "trainer",
  "clubhouse_manager",
  "league_office",
  "other",
];

export default function KeyContactsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [contacts, setContacts] = useState<LeagueContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    // TODO: Pass supabase client and any relevant filters once API is integrated
    getLeagueContacts()
      .then(setContacts)
      .catch(() => showToast("Failed to load contacts", "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (loading) return <div className="p-6 text-sm text-gray-400">Loading…</div>;

  const filtered = search.trim()
    ? contacts.filter((c) => {
        const q = search.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.role.toLowerCase().includes(q) ||
          (c.team_name?.toLowerCase().includes(q) ?? false)
        );
      })
    : contacts;

  const grouped = CATEGORY_ORDER.reduce<Record<LeagueContactCategory, LeagueContact[]>>(
    (acc, cat) => {
      acc[cat] = filtered.filter((c) => c.category === cat);
      return acc;
    },
    { trainer: [], clubhouse_manager: [], league_office: [], other: [] }
  );

  const hasResults = filtered.length > 0;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-lg font-semibold text-gray-900">Key Contacts</h1>
        <span className="text-xs text-gray-400 font-normal">{contacts.length} total</span>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by name, role, or team…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-5 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
      />

      {!hasResults && (
        <p className="text-sm text-gray-400 text-center py-8">No contacts match your search.</p>
      )}

      {CATEGORY_ORDER.map((cat) => {
        const items = grouped[cat];
        if (items.length === 0) return null;
        return (
          <section key={cat} className="mb-6">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {CATEGORY_LABELS[cat]}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {items.map((c) => (
                <LeagueContactCard key={c.id} contact={c} />
              ))}
            </div>
          </section>
        );
      })}

      {/* TODO: Add "Suggest a Contact" flow once backend supports CM-submitted directory entries */}
    </div>
  );
}
