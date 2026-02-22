"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Package, X, Loader2 } from "lucide-react";
import { InventoryCard, InventoryCardSkeleton, type InventorySummary } from "@/components/inventory/InventoryCard";
import { InventoryDetailModal } from "@/components/inventory/InventoryDetailModal";
import { InventoryFormModal } from "@/components/inventory/InventoryFormModal";

const SORT_OPTIONS = [
  { value: "createdAt", label: "Date added" },
  { value: "name", label: "Name" },
  { value: "quantity", label: "Quantity" },
  { value: "updatedAt", label: "Last updated" },
];

export default function InventoryPage() {
  const [items, setItems] = useState<InventorySummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<InventorySummary | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (category) params.set("category", category);
    params.set("sort", sort);
    params.set("page", "1");
    params.set("limit", "24");
    const res = await fetch(`/api/inventory?${params}`);
    const data = await res.json();
    setItems(data.items ?? []);
    setTotal(data.total ?? 0);
    setPage(1);
    setLoading(false);
  }, [search, status, category, sort]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleLoadMore = async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (category) params.set("category", category);
    params.set("sort", sort);
    params.set("page", String(page + 1));
    params.set("limit", "24");
    const res = await fetch(`/api/inventory?${params}`);
    const data = await res.json();
    setItems((prev) => [...prev, ...(data.items ?? [])]);
    setPage((p) => p + 1);
  };

  const totalPages = Math.ceil(total / 24);
  const hasMore = page < totalPages;

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Package size={24} className="text-green-600" />
            Inventory
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} items</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium"
        >
          <Plus size={16} />
          Add item
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, category, location..."
              className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm bg-slate-50 focus:ring-2 focus:ring-green-400"
              suppressHydrationWarning
              aria-label="Search inventory"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category"
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm w-36 bg-slate-50 focus:ring-2 focus:ring-green-400"
            aria-label="Filter by category"
            suppressHydrationWarning
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:ring-2 focus:ring-green-400"
            aria-label="Filter by status"
            suppressHydrationWarning
          >
            <option value="">All statuses</option>
            <option value="IN_STOCK">In stock</option>
            <option value="LOW_STOCK">Low stock</option>
            <option value="ORDERED">Ordered</option>
            <option value="DISCONTINUED">Discontinued</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:ring-2 focus:ring-green-400"
            aria-label="Sort by"
            suppressHydrationWarning
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <InventoryCardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center">
          <Package size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No inventory items yet</p>
          <p className="text-slate-400 text-sm mt-1">Track stock, locations, and reorder points.</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="text-green-600 font-medium text-sm hover:underline"
            >
              Add your first item
            </button>
            <span className="text-slate-300">or</span>
            <button
              type="button"
              onClick={async () => {
                setSeeding(true);
                try {
                  const res = await fetch("/api/dev/seed-inventory", { method: "POST" });
                  const data = await res.json().catch(() => ({}));
                  if (res.ok) fetchItems();
                  else alert(data.error || "Failed to load demo data");
                } finally {
                  setSeeding(false);
                }
              }}
              disabled={seeding}
              className="inline-flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
            >
              {seeding ? <Loader2 size={14} className="animate-spin" /> : null}
              {seeding ? "Loading…" : "Load demo data"}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {items.map((item) => (
              <InventoryCard key={item.id} item={item} onClick={() => setDetailId(item.id)} />
            ))}
          </div>
          {hasMore && (
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={handleLoadMore}
                className="border border-slate-300 text-slate-600 hover:bg-slate-50 px-6 py-2.5 rounded-xl text-sm font-medium"
              >
                Load more
              </button>
            </div>
          )}
        </>
      )}

      {detailId && (
        <InventoryDetailModal
          itemId={detailId}
          onClose={() => setDetailId(null)}
          onEdit={(i) => { setEditItem(i as InventorySummary); setDetailId(null); }}
          onDeleted={fetchItems}
          onUpdated={fetchItems}
        />
      )}
      {showAdd && <InventoryFormModal onClose={() => setShowAdd(false)} onSaved={fetchItems} />}
      {editItem && (
        <InventoryFormModal
          initial={editItem}
          onClose={() => setEditItem(null)}
          onSaved={() => { setEditItem(null); fetchItems(); }}
        />
      )}
    </div>
  );
}
