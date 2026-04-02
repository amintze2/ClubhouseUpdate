"use client";

import type { Step4Answers } from "@/lib/api/onboarding";

interface Props {
  values: Step4Answers;
  onChange: (v: Step4Answers) => void;
}

const FIELD_PREP_OPTIONS = [
  { value: "bases_lines", label: "Set bases and chalk foul lines" },
  { value: "batting_cage", label: "Batting cage setup/maintenance" },
  { value: "bullpen", label: "Bullpen area maintenance" },
];

const EQUIP_ROOM_OPTIONS = [
  { value: "daily_org", label: "Daily organization of equipment room" },
  { value: "weekly_deep_clean", label: "Weekly deep clean of equipment room" },
];

function toggleItem(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];
}

export function Step4Field({ values, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Field prep responsibilities</p>
        <p className="text-xs text-gray-500 mb-3">Check all that apply to your role.</p>
        <div className="space-y-2">
          {FIELD_PREP_OPTIONS.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={values.field_prep.includes(value)}
                onChange={() =>
                  onChange({ ...values, field_prep: toggleItem(values.field_prep, value) })
                }
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Equipment room</p>
        <div className="space-y-2">
          {EQUIP_ROOM_OPTIONS.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={values.equipment_room.includes(value)}
                onChange={() =>
                  onChange({
                    ...values,
                    equipment_room: toggleItem(values.equipment_room, value),
                  })
                }
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
