"use client";

import { useState } from "react";
import type { InventoryItem, InventoryCategory, StockStatus } from "@/lib/types";
import { ItemRow } from "./item-row";

const CATEGORY_LABELS: Record<InventoryCategory, string> = {
  laundry_cleaning: "Laundry & Cleaning",
  hygiene_personal: "Hygiene & Personal Care",
  medical_safety: "Medical & Safety",
  equipment_field: "Equipment & Field",
  food_beverage: "Food & Beverage",
  miscellaneous: "Miscellaneous",
};

interface CategorySectionProps {
  category: InventoryCategory;
  items: InventoryItem[];
  defaultOpen?: boolean;
  onStatusChange: (item: InventoryItem, status: StockStatus) => void;
  onEdit: (item: InventoryItem) => void;
  onAdd: (category: InventoryCategory) => void;
}

export function CategorySection({
  category,
  items,
  defaultOpen = true,
  onStatusChange,
  onEdit,
  onAdd,
}: CategorySectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  const attentionCount = items.filter((i) => i.stock_status !== "stocked").length;

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden mb-3">
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="text-sm font-medium text-gray-800">{CATEGORY_LABELS[category]}</span>
        <div className="flex items-center gap-2">
          {attentionCount > 0 && (
            <span className="text-xs bg-red-100 text-red-600 rounded-full px-2 py-0.5 font-medium">
              {attentionCount} need{attentionCount === 1 ? "s" : ""} attention
            </span>
          )}
          <span className="text-xs text-gray-400">{items.length} item{items.length !== 1 ? "s" : ""}</span>
          <span className="text-gray-400 text-xs">{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {/* Items */}
      {open && (
        <div>
          {items.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-400">No items yet</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onStatusChange={onStatusChange}
                  onEdit={onEdit}
                />
              ))}
            </div>
          )}
          <div className="px-4 py-2 border-t border-gray-50">
            <button
              onClick={() => onAdd(category)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              + Add item
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
