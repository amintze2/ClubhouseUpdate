"use client";

import { useState } from "react";
import { ContactFormDialog } from "./contact-form-dialog";
import type { Contact } from "@/lib/types";

interface ContactManagePanelProps {
  contacts: Contact[];
  onAdd: (data: { contact_name: string; contact_role: string; phone: string; email: string; notes: string }) => void;
  onEdit: (contact: Contact, data: { contact_name: string; contact_role: string; phone: string; email: string; notes: string }) => void;
  onDelete: (contact: Contact) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

export function ContactManagePanel({
  contacts, onAdd, onEdit, onDelete, onMoveUp, onMoveDown,
}: ContactManagePanelProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);

  function openAdd() { setEditContact(null); setDialogOpen(true); }
  function openEdit(c: Contact) { setEditContact(c); setDialogOpen(true); }

  function handleSave(data: { contact_name: string; contact_role: string; phone: string; email: string; notes: string }) {
    setDialogOpen(false);
    if (editContact) {
      onEdit(editContact, data);
    } else {
      onAdd(data);
    }
  }

  function handleDelete() {
    setDialogOpen(false);
    if (editContact) onDelete(editContact);
  }

  return (
    <div className="border-t border-gray-100 bg-white px-4 py-3">
      <div className="flex flex-col gap-1 mb-3">
        {contacts.length === 0 && (
          <p className="text-sm text-gray-400 py-2">No contacts yet</p>
        )}
        {contacts.map((c, i) => (
          <div key={c.id} className="flex items-center gap-2 py-1.5">
            {/* Reorder buttons */}
            <div className="flex flex-col gap-0.5 shrink-0">
              <button
                onClick={() => onMoveUp(i)}
                disabled={i === 0}
                className="text-gray-300 hover:text-gray-600 disabled:invisible text-xs leading-none"
                aria-label="Move up"
              >▲</button>
              <button
                onClick={() => onMoveDown(i)}
                disabled={i === contacts.length - 1}
                className="text-gray-300 hover:text-gray-600 disabled:invisible text-xs leading-none"
                aria-label="Move down"
              >▼</button>
            </div>
            {/* Name + role */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{c.contact_name}</p>
              <p className="text-xs text-gray-400 truncate">{c.contact_role}</p>
            </div>
            {/* Edit button */}
            <button
              onClick={() => openEdit(c)}
              className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 shrink-0"
            >
              Edit
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={openAdd}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        + Add Contact
      </button>

      <ContactFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
        contact={editContact}
      />
    </div>
  );
}
