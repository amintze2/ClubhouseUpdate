"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { InventoryItem, InventoryCategory, StockStatus } from "@/lib/types";
import { deriveStockStatus } from "@/lib/api/inventory";

const CATEGORY_LABELS: Record<InventoryCategory, string> = {
  laundry_cleaning: "Laundry & Cleaning",
  hygiene_personal: "Hygiene & Personal Care",
  medical_safety: "Medical & Safety",
  equipment_field: "Equipment & Field",
  food_beverage: "Food & Beverage",
  miscellaneous: "Miscellaneous",
};

type FormData = {
  item_name: string;
  unit: string;
  par_level: string;
  current_stock: string;
  price_per_unit: string;
  purchase_link: string;
  notes: string;
};

const EMPTY_FORM: FormData = {
  item_name: "", unit: "", par_level: "0", current_stock: "0",
  price_per_unit: "", purchase_link: "", notes: "",
};

interface ItemEditDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<InventoryItem, "id" | "team_id" | "created_at">) => void;
  onDelete?: () => void;
  item?: InventoryItem | null;
  defaultCategory?: InventoryCategory;
}

export function ItemEditDialog({
  open, onClose, onSave, onDelete, item, defaultCategory = "miscellaneous",
}: ItemEditDialogProps) {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [category, setCategory] = useState<InventoryCategory>(defaultCategory);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (open) {
      setConfirmDelete(false);
      setError("");
      if (item) {
        const hasDetails = !!(item.unit || item.par_level || item.current_stock || item.price_per_unit || item.purchase_link || item.notes);
        setShowDetails(hasDetails);
        setForm({
          item_name: item.item_name,
          unit: item.unit ?? "",
          par_level: String(item.par_level),
          current_stock: String(item.current_stock),
          price_per_unit: item.price_per_unit != null ? String(item.price_per_unit) : "",
          purchase_link: item.purchase_link ?? "",
          notes: item.notes ?? "",
        });
        setCategory(item.category);
      } else {
        setForm(EMPTY_FORM);
        setCategory(defaultCategory);
        setShowDetails(false);
      }
    }
  }, [open, item, defaultCategory]);

  function set<K extends keyof FormData>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.item_name.trim()) { setError("Item name is required"); return; }

    const parLevel = parseInt(form.par_level) || 0;
    const currentStock = parseInt(form.current_stock) || 0;
    const stockStatus: StockStatus = deriveStockStatus(currentStock, parLevel);

    onSave({
      item_name: form.item_name.trim(),
      category,
      unit: form.unit.trim() || null,
      par_level: parLevel,
      current_stock: currentStock,
      stock_status: stockStatus,
      price_per_unit: form.price_per_unit ? parseFloat(form.price_per_unit) : null,
      purchase_link: form.purchase_link.trim() || null,
      notes: form.notes.trim() || null,
    });
  }

  const isEdit = !!item;

  return (
    <Dialog open={open} onClose={onClose} title={isEdit ? "Edit Item" : "Add Item"}>
      {confirmDelete ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-700">Delete <strong>{item?.item_name}</strong>? This cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button type="button" variant="danger" onClick={onDelete}>Delete</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
            <input
              type="text"
              value={form.item_name}
              onChange={(e) => { set("item_name", e.target.value); setError(""); }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as InventoryCategory)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {(Object.keys(CATEGORY_LABELS) as InventoryCategory[]).map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
          </div>

          {/* Details toggle */}
          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 self-start"
          >
            <span>{showDetails ? "▲" : "▼"}</span>
            <span>{showDetails ? "Hide details" : "Add details"} (unit, stock, price, notes)</span>
          </button>

          {showDetails && (
            <>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={form.unit}
                    onChange={(e) => set("unit", e.target.value)}
                    placeholder="e.g. bags, rolls"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={form.current_stock}
                    onChange={(e) => set("current_stock", e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Par Level</label>
                  <input
                    type="number"
                    min="0"
                    value={form.par_level}
                    onChange={(e) => set("par_level", e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price / Unit</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price_per_unit}
                    onChange={(e) => set("price_per_unit", e.target.value)}
                    placeholder="0.00"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Link</label>
                  <input
                    type="url"
                    value={form.purchase_link}
                    onChange={(e) => set("purchase_link", e.target.value)}
                    placeholder="https://..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </>
          )}

          <div className="flex justify-between pt-1">
            {isEdit ? (
              <Button type="button" variant="danger" onClick={() => setConfirmDelete(true)}>Delete</Button>
            ) : <div />}
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
              <Button type="submit">{isEdit ? "Save Changes" : "Add Item"}</Button>
            </div>
          </div>
        </form>
      )}
    </Dialog>
  );
}
