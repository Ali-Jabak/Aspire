"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChefHat, Clock, Loader2, ArrowLeft } from "lucide-react";

interface SharedRecipe {
  id: string;
  title: string;
  description?: string | null;
  ingredients?: string | null;
  instructions?: string | null;
  prepTime?: number | null;
  cookTime?: number | null;
  servings?: number | null;
  imageUrl?: string | null;
  category?: string | null;
  cuisine?: string | null;
}

export default function SharedRecipePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [recipe, setRecipe] = useState<SharedRecipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/recipe/shared/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(setRecipe)
      .catch(() => setError("Recipe not found or link has been revoked."))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-orange-500" />
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <ChefHat size={48} className="text-slate-300 mb-4" />
        <p className="text-slate-600 font-medium">{error || "Recipe not found"}</p>
        <Link
          href="/"
          className="mt-4 flex items-center gap-2 text-orange-600 hover:text-orange-800 font-medium"
        >
          <ArrowLeft size={16} /> Back home
        </Link>
      </div>
    );
  }

  const totalMins = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-orange-600 text-sm font-medium mb-6"
        >
          <ArrowLeft size={16} /> Back to Aspire
        </Link>

        <article className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="relative h-48 bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
            {recipe.imageUrl ? (
              <img src={recipe.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <ChefHat size={48} className="text-white/80" />
            )}
            <div className="absolute bottom-3 left-4 right-4 flex items-center gap-2 text-white/90 text-sm">
              {recipe.cuisine && (
                <span className="bg-white/20 px-2 py-0.5 rounded-full">{recipe.cuisine}</span>
              )}
              {recipe.category && (
                <span className="bg-white/20 px-2 py-0.5 rounded-full">{recipe.category}</span>
              )}
            </div>
          </div>

          <div className="p-6">
            <h1 className="text-2xl font-bold text-slate-900">{recipe.title}</h1>
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-500">
              {totalMins > 0 && (
                <span className="flex items-center gap-1">
                  <Clock size={14} /> {totalMins} min
                </span>
              )}
              {recipe.servings != null && recipe.servings > 0 && (
                <span>{recipe.servings} servings</span>
              )}
            </div>

            {recipe.description && (
              <p className="mt-4 text-slate-600 leading-relaxed">{recipe.description}</p>
            )}

            {recipe.ingredients && (
              <div className="mt-6">
                <h2 className="text-sm font-semibold text-slate-700 mb-2">Ingredients</h2>
                <pre className="text-sm text-slate-600 whitespace-pre-wrap font-sans bg-slate-50 p-4 rounded-xl">
                  {recipe.ingredients}
                </pre>
              </div>
            )}

            {recipe.instructions && (
              <div className="mt-6">
                <h2 className="text-sm font-semibold text-slate-700 mb-2">Instructions</h2>
                <pre className="text-sm text-slate-600 whitespace-pre-wrap font-sans bg-slate-50 p-4 rounded-xl">
                  {recipe.instructions}
                </pre>
              </div>
            )}

            <p className="mt-6 text-xs text-slate-400">Shared via Aspire</p>
          </div>
        </article>
      </div>
    </div>
  );
}
