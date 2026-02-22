"use client";

import { useState } from "react";
import { X, Loader2, Sparkles, BookOpen } from "lucide-react";

const GENRES = [
  "Fiction", "Non-Fiction", "Science Fiction", "Mystery", "Biography",
  "History", "Science", "Technology", "Self-Help", "Business", "Romance",
  "Fantasy", "Horror", "Children's", "Young Adult", "Philosophy", "Psychology",
];

interface BookFormData {
  id?: string;
  title?: string;
  author?: string;
  isbn?: string | null;
  description?: string | null;
  coverUrl?: string | null;
  genre?: string | null;
  publisher?: string | null;
  publishedYear?: number | null;
  language?: string | null;
  pageCount?: number | null;
  tags?: string[];
  totalCopies?: number;
  location?: string | null;
}

interface Props {
  initial?: BookFormData;
  onClose: () => void;
  onSaved: () => void;
}

export function BookFormModal({ initial, onClose, onSaved }: Props) {
  const isEdit = !!initial?.id;

  const [form, setForm] = useState({
    title: initial?.title ?? "",
    author: initial?.author ?? "",
    isbn: initial?.isbn ?? "",
    description: initial?.description ?? "",
    coverUrl: initial?.coverUrl ?? "",
    genre: initial?.genre ?? "",
    publisher: initial?.publisher ?? "",
    publishedYear: initial?.publishedYear?.toString() ?? "",
    language: initial?.language ?? "English",
    pageCount: initial?.pageCount?.toString() ?? "",
    tags: initial?.tags?.join(", ") ?? "",
    totalCopies: initial?.totalCopies?.toString() ?? "1",
    location: initial?.location ?? "",
  });

  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");
  const [aiError, setAiError] = useState("");

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleAiDescribe = async () => {
    if (!form.title || !form.author) {
      setAiError("Enter title and author first.");
      return;
    }
    setAiLoading(true);
    setAiError("");
    try {
      const res = await fetch("/api/library/ai/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title, author: form.author, genre: form.genre }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForm((prev) => ({ ...prev, description: data.description }));
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "AI generation failed");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const url = isEdit ? `/api/library/books/${initial!.id}` : "/api/library/books";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save book");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white placeholder:text-slate-400";
  const labelCls = "block text-xs font-medium text-slate-600 mb-1";

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-50 p-1.5 rounded-lg">
              <BookOpen size={16} className="text-indigo-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              {isEdit ? "Edit Book" : "Add New Book"}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Required fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Title <span className="text-red-500">*</span></label>
              <input required value={form.title} onChange={set("title")} placeholder="Book title" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Author <span className="text-red-500">*</span></label>
              <input required value={form.author} onChange={set("author")} placeholder="Author name" className={inputCls} />
            </div>
          </div>

          {/* Description with AI */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelCls}>Description</label>
              <button
                type="button"
                onClick={handleAiDescribe}
                disabled={aiLoading}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors disabled:opacity-50"
              >
                {aiLoading ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <Sparkles size={11} />
                )}
                {aiLoading ? "Generating..." : "AI Generate"}
              </button>
            </div>
            {aiError && (
              <p className="text-xs text-amber-600 mb-1 bg-amber-50 px-2 py-1 rounded">{aiError}</p>
            )}
            <textarea
              value={form.description}
              onChange={set("description")}
              placeholder="Enter a description or click 'AI Generate' to auto-create one"
              rows={4}
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Genre + Language */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Genre</label>
              <select value={form.genre} onChange={set("genre")} className={inputCls}>
                <option value="">Select genre...</option>
                {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Language</label>
              <input value={form.language} onChange={set("language")} placeholder="English" className={inputCls} />
            </div>
          </div>

          {/* ISBN + Publisher */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>ISBN</label>
              <input value={form.isbn} onChange={set("isbn")} placeholder="9781234567890" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Publisher</label>
              <input value={form.publisher} onChange={set("publisher")} placeholder="Publisher name" className={inputCls} />
            </div>
          </div>

          {/* Year + Pages + Copies */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Published Year</label>
              <input type="number" min="0" max="2100" value={form.publishedYear} onChange={set("publishedYear")} placeholder="2024" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Pages</label>
              <input type="number" min="1" value={form.pageCount} onChange={set("pageCount")} placeholder="300" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Total Copies <span className="text-red-500">*</span></label>
              <input type="number" required min="1" value={form.totalCopies} onChange={set("totalCopies")} className={inputCls} />
            </div>
          </div>

          {/* Tags + Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Tags <span className="text-slate-400 font-normal">(comma-separated)</span></label>
              <input value={form.tags} onChange={set("tags")} placeholder="classic, bestseller, fiction" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Shelf Location</label>
              <input value={form.location} onChange={set("location")} placeholder="A-1-3" className={inputCls} />
            </div>
          </div>

          {/* Cover URL */}
          <div>
            <label className={labelCls}>Cover Image URL <span className="text-slate-400 font-normal">(optional)</span></label>
            <input value={form.coverUrl} onChange={set("coverUrl")} placeholder="https://..." className={inputCls} />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{error}</div>
          )}

          {/* Footer */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-300 text-slate-600 hover:bg-slate-50 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? "Save Changes" : "Add Book"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
