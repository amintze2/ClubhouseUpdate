"use client";

import type { Step1Answers, LaundryMethod } from "@/lib/api/onboarding";

interface Props {
  values: Step1Answers;
  onChange: (v: Step1Answers) => void;
  error?: string;
}

export function Step1Facility({ values, onChange, error }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Players on roster <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          min={1}
          max={100}
          value={values.roster_size ?? ""}
          onChange={(e) =>
            onChange({ ...values, roster_size: e.target.value ? Number(e.target.value) : null })
          }
          className="w-32 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. 25"
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700">Clubhouses</p>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={values.has_home_clubhouse}
            onChange={(e) => onChange({ ...values, has_home_clubhouse: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600"
          />
          <span className="text-sm text-gray-700">I manage a home clubhouse</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={values.has_visitor_clubhouse}
            onChange={(e) => onChange({ ...values, has_visitor_clubhouse: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600"
          />
          <span className="text-sm text-gray-700">I also manage a visiting clubhouse</span>
        </label>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Laundry</p>
        <div className="space-y-2">
          {(
            [
              { value: "on_site", label: "On-site (washers/dryers in the facility)" },
              { value: "outsourced", label: "Outsourced (dry cleaning pickup/delivery)" },
            ] as { value: LaundryMethod; label: string }[]
          ).map(({ value, label }) => (
            <label key={value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="laundry_method"
                value={value}
                checked={values.laundry_method === value}
                onChange={() => onChange({ ...values, laundry_method: value })}
                className="h-4 w-4 border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
