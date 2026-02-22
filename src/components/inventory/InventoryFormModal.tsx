"use client";

import { useState } from "react";
import { X, Loader2, Sparkles, Package } from "lucide-react";
import type { InventorySummary } from "./InventoryCard";

export type InventoryStatus = "IN_STOCK" | "LOW_STOCK" | "ORDERED" | "DISCONTINUED";

interface InventoryFormData {
  id?: string;
  name?: string;
  description?: string | null;
  quantity?: number;
  unit?: string | null;
  category?: string | null;
  location?: string | null;
  minQuantity?: number | null;
  status?: InventoryStatus;
}

const STATUS_OPTIONS: { value: InventoryStatus; label: string }[] = [
  { value: "IN_STOCK", label: "In stock" },
  { value: "LOW_STOCK", label: "Low stock" },
  { value: "ORDERED", label: "Ordered" },
  { value: "DISCONTINUED", label: "Discontinued" },
];

interface Props {
  initial?: InventoryFormData | InventorySummary;
  onClose: () => void;
  onSaved: () => void;
}

export function InventoryFormModal({ initial, onClose, onSaved }: Props) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    quantity: initial?.quantity?.toString() ?? "0",
    unit: initial?.unit ?? "",
    category: initial?.category ?? "",
    location: initial?.location ?? "",
    minQuantity: initial?.minQuantity?.toString() ?? "",
    status: (initial?.status ?? "IN_STOCK") as InventoryStatus,
  });

  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");
  const [aiError, setAiError] = useState("");

  const set =
    (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleAiSuggest = async () => {
    if (!form.name.trim()) {
      setAiError("Enter a name first.");
      return;
    }
    setAiLoading(true);
    setAiError("");
    try {
      const res = await fetch("/api/inventory/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, category: form.category || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForm((prev) => ({
        ...prev,
        category: data.category || prev.category,
        description: data.description || prev.description,
      }));
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "AI failed");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const url = isEdit ? `/api/inventory/${initial!.id}` : "/api/inventory";
    const method = isEdit ? "PUT" : "POST";
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          quantity: parseInt(form.quantity) || 0,
          minQuantity: form.minQuantity ? parseInt(form.minQuantity) : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to save");
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white";
  const labelCls = "block text-xs font-medium text-slate-600 mb-1";

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="bg-green-50 p-1.5 rounded-lg">
              <Package size={16} className="text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">{isEdit ? "Edit item" : "Add item"}</h2>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="inv-name" className={labelCls}>Name *</label>
            <input
              id="inv-name"
              required
              value={form.name}
              onChange={set("name")}
              placeholder="Item name"
              className={inputCls}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="inv-category" className={labelCls}>Category</label>
              <button
                type="button"
                onClick={handleAiSuggest}
                disabled={aiLoading}
                className="text-xs text-green-600 hover:text-green-800 font-medium flex items-center gap-1"
                aria-label="Suggest category and description with AI"
              >
                {aiLoading ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                {aiLoading ? "Suggesting..." : "AI Suggest"}
              </button>
            </div>
            {aiError && <p className="text-xs text-amber-600 mb-1">{aiError}</p>}
            <input
              id="inv-category"
              value={form.category}
              onChange={set("category")}
              placeholder="e.g. Office supplies"
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="inv-description" className={labelCls}>Description</label>
            <textarea
              id="inv-description"
              value={form.description}
              onChange={set("description")}
              rows={2}
              className={`${inputCls} resize-none`}
              placeholder="Optional description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="inv-quantity" className={labelCls}>Quantity</label>
              <input
                id="inv-quantity"
                type="number"
                min={0}
                value={form.quantity}
                onChange={set("quantity")}
                className={inputCls}
                aria-label="Quantity"
              />
            </div>
            <div>
              <label htmlFor="inv-unit" className={labelCls}>Unit</label>
              <input
                id="inv-unit"
                value={form.unit}
                onChange={set("unit")}
                placeholder="e.g. pcs, kg"
                className={inputCls}
                aria-label="Unit"
              />
            </div>
          </div>

          <div>
            <label htmlFor="inv-minqty" className={labelCls}>Min quantity (low-stock alert)</label>
            <input
              id="inv-minqty"
              type="number"
              min={0}
              value={form.minQuantity}
              onChange={set("minQuantity")}
              placeholder="Optional"
              className={inputCls}
              aria-label="Minimum quantity"
            />
          </div>

          <div>
            <label htmlFor="inv-location" className={labelCls}>Location</label>
            <input
              id="inv-location"
              value={form.location}
              onChange={set("location")}
              placeholder="e.g. Shelf A, Warehouse"
              className={inputCls}
              aria-label="Storage location"
            />
          </div>

          <div>
            <label htmlFor="inv-status" className={labelCls}>Status</label>
            <select
              id="inv-status"
              aria-label="Stock status"
              value={form.status}
              onChange={set("status")}
              className={inputCls}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-300 text-slate-600 hover:bg-slate-50 py-2.5 rounded-xl text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? "Save" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
