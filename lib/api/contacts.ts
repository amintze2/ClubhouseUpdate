import type { SupabaseClient } from "@supabase/supabase-js";
import type { Contact } from "@/lib/types";

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
