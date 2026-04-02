"use client";

import type { Step2Answers, LaundryFrequency } from "@/lib/api/onboarding";

interface Props {
  values: Step2Answers;
  onChange: (v: Step2Answers) => void;
}

const EQUIPMENT_OPTIONS = [
  { value: "washers", label: "Washers on-site" },
  { value: "dryers", label: "Dryers on-site" },
  { value: "dry_cleaning", label: "Dry cleaning pickup" },
];

const FREQUENCY_OPTIONS: { value: LaundryFrequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "every_other_day", label: "Every other day" },
  { value: "weekly", label: "Weekly" },
];

function toggleItem(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];
}

export function Step2Laundry({ values, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Equipment available</p>
        <div className="space-y-2">
          {EQUIPMENT_OPTIONS.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={values.equipment.includes(value)}
                onChange={() =>
                  onChange({ ...values, equipment: toggleItem(values.equipment, value) })
                }
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Uniform wash frequency
        </label>
        <select
          value={values.uniform_frequency}
          onChange={(e) =>
            onChange({ ...values, uniform_frequency: e.target.value as LaundryFrequency })
          }
          className="w-48 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {FREQUENCY_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Towel wash frequency
        </label>
        <select
          value={values.towel_frequency}
          onChange={(e) =>
            onChange({ ...values, towel_frequency: e.target.value as LaundryFrequency })
          }
          className="w-48 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {FREQUENCY_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
