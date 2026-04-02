"use client";

import type { Step6Answers, TeardownDuration } from "@/lib/api/onboarding";

interface Props {
  values: Step6Answers;
  onChange: (v: Step6Answers) => void;
}

const TEARDOWN_OPTIONS: { value: TeardownDuration; label: string }[] = [
  { value: "under_30", label: "Under 30 minutes" },
  { value: "30_to_60", label: "30–60 minutes" },
  { value: "over_60", label: "Over 60 minutes" },
];

export function Step6GameDay({ values, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Typical arrival before game time
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={12}
            value={values.arrival_hours_before ?? ""}
            onChange={(e) =>
              onChange({
                ...values,
                arrival_hours_before: e.target.value ? Number(e.target.value) : null,
              })
            }
            className="w-20 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="3"
          />
          <span className="text-sm text-gray-600">hours before first pitch</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Post-game teardown time
        </label>
        <select
          value={values.teardown_duration ?? ""}
          onChange={(e) =>
            onChange({
              ...values,
              teardown_duration: (e.target.value as TeardownDuration) || null,
            })
          }
          className="w-48 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select…</option>
          {TEARDOWN_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Other game-day notes{" "}
          <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={values.game_day_notes}
          onChange={(e) => onChange({ ...values, game_day_notes: e.target.value })}
          rows={3}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Anything else about your game-day routine…"
        />
      </div>
    </div>
  );
}
