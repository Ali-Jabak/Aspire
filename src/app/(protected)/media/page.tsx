"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Search, Film, X, Loader2 } from "lucide-react";
import { MediaCard, MediaCardSkeleton, type MediaSummary } from "@/components/media/MediaCard";
import { MediaDetailModal } from "@/components/media/MediaDetailModal";
import { MediaFormModal } from "@/components/media/MediaFormModal";

const TYPES = ["Movie", "TV Show", "Music", "Album", "Game", "Other"];
const SORT_OPTIONS = [
  { value: "createdAt", label: "Date added" },
  { value: "title", label: "Title" },
  { value: "releaseDate", label: "Release date" },
  { value: "rating", label: "Rating" },
];

export default function MediaPage() {
  const searchParams = useSearchParams();
  const typeFromUrl = searchParams.get("type") || "";
  const statusFromUrl = searchParams.get("status") || "";

  const [items, setItems] = useState<MediaSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [type, setType] = useState(typeFromUrl);
  const [status, setStatus] = useState(statusFromUrl);
  const [sort, setSort] = useState("createdAt");
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<MediaSummary | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (type) params.set("type", type);
    if (status) params.set("status", status);
    params.set("sort", sort);
    params.set("page", "1");
    params.set("limit", "24");
    const res = await fetch(`/api/media?${params}`);
    const data = await res.json();
    setItems(data.items || []);
    setTotal(data.total || 0);
    setStats(data.stats || {});
    setPage(1);
    setLoading(false);
  }, [search, type, status, sort]);

  useEffect(() => {
    setType(typeFromUrl);
    setStatus(statusFromUrl);
  }, [typeFromUrl, statusFromUrl]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleLoadMore = async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (type) params.set("type", type);
    if (status) params.set("status", status);
    params.set("sort", sort);
    params.set("page", String(page + 1));
    params.set("limit", "24");
    const res = await fetch(`/api/media?${params}`);
    const data = await res.json();
    setItems((prev) => [...prev, ...(data.items || [])]);
    setPage((p) => p + 1);
  };

  const totalPages = Math.ceil(total / 24);
  const hasMore = page < totalPages;

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Film size={24} className="text-purple-600" />
            Media
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} items</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium"
        >
          <Plus size={16} />
          Add
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
              placeholder="Search title, creator, genre..."
              className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm bg-slate-50 focus:ring-2 focus:ring-purple-400"
              suppressHydrationWarning
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <X size={14} />
              </button>
            )}
          </div>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:ring-2 focus:ring-purple-400"
          >
            <option value="">All types</option>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:ring-2 focus:ring-purple-400"
          >
            <option value="">All statuses</option>
            <option value="OWNED">Owned</option>
            <option value="WISHLIST">Wishlist</option>
            <option value="CURRENTLY_USING">Using</option>
            <option value="COMPLETED">Completed</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:ring-2 focus:ring-purple-400"
          >
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <MediaCardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center">
          <Film size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No media yet</p>
          <p className="text-slate-400 text-sm mt-1">Add movies, music, or games to get started.</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setShowAdd(true)}
              className="text-purple-600 font-medium text-sm hover:underline"
            >
              Add your first item
            </button>
            <span className="text-slate-300">or</span>
            <button
              onClick={async () => {
                setSeeding(true);
                try {
                  const res = await fetch("/api/dev/seed-media", { method: "POST" });
                  const data = await res.json().catch(() => ({}));
                  if (res.ok) fetchItems();
                  else alert(data.error || "Failed to load demo data");
                } finally {
                  setSeeding(false);
                }
              }}
              disabled={seeding}
              className="inline-flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100 disabled:opacity-50"
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
              <MediaCard key={item.id} item={item} onClick={() => setDetailId(item.id)} />
            ))}
          </div>
          {hasMore && (
            <div className="mt-8 text-center">
              <button
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
        <MediaDetailModal
          itemId={detailId}
          onClose={() => setDetailId(null)}
          onEdit={(item) => { setEditItem(item as MediaSummary); setDetailId(null); }}
          onDeleted={fetchItems}
          onUpdated={fetchItems}
        />
      )}
      {showAdd && <MediaFormModal onClose={() => setShowAdd(false)} onSaved={fetchItems} />}
      {editItem && (
        <MediaFormModal
          initial={editItem}
          onClose={() => setEditItem(null)}
          onSaved={fetchItems}
        />
      )}
    </div>
  );
}
