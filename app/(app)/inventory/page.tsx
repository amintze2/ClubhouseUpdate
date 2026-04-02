"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/toast";
import { createSupabaseClient } from "@/lib/supabase";
import {
  getInventoryItems, createInventoryItem, updateInventoryItem,
  deleteInventoryItem, updateInventoryStatus, bulkMarkRestocked,
  getSeriesEndedYesterday,
} from "@/lib/api/inventory";
import { CategorySection } from "@/components/inventory/category-section";
import { ItemEditDialog } from "@/components/inventory/item-edit-dialog";
import { RestockBanner } from "@/components/inventory/restock-banner";
import { RestockPanel } from "@/components/inventory/restock-panel";
import type { InventoryItem, InventoryCategory, StockStatus } from "@/lib/types";

const CATEGORIES: InventoryCategory[] = [
  "laundry_cleaning", "hygiene_personal", "medical_safety",
  "equipment_field", "food_beverage", "miscellaneous",
];

export default function InventoryPage() {
  const { user, accessToken } = useAuth();
  const { showToast } = useToast();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [seriesOpponent, setSeriesOpponent] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [editCategory, setEditCategory] = useState<InventoryCategory>("miscellaneous");

  const [restockOpen, setRestockOpen] = useState(false);

  const supabase = createSupabaseClient(accessToken ?? undefined);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      getInventoryItems(supabase, user.team_id),
      getSeriesEndedYesterday(supabase, user.team_id),
    ])
      .then(([inv, opponent]) => {
        setItems(inv);
        setSeriesOpponent(opponent);
      })
      .catch(() => showToast("Failed to load inventory", "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleStatusChange(item: InventoryItem, status: StockStatus) {
    const prev = items;
    setItems((all) => all.map((i) => i.id === item.id
      ? { ...i, stock_status: status, current_stock: status === "stocked" ? i.par_level : status === "out" ? 0 : i.current_stock }
      : i
    ));
    try {
      const updated = await updateInventoryStatus(supabase, item.id, status, item.par_level);
      setItems((all) => all.map((i) => i.id === updated.id ? updated : i));
    } catch {
      setItems(prev);
      showToast("Failed to update status — try again", "error");
    }
  }

  function openAdd(category: InventoryCategory) {
    setEditItem(null);
    setEditCategory(category);
    setEditOpen(true);
  }

  function openEdit(item: InventoryItem) {
    setEditItem(item);
    setEditCategory(item.category);
    setEditOpen(true);
  }

  async function handleSave(data: Omit<InventoryItem, "id" | "team_id" | "created_at">) {
    setEditOpen(false);
    if (editItem) {
      // Update
      const prev = items;
      setItems((all) => all.map((i) => i.id === editItem.id ? { ...i, ...data } : i));
      try {
        const updated = await updateInventoryItem(supabase, editItem.id, data);
        setItems((all) => all.map((i) => i.id === updated.id ? updated : i));
      } catch {
        setItems(prev);
        showToast("Failed to save — try again", "error");
      }
    } else {
      // Create
      try {
        const created = await createInventoryItem(supabase, { ...data, team_id: user!.team_id });
        setItems((all) => [...all, created]);
      } catch {
        showToast("Failed to add item — try again", "error");
      }
    }
  }

  async function handleDelete() {
    if (!editItem) return;
    setEditOpen(false);
    const prev = items;
    setItems((all) => all.filter((i) => i.id !== editItem.id));
    try {
      await deleteInventoryItem(supabase, editItem.id);
    } catch {
      setItems(prev);
      showToast("Failed to delete — try again", "error");
    }
  }

  async function handleMarkAllRestocked() {
    setRestockOpen(false);
    const toRestock = items.filter((i) => i.stock_status !== "stocked");
    const prev = items;
    setItems((all) => all.map((i) =>
      i.stock_status !== "stocked" ? { ...i, stock_status: "stocked", current_stock: i.par_level } : i
    ));
    try {
      await bulkMarkRestocked(supabase, toRestock.map((i) => ({ id: i.id, par_level: i.par_level })));
    } catch {
      setItems(prev);
      showToast("Failed to mark restocked — try again", "error");
    }
  }

  if (loading) return <div className="p-6 text-sm text-gray-400">Loading…</div>;

  const attentionCount = items.filter((i) => i.stock_status !== "stocked").length;
  const restockItems = items.filter((i) => i.stock_status !== "stocked");
  const showBanner = seriesOpponent && !bannerDismissed;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-lg font-semibold text-gray-900">Inventory</h1>
        {attentionCount > 0 && (
          <span className="text-xs bg-red-100 text-red-600 rounded-full px-2 py-0.5 font-medium">
            {attentionCount} need{attentionCount === 1 ? "s" : ""} attention
          </span>
        )}
      </div>

      {showBanner && (
        <RestockBanner
          opponentName={seriesOpponent!}
          onOpen={() => setRestockOpen(true)}
          onDismiss={() => setBannerDismissed(true)}
        />
      )}

      {CATEGORIES.filter((cat) => {
        const catItems = items.filter((i) => i.category === cat);
        return catItems.length > 0 || true; // always show all categories so user can add
      }).map((cat) => (
        <CategorySection
          key={cat}
          category={cat}
          items={items.filter((i) => i.category === cat)}
          onStatusChange={handleStatusChange}
          onEdit={openEdit}
          onAdd={openAdd}
        />
      ))}

      <ItemEditDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
        item={editItem}
        defaultCategory={editCategory}
      />

      <RestockPanel
        open={restockOpen}
        onClose={() => setRestockOpen(false)}
        opponentName={seriesOpponent ?? "Opponent"}
        items={restockItems}
        onMarkAllRestocked={handleMarkAllRestocked}
        onCopied={() => showToast("Shopping list copied!", "success")}
      />
    </div>
  );
}
