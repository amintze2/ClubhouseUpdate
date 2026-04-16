"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { KeyContact } from "@/lib/types";

type FormData = { name: string; role: string; phone: string; email: string; notes: string };

const EMPTY: FormData = { name: "", role: "", phone: "", email: "", notes: "" };

interface KeyContactFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: FormData) => void;
  onDelete?: () => void;
  contact?: KeyContact | null;
}

export function KeyContactFormDialog({ open, onClose, onSave, onDelete, contact }: KeyContactFormDialogProps) {
  const [form, setForm] = useState<FormData>(EMPTY);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (open) {
      setError("");
      setConfirmDelete(false);
      setForm(contact ? {
        name: contact.name,
        role: contact.role,
        phone: contact.phone ?? "",
        email: contact.email ?? "",
        notes: contact.notes ?? "",
      } : EMPTY);
    }
  }, [open, contact]);

  function set(key: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Name is required"); return; }
    if (!form.role.trim()) { setError("Role is required"); return; }
    onSave(form);
  }

  if (confirmDelete) {
    return (
      <Dialog open={open} onClose={onClose} title="Delete Contact">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-700">
            Delete <strong>{contact?.name}</strong>? This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button type="button" variant="danger" onClick={onDelete}>Delete</Button>
          </div>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} title={contact ? "Edit Contact" : "Add Contact"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => { set("name", e.target.value); setError(""); }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
            <input
              type="text"
              value={form.role}
              onChange={(e) => { set("role", e.target.value); setError(""); }}
              placeholder="e.g. Team Trainer"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        {error && <p className="text-red-500 text-xs -mt-2">{error}</p>}

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="555-0100"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="flex justify-between pt-1">
          {contact
            ? <Button type="button" variant="danger" onClick={() => setConfirmDelete(true)}>Delete</Button>
            : <div />
          }
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit">{contact ? "Save Changes" : "Add Contact"}</Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
