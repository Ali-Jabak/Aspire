"use client";

import { useState } from "react";
import { X, Loader2, Sparkles, Film } from "lucide-react";

export type MediaStatus = "OWNED" | "WISHLIST" | "CURRENTLY_USING" | "COMPLETED";

const TYPES = ["Movie", "TV Show", "Music", "Album", "Podcast", "Game", "Other"];
const STATUS_OPTIONS: { value: MediaStatus; label: string }[] = [
  { value: "WISHLIST", label: "Wishlist" },
  { value: "OWNED", label: "Owned" },
  { value: "CURRENTLY_USING", label: "Currently using" },
  { value: "COMPLETED", label: "Completed" },
];

interface MediaFormData {
  id?: string;
  title?: string;
  type?: string;
  creator?: string | null;
  description?: string | null;
  url?: string | null;
  thumbnailUrl?: string | null;
  genre?: string | null;
  rating?: number | null;
  releaseDate?: string | null;
  status?: MediaStatus;
}

interface Props {
  initial?: MediaFormData;
  onClose: () => void;
  onSaved: () => void;
}

export function MediaFormModal({ initial, onClose, onSaved }: Props) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    type: initial?.type ?? "Movie",
    creator: initial?.creator ?? "",
    description: initial?.description ?? "",
    url: initial?.url ?? "",
    thumbnailUrl: initial?.thumbnailUrl ?? "",
    genre: initial?.genre ?? "",
    rating: initial?.rating?.toString() ?? "",
    releaseDate: initial?.releaseDate ? new Date(initial.releaseDate).toISOString().slice(0, 10) : "",
    status: (initial?.status ?? "OWNED") as MediaStatus,
  });

  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");
  const [aiError, setAiError] = useState("");

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleAiDescribe = async () => {
    if (!form.title) {
      setAiError("Enter a title first.");
      return;
    }
    setAiLoading(true);
    setAiError("");
    try {
      const res = await fetch("/api/media/ai/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          type: form.type,
          creator: form.creator || undefined,
          genre: form.genre || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForm((prev) => ({ ...prev, description: data.description }));
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
    const url = isEdit ? `/api/media/${initial!.id}` : "/api/media";
    const method = isEdit ? "PUT" : "POST";
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          releaseDate: form.releaseDate || null,
          rating: form.rating ? parseInt(form.rating) : null,
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

  const inputCls = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white";
  const labelCls = "block text-xs font-medium text-slate-600 mb-1";

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="bg-purple-50 p-1.5 rounded-lg">
              <Film size={16} className="text-purple-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">{isEdit ? "Edit media" : "Add media"}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={labelCls}>Title *</label>
            <input required value={form.title} onChange={set("title")} placeholder="Title" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Type *</label>
              <select value={form.type} onChange={set("type")} className={inputCls}>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Creator</label>
              <input value={form.creator} onChange={set("creator")} placeholder="Director, artist, etc." className={inputCls} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelCls}>Description</label>
              <button type="button" onClick={handleAiDescribe} disabled={aiLoading} className="text-xs text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1">
                {aiLoading ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                {aiLoading ? "Generating..." : "AI Generate"}
              </button>
            </div>
            {aiError && <p className="text-xs text-amber-600 mb-1">{aiError}</p>}
            <textarea value={form.description} onChange={set("description")} rows={3} className={`${inputCls} resize-none`} placeholder="Optional description" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Genre</label>
              <input value={form.genre} onChange={set("genre")} placeholder="e.g. Sci-Fi" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Release date</label>
              <input type="date" value={form.releaseDate} onChange={set("releaseDate")} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Rating (1-5)</label>
              <input type="number" min={1} max={5} value={form.rating} onChange={set("rating")} placeholder="Optional" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select value={form.status} onChange={set("status")} className={inputCls}>
                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Link (URL)</label>
            <input type="url" value={form.url} onChange={set("url")} placeholder="https://..." className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Cover / thumbnail URL</label>
            <input type="url" value={form.thumbnailUrl} onChange={set("thumbnailUrl")} placeholder="https://..." className={inputCls} />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-slate-300 text-slate-600 hover:bg-slate-50 py-2.5 rounded-xl text-sm font-medium">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? "Save" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
