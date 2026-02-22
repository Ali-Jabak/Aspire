"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, CalendarDays, X, Loader2 } from "lucide-react";
import { EventCard, EventCardSkeleton, type EventSummary } from "@/components/event/EventCard";
import { EventDetailModal } from "@/components/event/EventDetailModal";
import { EventFormModal } from "@/components/event/EventFormModal";

const SORT_OPTIONS = [
  { value: "startDate", label: "Date" },
  { value: "title", label: "Title" },
  { value: "createdAt", label: "Created" },
];

function getMonthRange(offset: number): { from: string; to: string } {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  const from = d.toISOString().slice(0, 10);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  d.setHours(23, 59, 59, 999);
  const to = d.toISOString().slice(0, 10);
  return { from, to };
}

export default function EventPage() {
  const [items, setItems] = useState<EventSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [location, setLocation] = useState("");
  const [sort, setSort] = useState("startDate");
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editEvent, setEditEvent] = useState<EventSummary | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (location) params.set("location", location);
    params.set("sort", sort);
    params.set("page", "1");
    params.set("limit", "24");
    const res = await fetch(`/api/event?${params}`);
    const data = await res.json();
    setItems(data.items ?? []);
    setTotal(data.total ?? 0);
    setPage(1);
    setLoading(false);
  }, [search, dateFrom, dateTo, location, sort]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleLoadMore = async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (location) params.set("location", location);
    params.set("sort", sort);
    params.set("page", String(page + 1));
    params.set("limit", "24");
    const res = await fetch(`/api/event?${params}`);
    const data = await res.json();
    setItems((prev) => [...prev, ...(data.items ?? [])]);
    setPage((p) => p + 1);
  };

  const applyMonthFilter = (offset: number) => {
    const { from, to } = getMonthRange(offset);
    setDateFrom(from);
    setDateTo(to);
  };

  const totalPages = Math.ceil(total / 24);
  const hasMore = page < totalPages;

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays size={24} className="text-red-600" />
            Events
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} events</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium"
        >
          <Plus size={16} />
          New event
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
              placeholder="Search title, description, location..."
              className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm bg-slate-50 focus:ring-2 focus:ring-red-400"
              suppressHydrationWarning
              aria-label="Search events"
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
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location"
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm w-36 bg-slate-50 focus:ring-2 focus:ring-red-400"
            aria-label="Filter by location"
            suppressHydrationWarning
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => applyMonthFilter(0)}
              className="px-3 py-2 rounded-xl text-sm font-medium border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
            >
              This month
            </button>
            <button
              type="button"
              onClick={() => applyMonthFilter(1)}
              className="px-3 py-2 rounded-xl text-sm font-medium border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
            >
              Next month
            </button>
            <button
              type="button"
              onClick={() => { setDateFrom(""); setDateTo(""); }}
              className="px-3 py-2 rounded-xl text-sm font-medium border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
            >
              Clear dates
            </button>
          </div>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm w-36 bg-slate-50 focus:ring-2 focus:ring-red-400"
            aria-label="From date"
            suppressHydrationWarning
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm w-36 bg-slate-50 focus:ring-2 focus:ring-red-400"
            aria-label="To date"
            suppressHydrationWarning
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:ring-2 focus:ring-red-400"
            aria-label="Sort by"
            suppressHydrationWarning
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center">
          <CalendarDays size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No events yet</p>
          <p className="text-slate-400 text-sm mt-1">Create events and invite others to keep everyone in sync.</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="text-red-600 font-medium text-sm hover:underline"
            >
              Create your first event
            </button>
            <span className="text-slate-300">or</span>
            <button
              type="button"
              onClick={async () => {
                setSeeding(true);
                try {
                  const res = await fetch("/api/dev/seed-events", { method: "POST" });
                  const data = await res.json().catch(() => ({}));
                  if (res.ok) fetchItems();
                  else alert(data.error || "Failed to load demo data");
                } finally {
                  setSeeding(false);
                }
              }}
              disabled={seeding}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              {seeding ? <Loader2 size={14} className="animate-spin" /> : null}
              {seeding ? "Loading…" : "Load demo data"}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => (
              <EventCard key={item.id} event={item} onClick={() => setDetailId(item.id)} />
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
        <EventDetailModal
          eventId={detailId}
          onClose={() => setDetailId(null)}
          onEdit={(e) => { setEditEvent(e); setDetailId(null); }}
          onDeleted={fetchItems}
          onUpdated={fetchItems}
        />
      )}
      {showAdd && <EventFormModal onClose={() => setShowAdd(false)} onSaved={fetchItems} />}
      {editEvent && (
        <EventFormModal
          initial={editEvent}
          onClose={() => setEditEvent(null)}
          onSaved={() => { setEditEvent(null); fetchItems(); }}
        />
      )}
    </div>
  );
}
