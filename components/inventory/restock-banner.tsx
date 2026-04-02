"use client";

interface RestockBannerProps {
  opponentName: string;
  onOpen: () => void;
  onDismiss: () => void;
}

export function RestockBanner({ opponentName, onOpen, onDismiss }: RestockBannerProps) {
  return (
    <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-amber-500 text-lg shrink-0">📦</span>
        <p className="text-sm text-amber-800">
          <span className="font-medium">Series vs. {opponentName} ended</span>
          {" — "}review your restock needs?
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onOpen}
          className="text-sm font-medium text-amber-700 hover:text-amber-900 underline"
        >
          Review
        </button>
        <button
          onClick={onDismiss}
          className="text-amber-400 hover:text-amber-600 text-lg leading-none"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
