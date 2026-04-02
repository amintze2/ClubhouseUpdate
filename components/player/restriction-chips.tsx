"use client";

import { useState } from "react";

export const PRESET_RESTRICTIONS = [
  "Vegetarian", "Vegan", "Gluten-Free", "Nut Allergy", "Dairy-Free",
  "Halal", "Kosher", "Shellfish Allergy", "Soy Allergy", "Egg Allergy", "Low Sodium",
];

interface RestrictionChipsProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export function RestrictionChips({ value, onChange }: RestrictionChipsProps) {
  const [otherInput, setOtherInput] = useState("");

  function toggle(restriction: string) {
    if (value.includes(restriction)) {
      onChange(value.filter((r) => r !== restriction));
    } else {
      onChange([...value, restriction]);
    }
  }

  function addOther() {
    const trimmed = otherInput.trim();
    if (!trimmed || value.includes(trimmed)) return;
    onChange([...value, trimmed]);
    setOtherInput("");
  }

  function handleOtherKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") { e.preventDefault(); addOther(); }
  }

  // Split value into presets and custom
  const customRestrictions = value.filter((r) => !PRESET_RESTRICTIONS.includes(r));

  return (
    <div className="flex flex-col gap-3">
      {/* Preset chips */}
      <div className="flex flex-wrap gap-2">
        {PRESET_RESTRICTIONS.map((r) => {
          const selected = value.includes(r);
          return (
            <button
              key={r}
              type="button"
              onClick={() => toggle(r)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                selected
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
              }`}
            >
              {r}
            </button>
          );
        })}
      </div>

      {/* Selected custom chips */}
      {customRestrictions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {customRestrictions.map((r) => (
            <span key={r} className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 font-medium">
              {r}
              <button
                type="button"
                onClick={() => onChange(value.filter((x) => x !== r))}
                className="text-purple-500 hover:text-purple-800 leading-none"
                aria-label={`Remove ${r}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Other input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={otherInput}
          onChange={(e) => setOtherInput(e.target.value)}
          onKeyDown={handleOtherKeyDown}
          placeholder="Other restriction…"
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={addOther}
          disabled={!otherInput.trim()}
          className="px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 disabled:text-gray-300"
        >
          Add
        </button>
      </div>
    </div>
  );
}
