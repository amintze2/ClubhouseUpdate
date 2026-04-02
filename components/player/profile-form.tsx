"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RestrictionChips } from "./restriction-chips";

interface ProfileFormProps {
  initialPreferredName: string;
  initialOtherDetails: string;
  initialRestrictions: string[];
  onSave: (data: { preferred_name: string | null; other_details: string | null; restrictions: string[] }) => void;
  saving?: boolean;
}

export function ProfileForm({
  initialPreferredName,
  initialOtherDetails,
  initialRestrictions,
  onSave,
  saving = false,
}: ProfileFormProps) {
  const [preferredName, setPreferredName] = useState(initialPreferredName);
  const [otherDetails, setOtherDetails] = useState(initialOtherDetails);
  const [restrictions, setRestrictions] = useState<string[]>(initialRestrictions);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      preferred_name: preferredName.trim() || null,
      other_details: otherDetails.trim() || null,
      restrictions,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Name</label>
        <input
          type="text"
          value={preferredName}
          onChange={(e) => setPreferredName(e.target.value)}
          placeholder="How should we address you?"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Dietary Restrictions</label>
        <RestrictionChips value={restrictions} onChange={setRestrictions} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Other Details</label>
        <textarea
          value={otherDetails}
          onChange={(e) => setOtherDetails(e.target.value)}
          rows={3}
          placeholder="Anything else the clubhouse manager should know…"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save Profile"}
      </Button>
    </form>
  );
}
