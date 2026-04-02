"use client";

import { Button } from "@/components/ui/button";

const STEP_NAMES = [
  "Facility Basics",
  "Laundry & Cleaning",
  "Food & Meals",
  "Field & Equipment",
  "Medical & Safety",
  "Game-Day Specifics",
  "Key Contacts",
];

interface Props {
  step: number; // 0-indexed
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  onFinish: () => void;
  submitting: boolean;
  children: React.ReactNode;
}

export function WizardShell({
  step,
  totalSteps,
  onBack,
  onNext,
  onFinish,
  submitting,
  children,
}: Props) {
  const isFirst = step === 0;
  const isLast = step === totalSteps - 1;
  const stepName = STEP_NAMES[step] ?? "";

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center pt-12 px-4">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">
              Step {step + 1} of {totalSteps}
            </p>
            <p className="text-xs text-gray-400">{Math.round(((step + 1) / totalSteps) * 100)}%</p>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
            />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">{stepName}</h2>
        </div>

        {/* Content */}
        <div className="px-6 py-6">{children}</div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-between gap-3">
          <Button
            variant="secondary"
            onClick={onBack}
            disabled={isFirst || submitting}
            className="w-24"
          >
            Back
          </Button>
          {isLast ? (
            <Button onClick={onFinish} disabled={submitting} className="flex-1">
              {submitting ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  Setting up…
                </span>
              ) : (
                "Finish Setup"
              )}
            </Button>
          ) : (
            <Button onClick={onNext} disabled={submitting} className="flex-1">
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
