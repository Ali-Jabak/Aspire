"use client";

import { useState } from "react";
import { X, Loader2, Sparkles, CalendarDays } from "lucide-react";
import type { EventSummary } from "./EventCard";

interface EventFormData {
  id?: string;
  title?: string;
  description?: string | null;
  startDate?: string;
  endDate?: string | null;
  location?: string | null;
  isAllDay?: boolean;
  color?: string | null;
}

const COLOR_OPTIONS = ["#dc2626", "#ea580c", "#ca8a04", "#65a30d", "#059669", "#0891b2", "#7c3aed", "#db2777"];

interface Props {
  initial?: EventFormData | EventSummary;
  onClose: () => void;
  onSaved: () => void;
}

export function EventFormModal({ initial, onClose, onSaved }: Props) {
  const isEdit = !!initial?.id;
  const start = initial?.startDate ? new Date(initial.startDate) : new Date();
  const end = initial?.endDate ? new Date(initial.endDate) : null;
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    startDate: start.toISOString().slice(0, 16),
    endDate: end ? end.toISOString().slice(0, 16) : "",
    location: initial?.location ?? "",
    isAllDay: initial?.isAllDay ?? false,
    color: initial?.color ?? "#dc2626",
  });

  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");
  const [aiError, setAiError] = useState("");

  const set =
    (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const handleAiSuggest = async () => {
    if (!form.title.trim() && !form.description.trim()) {
      setAiError("Enter a title or some keywords first.");
      return;
    }
    setAiLoading(true);
    setAiError("");
    try {
      const res = await fetch("/api/event/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: form.title || form.description, location: form.location || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForm((prev) => ({ ...prev, title: data.title || prev.title, description: data.description || prev.description }));
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
    const url = isEdit ? `/api/event/${initial!.id}` : "/api/event";
    const method = isEdit ? "PUT" : "POST";
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
          endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
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
    "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white";
  const labelCls = "block text-xs font-medium text-slate-600 mb-1";

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={(ev) => ev.target === ev.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="bg-red-50 p-1.5 rounded-lg">
              <CalendarDays size={16} className="text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">{isEdit ? "Edit event" : "New event"}</h2>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="event-title" className={labelCls}>Title *</label>
              <button
                type="button"
                onClick={handleAiSuggest}
                disabled={aiLoading}
                className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
                aria-label="Suggest title and description with AI"
              >
                {aiLoading ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                {aiLoading ? "Suggesting…" : "AI Suggest"}
              </button>
            </div>
            {aiError && <p className="text-xs text-amber-600 mb-1">{aiError}</p>}
            <input
              id="event-title"
              required
              value={form.title}
              onChange={set("title")}
              placeholder="Event title"
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="event-desc" className={labelCls}>Description</label>
            <textarea
              id="event-desc"
              value={form.description}
              onChange={set("description")}
              rows={2}
              className={`${inputCls} resize-none`}
              placeholder="Optional description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="event-start" className={labelCls}>Start *</label>
              <input
                id="event-start"
                type="datetime-local"
                required
                value={form.startDate}
                onChange={set("startDate")}
                className={inputCls}
                aria-label="Start date and time"
              />
            </div>
            <div>
              <label htmlFor="event-end" className={labelCls}>End</label>
              <input
                id="event-end"
                type="datetime-local"
                value={form.endDate}
                onChange={set("endDate")}
                className={inputCls}
                aria-label="End date and time"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="event-allday"
              type="checkbox"
              checked={form.isAllDay}
              onChange={set("isAllDay")}
              className="rounded border-slate-300 text-red-600 focus:ring-red-400"
            />
            <label htmlFor="event-allday" className="text-sm text-slate-600">All day</label>
          </div>

          <div>
            <label htmlFor="event-location" className={labelCls}>Location</label>
            <input
              id="event-location"
              value={form.location}
              onChange={set("location")}
              placeholder="Venue or address"
              className={inputCls}
              aria-label="Event location"
            />
          </div>

          <div>
            <label className={labelCls}>Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, color: c }))}
                  className={`w-8 h-8 rounded-full border-2 ${form.color === c ? "border-slate-800 scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
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
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
