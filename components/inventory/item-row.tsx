"use client";

import type { InventoryItem, StockStatus } from "@/lib/types";

interface ItemRowProps {
  item: InventoryItem;
  onStatusChange: (item: InventoryItem, status: StockStatus) => void;
  onEdit: (item: InventoryItem) => void;
}

const STATUS_LABELS: Record<StockStatus, string> = {
  stocked: "Stocked",
  low: "Low",
  out: "Out",
};

const STATUS_COLORS: Record<StockStatus, string> = {
  stocked: "text-green-700 bg-green-50 border-green-200",
  low: "text-yellow-700 bg-yellow-50 border-yellow-200",
  out: "text-red-700 bg-red-50 border-red-200",
};

export function ItemRow({ item, onStatusChange, onEdit }: ItemRowProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {/* Status dropdown */}
      <select
        value={item.stock_status}
        onChange={(e) => onStatusChange(item, e.target.value as StockStatus)}
        className={`text-xs font-medium border rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${STATUS_COLORS[item.stock_status]}`}
      >
        {(["stocked", "low", "out"] as StockStatus[]).map((s) => (
          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
        ))}
      </select>

      {/* Item name + unit */}
      <span className="flex-1 text-sm text-gray-800 min-w-0 truncate">
        {item.item_name}
        {item.unit && <span className="text-gray-400 ml-1">({item.unit})</span>}
      </span>

      {/* Warning icons */}
      {item.stock_status === "low" && (
        <span className="text-yellow-500 text-sm" title="Low stock">⚠</span>
      )}
      {item.stock_status === "out" && (
        <span className="text-red-500 text-sm" title="Out of stock">⚠⚠</span>
      )}

      {/* Edit button */}
      <button
        onClick={() => onEdit(item)}
        className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-100 transition-colors shrink-0"
      >
        Edit
      </button>
    </div>
  );
}
