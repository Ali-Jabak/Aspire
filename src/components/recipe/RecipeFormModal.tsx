"use client";

import { useState } from "react";
import { X, Loader2, Sparkles, ChefHat } from "lucide-react";
import type { RecipeSummary } from "./RecipeCard";

export type RecipeStatus = "FAVORITE" | "TO_TRY" | "MADE_BEFORE" | null;

interface RecipeFormData {
  id?: string;
  title?: string;
  description?: string | null;
  ingredients?: string | null;
  instructions?: string | null;
  prepTime?: number | null;
  cookTime?: number | null;
  servings?: number | null;
  imageUrl?: string | null;
  category?: string | null;
  cuisine?: string | null;
  status?: RecipeStatus;
}

const STATUS_OPTIONS: { value: RecipeStatus; label: string }[] = [
  { value: null, label: "—" },
  { value: "FAVORITE", label: "Favorite" },
  { value: "TO_TRY", label: "To try" },
  { value: "MADE_BEFORE", label: "Made before" },
];

interface Props {
  initial?: RecipeFormData | RecipeSummary;
  onClose: () => void;
  onSaved: () => void;
}

export function RecipeFormModal({ initial, onClose, onSaved }: Props) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    ingredients: initial?.ingredients ?? "",
    instructions: initial?.instructions ?? "",
    prepTime: initial?.prepTime?.toString() ?? "",
    cookTime: initial?.cookTime?.toString() ?? "",
    servings: initial?.servings?.toString() ?? "",
    imageUrl: initial?.imageUrl ?? "",
    category: initial?.category ?? "",
    cuisine: initial?.cuisine ?? "",
    status: (initial?.status ?? null) as RecipeStatus,
  });

  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState<"desc" | "ing" | "inst" | null>(null);
  const [error, setError] = useState("");
  const [aiError, setAiError] = useState("");

  const set =
    (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleAiDescribe = async () => {
    if (!form.title.trim()) {
      setAiError("Enter a title first.");
      return;
    }
    setAiLoading("desc");
    setAiError("");
    try {
      const res = await fetch("/api/recipe/ai/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          cuisine: form.cuisine || undefined,
          category: form.category || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForm((prev) => ({ ...prev, description: data.description }));
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "AI failed");
    } finally {
      setAiLoading(null);
    }
  };

  const handleAiIngredients = async () => {
    if (!form.title.trim()) {
      setAiError("Enter a title first.");
      return;
    }
    setAiLoading("ing");
    setAiError("");
    try {
      const res = await fetch("/api/recipe/ai/suggest-ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          cuisine: form.cuisine || undefined,
          servings: form.servings ? parseInt(form.servings) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const list = Array.isArray(data.ingredients) ? data.ingredients.join("\n") : "";
      setForm((prev) => ({ ...prev, ingredients: prev.ingredients ? prev.ingredients + "\n" + list : list }));
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "AI failed");
    } finally {
      setAiLoading(null);
    }
  };

  const handleAiInstructions = async () => {
    if (!form.title.trim()) {
      setAiError("Enter a title first.");
      return;
    }
    setAiLoading("inst");
    setAiError("");
    try {
      const res = await fetch("/api/recipe/ai/suggest-instructions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          ingredients: form.ingredients ? form.ingredients.split(/\n/).filter(Boolean) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForm((prev) => ({ ...prev, instructions: data.instructions ?? "" }));
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "AI failed");
    } finally {
      setAiLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const url = isEdit ? `/api/recipe/${initial!.id}` : "/api/recipe";
    const method = isEdit ? "PUT" : "POST";
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          prepTime: form.prepTime ? parseInt(form.prepTime) : null,
          cookTime: form.cookTime ? parseInt(form.cookTime) : null,
          servings: form.servings ? parseInt(form.servings) : null,
          status: form.status || null,
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
    "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white";
  const labelCls = "block text-xs font-medium text-slate-600 mb-1";

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="bg-orange-50 p-1.5 rounded-lg">
              <ChefHat size={16} className="text-orange-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">{isEdit ? "Edit recipe" : "Add recipe"}</h2>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={labelCls}>Name *</label>
            <input
              required
              value={form.title}
              onChange={set("title")}
              placeholder="Recipe name"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Category</label>
              <input value={form.category} onChange={set("category")} placeholder="e.g. Dessert" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Cuisine</label>
              <input value={form.cuisine} onChange={set("cuisine")} placeholder="e.g. Italian" className={inputCls} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelCls}>Description</label>
              <button
                type="button"
                onClick={handleAiDescribe}
                disabled={!!aiLoading}
                className="text-xs text-orange-600 hover:text-orange-800 font-medium flex items-center gap-1"
                aria-label="Generate description with AI"
              >
                {aiLoading === "desc" ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                {aiLoading === "desc" ? "Generating..." : "AI Generate"}
              </button>
            </div>
            {aiError && <p className="text-xs text-amber-600 mb-1">{aiError}</p>}
            <textarea
              value={form.description}
              onChange={set("description")}
              rows={2}
              className={`${inputCls} resize-none`}
              placeholder="Short description"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelCls}>Ingredients</label>
              <button
                type="button"
                onClick={handleAiIngredients}
                disabled={!!aiLoading}
                className="text-xs text-orange-600 hover:text-orange-800 font-medium flex items-center gap-1"
                aria-label="Suggest ingredients with AI"
              >
                {aiLoading === "ing" ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                {aiLoading === "ing" ? "Suggesting..." : "AI Suggest"}
              </button>
            </div>
            <textarea
              value={form.ingredients}
              onChange={set("ingredients")}
              rows={4}
              className={`${inputCls} resize-none font-mono text-xs`}
              placeholder="One per line: 2 cups flour&#10;1 tsp salt"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelCls}>Instructions</label>
              <button
                type="button"
                onClick={handleAiInstructions}
                disabled={!!aiLoading}
                className="text-xs text-orange-600 hover:text-orange-800 font-medium flex items-center gap-1"
                aria-label="Generate instructions with AI"
              >
                {aiLoading === "inst" ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                {aiLoading === "inst" ? "Generating..." : "AI Generate"}
              </button>
            </div>
            <textarea
              value={form.instructions}
              onChange={set("instructions")}
              rows={5}
              className={`${inputCls} resize-none`}
              placeholder="Step by step..."
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="recipe-prep" className={labelCls}>Prep (min)</label>
              <input id="recipe-prep" type="number" min={0} value={form.prepTime} onChange={set("prepTime")} className={inputCls} aria-label="Prep time in minutes" />
            </div>
            <div>
              <label htmlFor="recipe-cook" className={labelCls}>Cook (min)</label>
              <input id="recipe-cook" type="number" min={0} value={form.cookTime} onChange={set("cookTime")} className={inputCls} aria-label="Cook time in minutes" />
            </div>
            <div>
              <label htmlFor="recipe-servings" className={labelCls}>Servings</label>
              <input id="recipe-servings" type="number" min={0} value={form.servings} onChange={set("servings")} className={inputCls} aria-label="Number of servings" />
            </div>
          </div>

          <div>
            <label htmlFor="recipe-status" className={labelCls}>Status</label>
            <select id="recipe-status" aria-label="Recipe status" value={form.status ?? ""} onChange={(e) => setForm((p) => ({ ...p, status: (e.target.value || null) as RecipeStatus }))} className={inputCls}>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value ?? ""} value={o.value ?? ""}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Image URL</label>
            <input type="url" value={form.imageUrl} onChange={set("imageUrl")} placeholder="https://..." className={inputCls} />
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
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
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
