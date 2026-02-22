"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, ChefHat, X } from "lucide-react";
import { RecipeCard, RecipeCardSkeleton, type RecipeSummary } from "@/components/recipe/RecipeCard";
import { RecipeDetailModal } from "@/components/recipe/RecipeDetailModal";
import { RecipeFormModal } from "@/components/recipe/RecipeFormModal";

const SORT_OPTIONS = [
  { value: "createdAt", label: "Date added" },
  { value: "title", label: "Title" },
  { value: "prepTime", label: "Prep time" },
  { value: "updatedAt", label: "Last updated" },
];

export default function RecipePage() {
  const [items, setItems] = useState<RecipeSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [maxPrep, setMaxPrep] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editRecipe, setEditRecipe] = useState<RecipeSummary | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (cuisine) params.set("cuisine", cuisine);
    if (maxPrep) params.set("maxPrep", maxPrep);
    params.set("sort", sort);
    params.set("page", "1");
    params.set("limit", "24");
    const res = await fetch(`/api/recipe?${params}`);
    const data = await res.json();
    setItems(data.items ?? []);
    setTotal(data.total ?? 0);
    setPage(1);
    setLoading(false);
  }, [search, status, cuisine, maxPrep, sort]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleLoadMore = async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (cuisine) params.set("cuisine", cuisine);
    if (maxPrep) params.set("maxPrep", maxPrep);
    params.set("sort", sort);
    params.set("page", String(page + 1));
    params.set("limit", "24");
    const res = await fetch(`/api/recipe?${params}`);
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
            <ChefHat size={24} className="text-orange-600" />
            Recipes
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} recipes</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium"
        >
          <Plus size={16} />
          Add recipe
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
              placeholder="Search name, ingredients, cuisine..."
              className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm bg-slate-50 focus:ring-2 focus:ring-orange-400"
              suppressHydrationWarning
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <input
            type="text"
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
            placeholder="Cuisine"
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm w-32 bg-slate-50 focus:ring-2 focus:ring-orange-400"
          />
          <input
            type="number"
            min={0}
            value={maxPrep}
            onChange={(e) => setMaxPrep(e.target.value)}
            placeholder="Max prep (min)"
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm w-28 bg-slate-50 focus:ring-2 focus:ring-orange-400"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:ring-2 focus:ring-orange-400"
          >
            <option value="">All statuses</option>
            <option value="FAVORITE">Favorite</option>
            <option value="TO_TRY">To try</option>
            <option value="MADE_BEFORE">Made before</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:ring-2 focus:ring-orange-400"
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
            <RecipeCardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center">
          <ChefHat size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No recipes yet</p>
          <p className="text-slate-400 text-sm mt-1">Add recipes to store ingredients, instructions, and notes.</p>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="mt-6 text-orange-600 font-medium text-sm hover:underline"
          >
            Add your first recipe
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {items.map((item) => (
              <RecipeCard key={item.id} recipe={item} onClick={() => setDetailId(item.id)} />
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
        <RecipeDetailModal
          recipeId={detailId}
          onClose={() => setDetailId(null)}
          onEdit={(r) => {
            setEditRecipe(r as RecipeSummary);
            setDetailId(null);
          }}
          onDeleted={fetchItems}
          onUpdated={fetchItems}
        />
      )}
      {showAdd && <RecipeFormModal onClose={() => setShowAdd(false)} onSaved={fetchItems} />}
      {editRecipe && (
        <RecipeFormModal
          initial={editRecipe}
          onClose={() => setEditRecipe(null)}
          onSaved={() => { setEditRecipe(null); fetchItems(); }}
        />
      )}
    </div>
  );
}
