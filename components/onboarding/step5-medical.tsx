"use client";

import type { Step5Answers } from "@/lib/api/onboarding";

interface Props {
  values: Step5Answers;
  onChange: (v: Step5Answers) => void;
}

const TOGGLES: { key: keyof Step5Answers; label: string; description: string }[] = [
  {
    key: "responsible_aed",
    label: "AED checks",
    description: "I verify the AED battery and readiness status",
  },
  {
    key: "responsible_first_aid",
    label: "First aid restocking",
    description: "I restock and inspect first aid kits",
  },
  {
    key: "training_room_coordination",
    label: "Training room coordination",
    description: "I coordinate with the athletic trainer on supplies/scheduling",
  },
];

export function Step5Medical({ values, onChange }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Check all that are part of your responsibilities.</p>
      {TOGGLES.map(({ key, label, description }) => (
        <label key={key} className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={values[key]}
            onChange={(e) => onChange({ ...values, [key]: e.target.checked })}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 shrink-0"
          />
          <div>
            <p className="text-sm font-medium text-gray-700">{label}</p>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        </label>
      ))}
    </div>
  );
}
