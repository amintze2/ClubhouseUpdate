import type { SupabaseClient } from "@supabase/supabase-js";
import type { Contact, LeagueContact } from "@/lib/types";

// ============================================================
// MOCK DATA — replace with real API responses when available
// ============================================================

const MOCK_LEAGUE_CONTACTS: LeagueContact[] = [
  {
    id: 1,
    name: "Dr. Mike Gonzalez",
    role: "Head Athletic Trainer",
    category: "trainer",
    team_name: null,
    phone: "(410) 555-0191",
    email: "mgonzalez@alpb.com",
    notes: "Available 7am–7pm on game days. Reach out for any player injury concerns.",
  },
  {
    id: 2,
    name: "Ryan O'Brien",
    role: "Clubhouse Manager",
    category: "clubhouse_manager",
    team_name: "Staten Island FerryHawks",
    phone: "(718) 555-0147",
    email: "robrien@ferryHawks.com",
    notes: null,
  },
  {
    id: 3,
    name: "Dani Ortiz",
    role: "Clubhouse Manager",
    category: "clubhouse_manager",
    team_name: "Lancaster Stormers",
    phone: "(717) 555-0283",
    email: "dortiz@stormers.com",
    notes: null,
  },
  {
    id: 4,
    name: "Marcus Chen",
    role: "Clubhouse Manager",
    category: "clubhouse_manager",
    team_name: "York Revolution",
    phone: "(717) 555-0349",
    email: "mchen@yorkrev.com",
    notes: null,
  },
];

export type NewContact = Omit<Contact, "id" | "created_at">;
export type UpdateContact = Partial<Omit<Contact, "id" | "team_id" | "created_by" | "created_at">>;

export async function getContacts(
  supabase: SupabaseClient,
  teamId: number
): Promise<Contact[]> {
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("team_id", teamId)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createContact(
  supabase: SupabaseClient,
  contact: NewContact
): Promise<Contact> {
  const { data, error } = await supabase
    .from("contacts")
    .insert(contact)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateContact(
  supabase: SupabaseClient,
  id: number,
  updates: UpdateContact
): Promise<Contact> {
  const { data, error } = await supabase
    .from("contacts")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteContact(
  supabase: SupabaseClient,
  id: number
): Promise<void> {
  const { error } = await supabase
    .from("contacts")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// TODO: Replace mock data with a real API call (e.g. GET /api/league/contacts)
// once the Slugger league contacts endpoint is available.
export async function getLeagueContacts(): Promise<LeagueContact[]> {
  return MOCK_LEAGUE_CONTACTS;
}

export async function reorderContacts(
  supabase: SupabaseClient,
  contacts: Contact[]
): Promise<void> {
  // Assign sequential display_order values based on current array order
  await Promise.all(
    contacts.map((c, i) =>
      supabase.from("contacts").update({ display_order: i + 1 }).eq("id", c.id)
    )
  );
}
