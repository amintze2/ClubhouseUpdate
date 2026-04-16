"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { createSupabaseClient } from "@/lib/supabase";
import { useToast } from "@/components/ui/toast";
import {
  getKeyContacts,
  createKeyContact,
  updateKeyContact,
  deleteKeyContact,
} from "@/lib/api/contacts";
import { KeyContactFormDialog } from "@/components/contacts/key-contact-form-dialog";
import type { KeyContact } from "@/lib/types";

type FormData = { name: string; role: string; phone: string; email: string; notes: string };

export default function KeyContactsPage() {
  const { user, accessToken } = useAuth();
  const { showToast } = useToast();
  const supabase = createSupabaseClient(accessToken ?? undefined);

  const [contacts, setContacts] = useState<KeyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editContact, setEditContact] = useState<KeyContact | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getKeyContacts(supabase)
      .then(setContacts)
      .catch(() => showToast("Failed to load contacts", "error"))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, accessToken]);

  function openAdd() { setEditContact(null); setDialogOpen(true); }
  function openEdit(c: KeyContact) { setEditContact(c); setDialogOpen(true); }

  async function handleSave(data: FormData) {
    if (!user) return;
    setDialogOpen(false);
    if (editContact) {
      const prev = contacts;
      setContacts((cs) => cs.map((c) => c.id === editContact.id ? { ...c, ...data, phone: data.phone || null, email: data.email || null, notes: data.notes || null } : c));
      try {
        await updateKeyContact(supabase, editContact.id, {
          name: data.name,
          role: data.role,
          phone: data.phone || null,
          email: data.email || null,
          notes: data.notes || null,
        });
      } catch {
        setContacts(prev);
        showToast("Failed to update contact", "error");
      }
    } else {
      try {
        const created = await createKeyContact(supabase, {
          created_by: user.id,
          name: data.name,
          role: data.role,
          phone: data.phone || null,
          email: data.email || null,
          notes: data.notes || null,
        });
        setContacts((cs) => [...cs, created]);
      } catch {
        showToast("Failed to add contact", "error");
      }
    }
  }

  async function handleDelete() {
    if (!editContact) return;
    setDialogOpen(false);
    const prev = contacts;
    setContacts((cs) => cs.filter((c) => c.id !== editContact.id));
    try {
      await deleteKeyContact(supabase, editContact.id);
    } catch {
      setContacts(prev);
      showToast("Failed to delete contact", "error");
    }
  }

  if (loading) return <div className="p-6 text-sm text-gray-400">Loading…</div>;

  const filtered = search.trim()
    ? contacts.filter((c) => {
        const q = search.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.role.toLowerCase().includes(q);
      })
    : contacts;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-lg font-semibold text-gray-900">Key Contacts</h1>
        <span className="text-xs text-gray-400 font-normal">{contacts.length} total</span>
        <button
          onClick={openAdd}
          className="ml-auto text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          + Add Contact
        </button>
      </div>

      <input
        type="text"
        placeholder="Search by name or role…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-5 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
      />

      {filtered.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-8">
          {contacts.length === 0 ? 'No contacts yet. Click "+ Add Contact" to get started.' : "No contacts match your search."}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map((c) => (
          <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-4 relative group">
            <button
              onClick={() => openEdit(c)}
              className="absolute top-3 right-3 text-xs text-gray-300 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded hover:bg-gray-100"
            >
              Edit
            </button>
            <div className="mb-2">
              <p className="text-sm font-semibold text-gray-900">{c.name}</p>
              <p className="text-xs text-gray-500">{c.role}</p>
            </div>
            {c.notes && (
              <p className="text-xs text-gray-500 italic mb-2 border-l-2 border-gray-200 pl-2">
                {c.notes}
              </p>
            )}
            <div className="flex flex-col gap-1">
              {c.phone && (
                <a href={`tel:${c.phone}`} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  <span>📞</span>
                  <span>{c.phone}</span>
                </a>
              )}
              {c.email && (
                <a href={`mailto:${c.email}`} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 min-w-0">
                  <span>✉</span>
                  <span className="truncate">{c.email}</span>
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      <KeyContactFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
        contact={editContact}
      />
    </div>
  );
}
