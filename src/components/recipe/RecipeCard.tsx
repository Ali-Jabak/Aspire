"use client";

import { ChefHat, Clock, Heart, BookOpen, CheckCircle } from "lucide-react";

export type RecipeStatus = "FAVORITE" | "TO_TRY" | "MADE_BEFORE" | null;

export interface RecipeSummary {
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
  status?: RecipeStatus;
  userId?: string;
}

const STATUS_LABELS: Record<string, string> = {
  FAVORITE: "Favorite",
  TO_TRY: "To try",
  MADE_BEFORE: "Made before",
};
const STATUS_CLASSES: Record<string, string> = {
  FAVORITE: "bg-rose-100 text-rose-700",
  TO_TRY: "bg-amber-100 text-amber-700",
  MADE_BEFORE: "bg-emerald-100 text-emerald-700",
};
const STATUS_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  FAVORITE: Heart,
  TO_TRY: BookOpen,
  MADE_BEFORE: CheckCircle,
};

interface Props {
  recipe: RecipeSummary;
  onClick: () => void;
}

export function RecipeCard({ recipe, onClick }: Props) {
  const totalMins = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);
  const StatusIcon = recipe.status ? STATUS_ICONS[recipe.status] : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col w-full text-left bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-orange-300 transition-all overflow-hidden focus:outline-none focus:ring-2 focus:ring-orange-400"
    >
      <div className="relative h-36 w-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
        {recipe.imageUrl ? (
          <img src={recipe.imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1">
            <span className="text-white/90 text-2xl font-bold">
              {recipe.title.slice(0, 2).toUpperCase()}
            </span>
            <ChefHat size={20} className="text-white/70" />
          </div>
        )}
        {recipe.status && (
          <span
            className={`absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${STATUS_CLASSES[recipe.status]}`}
          >
            {StatusIcon && <StatusIcon size={10} />}
            {STATUS_LABELS[recipe.status]}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2">
          {recipe.title}
        </h3>
        {(recipe.cuisine || recipe.category) && (
          <p className="text-xs text-slate-500 truncate mt-0.5">
            {[recipe.cuisine, recipe.category].filter(Boolean).join(" · ")}
          </p>
        )}
        {totalMins > 0 && (
          <div className="flex items-center gap-1 mt-2 text-xs text-slate-600">
            <Clock size={11} />
            {totalMins} min
          </div>
        )}
        {recipe.servings != null && recipe.servings > 0 && (
          <p className="text-[10px] text-slate-400 mt-1">{recipe.servings} servings</p>
        )}
      </div>
    </button>
  );
}

export function RecipeCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
      <div className="h-36 bg-slate-200" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-200 rounded w-1/2" />
      </div>
    </div>
  );
}
