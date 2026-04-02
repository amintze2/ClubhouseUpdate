"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { createSupabaseClient } from "@/lib/supabase";
import { getContacts, createContact, updateContact, deleteContact, reorderContacts } from "@/lib/api/contacts";
import { ContactCard } from "@/components/contacts/contact-card";
import { ContactManagePanel } from "@/components/contacts/contact-manage-panel";
import type { Contact } from "@/lib/types";

export function ContactBar() {
  const { user, accessToken } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);

  const supabase = createSupabaseClient(accessToken ?? undefined);
  const isCM = user?.role === "clubhouse_manager";

  useEffect(() => {
    if (!user) return;
    getContacts(supabase, user.team_id).then(setContacts).catch(() => {});
  }, [user?.team_id, accessToken]);

  async function handleAdd(data: { contact_name: string; contact_role: string; phone: string; email: string; notes: string }) {
    if (!user) return;
    const prev = contacts;
    try {
      const created = await createContact(supabase, {
        team_id: user.team_id,
        created_by: user.id,
        display_order: contacts.length + 1,
        contact_name: data.contact_name,
        contact_role: data.contact_role,
        phone: data.phone || null,
        email: data.email || null,
        notes: data.notes || null,
      });
      setContacts((c) => [...c, created]);
    } catch {
      setContacts(prev);
    }
  }

  async function handleEdit(contact: Contact, data: { contact_name: string; contact_role: string; phone: string; email: string; notes: string }) {
    const prev = contacts;
    const updated = { ...contact, ...data, phone: data.phone || null, email: data.email || null, notes: data.notes || null };
    setContacts((c) => c.map((x) => (x.id === contact.id ? updated : x)));
    try {
      await updateContact(supabase, contact.id, {
        contact_name: data.contact_name,
        contact_role: data.contact_role,
        phone: data.phone || null,
        email: data.email || null,
        notes: data.notes || null,
      });
    } catch {
      setContacts(prev);
    }
  }

  async function handleDelete(contact: Contact) {
    const prev = contacts;
    setContacts((c) => c.filter((x) => x.id !== contact.id));
    try {
      await deleteContact(supabase, contact.id);
    } catch {
      setContacts(prev);
    }
  }

  function move(index: number, direction: 1 | -1) {
    const next = [...contacts];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setContacts(next);
    reorderContacts(supabase, next).catch(() => setContacts(contacts));
  }

  return (
    <div className="border-b border-gray-200 bg-gray-50">
      {/* Collapsed strip */}
      <div className="flex items-center px-4 py-2">
        <button
          onClick={() => { setExpanded((e) => !e); setManageOpen(false); }}
          className="flex-1 flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors text-left"
        >
          <span>Key Contacts</span>
          {contacts.length > 0 && (
            <span className="text-xs text-gray-400 font-normal">({contacts.length})</span>
          )}
          <span className="text-gray-400 ml-auto">{expanded ? "▲" : "▼"}</span>
        </button>
        {isCM && (
          <button
            onClick={() => { setExpanded(true); setManageOpen((m) => !m); }}
            className="ml-3 text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 shrink-0"
          >
            Edit Contacts
          </button>
        )}
      </div>

      {/* Expanded content */}
      {expanded && (
        <>
          {manageOpen ? (
            <ContactManagePanel
              contacts={contacts}
              onAdd={handleAdd}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onMoveUp={(i) => move(i, -1)}
              onMoveDown={(i) => move(i, 1)}
            />
          ) : (
            <div className="px-4 pb-3">
              {contacts.length === 0 ? (
                <p className="text-sm text-gray-400 py-1">
                  {isCM ? 'No contacts yet. Click "Edit Contacts" to add some.' : "No contacts on file."}
                </p>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {contacts.map((c) => (
                    <ContactCard key={c.id} contact={c} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
