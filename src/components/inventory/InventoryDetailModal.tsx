"use client";

import { useState, useEffect } from "react";
import { X, Edit, Trash2, Loader2, Package, MapPin } from "lucide-react";
import type { InventoryStatus } from "./InventoryCard";

interface InventoryItem {
  id: string;
  name: string;
  description?: string | null;
  quantity: number;
  unit?: string | null;
  category?: string | null;
  location?: string | null;
  minQuantity?: number | null;
  status: InventoryStatus;
}

const STATUS_OPTIONS: { value: InventoryStatus; label: string }[] = [
  { value: "IN_STOCK", label: "In stock" },
  { value: "LOW_STOCK", label: "Low stock" },
  { value: "ORDERED", label: "Ordered" },
  { value: "DISCONTINUED", label: "Discontinued" },
];

interface Props {
  itemId: string;
  onClose: () => void;
  onEdit?: (item: InventoryItem) => void;
  onDeleted?: () => void;
  onUpdated?: () => void;
}

export function InventoryDetailModal({ itemId, onClose, onEdit, onDeleted, onUpdated }: Props) {
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchItem = async () => {
    const res = await fetch(`/api/inventory/${itemId}`);
    const data = await res.json().catch(() => null);
    setItem(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchItem();
  }, [itemId]);

  const handleStatusChange = async (newStatus: InventoryStatus) => {
    setStatusLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/inventory/${itemId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
      setItem((prev) => (prev ? { ...prev, status: newStatus } : null));
      onUpdated?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!item || !confirm(`Delete "${item.name}"?`)) return;
    const res = await fetch(`/api/inventory/${itemId}`, { method: "DELETE" });
    if (res.ok) {
      onDeleted?.();
      onClose();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to delete");
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8">
          <Loader2 className="animate-spin text-green-500" size={32} />
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-white rounded-2xl p-8 text-slate-500" onClick={(e) => e.stopPropagation()}>
          Item not found.
        </div>
      </div>
    );
  }

  const isLow = item.minQuantity != null && item.quantity <= item.minQuantity && item.status !== "DISCONTINUED";

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-slate-900 truncate pr-4">{item.name}</h2>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={() => { onEdit(item); onClose(); }}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-green-600"
                title="Edit"
                aria-label="Edit item"
              >
                <Edit size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={handleDelete}
              className="p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
              title="Delete"
              aria-label="Delete item"
            >
              <Trash2 size={16} />
            </button>
            <button type="button" onClick={onClose} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0">
              <Package size={28} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-slate-800">
                  {item.quantity}
                  {item.unit ? ` ${item.unit}` : ""}
                </span>
                {isLow && (
                  <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    Below minimum
                  </span>
                )}
              </div>
              {item.category && (
                <p className="text-sm text-slate-600 mt-0.5">{item.category}</p>
              )}
              {item.location && (
                <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                  <MapPin size={12} /> {item.location}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
            <select
              aria-label="Stock status"
              value={item.status}
              onChange={(e) => handleStatusChange(e.target.value as InventoryStatus)}
              disabled={statusLoading}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-green-400 disabled:opacity-50"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {item.minQuantity != null && (
            <p className="mt-2 text-xs text-slate-500">
              Low-stock threshold: {item.minQuantity} {item.unit ?? "units"}
            </p>
          )}

          {item.description && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-slate-500 mb-1">Description</p>
              <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
            </div>
          )}

          {error && <p className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        </div>
      </div>
    </div>
  );
}
