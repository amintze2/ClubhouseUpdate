"use client";

import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { InventoryItem } from "@/lib/types";

interface RestockPanelProps {
  open: boolean;
  onClose: () => void;
  opponentName: string;
  items: InventoryItem[]; // pre-filtered to low/out only
  onMarkAllRestocked: () => void;
  onCopied: () => void;
}

export function RestockPanel({ open, onClose, opponentName, items, onMarkAllRestocked, onCopied }: RestockPanelProps) {
  const pricedItems = items.filter((i) => i.price_per_unit != null);
  const unpricedCount = items.length - pricedItems.length;
  const totalCost = pricedItems.reduce((sum, i) => {
    const qty = Math.max(0, i.par_level - i.current_stock);
    return sum + qty * (i.price_per_unit ?? 0);
  }, 0);

  function buildShoppingList(): string {
    const lines = items.map((i) => {
      const qty = Math.max(0, i.par_level - i.current_stock);
      const unit = i.unit ? ` ${i.unit}` : "";
      const price = i.price_per_unit != null ? ` ($${i.price_per_unit.toFixed(2)} ea)` : "";
      return `☐ ${i.item_name} — ${qty}${unit}${price}`;
    });
    const totalLine = unpricedCount > 0
      ? `Total: $${totalCost.toFixed(2)} (${unpricedCount} item${unpricedCount !== 1 ? "s" : ""} unpriced)`
      : `Total: $${totalCost.toFixed(2)}`;
    return [`Shopping List — Series vs. ${opponentName}`, ...lines, totalLine].join("\n");
  }

  async function handleCopyList() {
    try {
      await navigator.clipboard.writeText(buildShoppingList());
      onCopied();
    } catch {
      // Clipboard not available
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={`Restock — Series vs. ${opponentName}`}>
      <div className="flex flex-col gap-4">
        {/* Summary */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">{items.length} item{items.length !== 1 ? "s" : ""} needing restock</span>
          <span className="font-medium text-gray-900">
            ${totalCost.toFixed(2)}
            {unpricedCount > 0 && (
              <span className="text-gray-400 font-normal ml-1">({unpricedCount} unpriced)</span>
            )}
          </span>
        </div>

        {/* Table */}
        {items.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No items need restocking</p>
        ) : (
          <div className="border border-gray-100 rounded-lg overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-3 px-3 py-2 bg-gray-50 text-xs font-medium text-gray-500">
              <span>Item</span>
              <span className="text-right">Stock</span>
              <span className="text-right">Par</span>
              <span className="text-right">Need</span>
              <span className="text-right">Total</span>
            </div>
            <div className="divide-y divide-gray-50">
              {items.map((item) => {
                const qty = Math.max(0, item.par_level - item.current_stock);
                const lineTotal = item.price_per_unit != null ? qty * item.price_per_unit : null;
                return (
                  <div key={item.id} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-3 px-3 py-2 text-sm items-center">
                    <span className="text-gray-800 truncate">
                      {item.item_name}
                      {item.unit && <span className="text-gray-400 ml-1 text-xs">({item.unit})</span>}
                    </span>
                    <span className="text-gray-500 text-right">{item.current_stock}</span>
                    <span className="text-gray-500 text-right">{item.par_level}</span>
                    <span className="font-medium text-gray-900 text-right">{qty}</span>
                    <span className="text-gray-500 text-right">
                      {lineTotal != null ? `$${lineTotal.toFixed(2)}` : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <Button
            type="button"
            variant="secondary"
            onClick={handleCopyList}
            className="flex-1"
          >
            Copy Shopping List
          </Button>
          <Button
            type="button"
            onClick={onMarkAllRestocked}
            className="flex-1"
          >
            Mark All Restocked
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
