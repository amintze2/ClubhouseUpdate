"use client";

import type { Step7Answers, KeyContact } from "@/lib/api/onboarding";

interface Props {
  values: Step7Answers;
  onChange: (v: Step7Answers) => void;
}

function ContactEntry({
  contact,
  onChange,
}: {
  contact: KeyContact;
  onChange: (c: KeyContact) => void;
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      <p className="text-sm font-semibold text-gray-700">{contact.label}</p>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Name</label>
        <input
          type="text"
          value={contact.name}
          onChange={(e) => onChange({ ...contact, name: e.target.value })}
          className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Full name"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Phone</label>
          <input
            type="tel"
            value={contact.phone}
            onChange={(e) => onChange({ ...contact, phone: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Optional"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Email</label>
          <input
            type="email"
            value={contact.email}
            onChange={(e) => onChange({ ...contact, email: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Optional"
          />
        </div>
      </div>
    </div>
  );
}

export function Step7Contacts({ values, onChange }: Props) {
  function updateContact(index: number, updated: KeyContact) {
    const next = [...values.contacts] as [KeyContact, KeyContact, KeyContact];
    next[index] = updated;
    onChange({ contacts: next });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Add key contacts to pre-populate your contact bar. All fields are optional.
      </p>
      {values.contacts.map((c, i) => (
        <ContactEntry key={c.label} contact={c} onChange={(updated) => updateContact(i, updated)} />
      ))}
    </div>
  );
}
