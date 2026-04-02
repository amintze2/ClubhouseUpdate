"use client";

import type { Step3Answers, FoodPrepMethod } from "@/lib/api/onboarding";

interface Props {
  values: Step3Answers;
  onChange: (v: Step3Answers) => void;
}

const PREP_OPTIONS: { value: FoodPrepMethod; label: string }[] = [
  { value: "in_house", label: "In-house (we prepare food ourselves)" },
  { value: "vendor", label: "Vendor orders (we order from restaurants/caterers)" },
  { value: "both", label: "Both" },
];

const MEAL_OPTIONS = [
  { value: "pre_game_snacks", label: "Pre-game snacks" },
  { value: "post_game_meals", label: "Post-game meals" },
];

function toggleItem(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];
}

export function Step3Food({ values, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">How is food prepared?</p>
        <div className="space-y-2">
          {PREP_OPTIONS.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="food_prep"
                value={value}
                checked={values.food_prep === value}
                onChange={() => onChange({ ...values, food_prep: value })}
                className="h-4 w-4 border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="food_prep"
              value=""
              checked={values.food_prep === null}
              onChange={() => onChange({ ...values, food_prep: null })}
              className="h-4 w-4 border-gray-300 text-blue-600"
            />
            <span className="text-sm text-gray-700">We don't handle food</span>
          </label>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Meals provided</p>
        <div className="space-y-2">
          {MEAL_OPTIONS.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={values.meals_provided.includes(value)}
                onChange={() =>
                  onChange({ ...values, meals_provided: toggleItem(values.meals_provided, value) })
                }
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={values.has_coffee_station}
            onChange={(e) => onChange({ ...values, has_coffee_station: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600"
          />
          <span className="text-sm font-medium text-gray-700">
            I manage a coffee/drink station
          </span>
        </label>
      </div>
    </div>
  );
}
