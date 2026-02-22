"use client";

import { useState, useEffect } from "react";
import {
  X,
  Clock,
  Edit,
  Trash2,
  Loader2,
  Share2,
  Heart,
  BookOpen,
  CheckCircle,
  Copy,
  UserPlus,
  Link as LinkIcon,
} from "lucide-react";
import type { RecipeStatus } from "./RecipeCard";

interface RecipeDetail {
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
  isOwner?: boolean;
  canEdit?: boolean;
  sharedWith?: { userId: string; canEdit: boolean }[];
}

const STATUS_OPTIONS: { value: RecipeStatus; label: string }[] = [
  { value: null, label: "—" },
  { value: "FAVORITE", label: "Favorite" },
  { value: "TO_TRY", label: "To try" },
  { value: "MADE_BEFORE", label: "Made before" },
];

interface Props {
  recipeId: string;
  onClose: () => void;
  onEdit?: (recipe: RecipeDetail) => void;
  onDeleted?: () => void;
  onUpdated?: () => void;
  isOwner?: boolean;
}

export function RecipeDetailModal({ recipeId, onClose, onEdit, onDeleted, onUpdated, isOwner: isOwnerProp }: Props) {
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [shareInfo, setShareInfo] = useState<{ shareSlug: string | null; sharedWith: { userId: string; canEdit: boolean; userName?: string; userEmail?: string }[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [sharePanel, setSharePanel] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareCanEdit, setShareCanEdit] = useState(false);
  const [shareSubmitting, setShareSubmitting] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [error, setError] = useState("");

  const fetchRecipe = async () => {
    const res = await fetch(`/api/recipe/${recipeId}`);
    const data = await res.json().catch(() => null);
    setRecipe(data);
    setLoading(false);
  };

  const fetchShareInfo = async () => {
    const res = await fetch(`/api/recipe/${recipeId}/share`);
    if (res.ok) {
      const data = await res.json();
      setShareInfo({ shareSlug: data.shareSlug ?? null, sharedWith: data.sharedWith ?? [] });
    }
  };

  useEffect(() => {
    fetchRecipe();
  }, [recipeId]);

  useEffect(() => {
    if (sharePanel && recipe?.userId) fetchShareInfo();
  }, [sharePanel, recipe?.userId]);

  const handleStatusChange = async (newStatus: RecipeStatus) => {
    setStatusLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/recipe/${recipeId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus ?? "FAVORITE" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
      setRecipe((prev) => (prev ? { ...prev, status: newStatus } : null));
      onUpdated?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!recipe || !confirm(`Delete "${recipe.title}"?`)) return;
    const res = await fetch(`/api/recipe/${recipeId}`, { method: "DELETE" });
    if (res.ok) {
      onDeleted?.();
      onClose();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to delete");
    }
  };

  const handleCreateLink = async () => {
    setShareSubmitting(true);
    setShareMessage("");
    try {
      const res = await fetch(`/api/recipe/${recipeId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "link" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await fetchShareInfo();
      const url = typeof window !== "undefined" ? `${window.location.origin}/recipe/shared/${data.shareSlug}` : "";
      await navigator.clipboard.writeText(url);
      setShareMessage("Link copied to clipboard.");
    } catch (e) {
      setShareMessage(e instanceof Error ? e.message : "Failed");
    } finally {
      setShareSubmitting(false);
    }
  };

  const handleShareWithUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareEmail.trim()) return;
    setShareSubmitting(true);
    setShareMessage("");
    try {
      const res = await fetch(`/api/recipe/${recipeId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "user", email: shareEmail.trim(), canEdit: shareCanEdit }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShareEmail("");
      setShareMessage("Shared successfully.");
      await fetchShareInfo();
    } catch (e) {
      setShareMessage(e instanceof Error ? e.message : "Failed");
    } finally {
      setShareSubmitting(false);
    }
  };

  const handleRevokeLink = async () => {
    try {
      await fetch(`/api/recipe/${recipeId}/share?action=link`, { method: "DELETE" });
      await fetchShareInfo();
    } catch {
      setShareMessage("Failed to revoke link");
    }
  };

  const handleRevokeUser = async (userId: string) => {
    try {
      await fetch(`/api/recipe/${recipeId}/share?action=user&userId=${encodeURIComponent(userId)}`, { method: "DELETE" });
      await fetchShareInfo();
    } catch {
      setShareMessage("Failed to remove share");
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8">
          <Loader2 className="animate-spin text-orange-500" size={32} />
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-white rounded-2xl p-8 text-slate-500" onClick={(e) => e.stopPropagation()}>
          Recipe not found.
        </div>
      </div>
    );
  }

  const totalMins = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);
  const isOwner = isOwnerProp ?? recipe.isOwner ?? true;
  const canEdit = recipe.canEdit ?? isOwner;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-slate-900 truncate pr-4">{recipe.title}</h2>
          <div className="flex items-center gap-2">
            {isOwner && (
              <button
                type="button"
                onClick={() => setSharePanel((p) => !p)}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-orange-600"
                title="Share"
                aria-label="Share recipe"
              >
                <Share2 size={16} />
              </button>
            )}
            {canEdit && onEdit && (
              <button
                type="button"
                onClick={() => { onEdit(recipe); onClose(); }}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-orange-600"
                title="Edit"
                aria-label="Edit recipe"
              >
                <Edit size={16} />
              </button>
            )}
            {isOwner && (
              <button
                type="button"
                onClick={handleDelete}
                className="p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
                title="Delete"
                aria-label="Delete recipe"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button type="button" onClick={onClose} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex gap-4">
            <div className="w-24 h-28 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {recipe.imageUrl ? (
                <img src={recipe.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-2xl">{recipe.title.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              {(recipe.cuisine || recipe.category) && (
                <p className="text-slate-600 text-sm">
                  {[recipe.cuisine, recipe.category].filter(Boolean).join(" · ")}
                </p>
              )}
              {totalMins > 0 && (
                <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                  <Clock size={12} /> {totalMins} min total
                </p>
              )}
              {recipe.servings != null && recipe.servings > 0 && (
                <p className="text-xs text-slate-400 mt-1">{recipe.servings} servings</p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
            <select
              aria-label="Recipe status"
              value={recipe.status ?? ""}
              onChange={(e) => handleStatusChange((e.target.value || null) as RecipeStatus)}
              disabled={statusLoading}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-orange-400 disabled:opacity-50"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value ?? ""} value={o.value ?? ""}>{o.label}</option>
              ))}
            </select>
          </div>

          {recipe.description && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-slate-500 mb-1">About</p>
              <p className="text-sm text-slate-600 leading-relaxed">{recipe.description}</p>
            </div>
          )}

          {recipe.ingredients && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-slate-500 mb-1">Ingredients</p>
              <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">{recipe.ingredients}</pre>
            </div>
          )}

          {recipe.instructions && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-slate-500 mb-1">Instructions</p>
              <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">{recipe.instructions}</pre>
            </div>
          )}

          {sharePanel && isOwner && (
            <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-sm font-semibold text-slate-700 mb-3">Sharing</p>
              {shareInfo?.shareSlug ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-600 truncate">
                    {typeof window !== "undefined" ? `${window.location.origin}/recipe/shared/${shareInfo.shareSlug}` : shareInfo.shareSlug}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(typeof window !== "undefined" ? `${window.location.origin}/recipe/shared/${shareInfo.shareSlug}` : "")}
                    className="text-xs text-orange-600 hover:underline flex items-center gap-1"
                  >
                    <Copy size={12} /> Copy
                  </button>
                  <button type="button" onClick={handleRevokeLink} className="text-xs text-red-600 hover:underline">
                    Revoke link
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleCreateLink}
                  disabled={shareSubmitting}
                  className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-800 font-medium"
                >
                  {shareSubmitting ? <Loader2 size={14} className="animate-spin" /> : <LinkIcon size={14} />}
                  Create public link
                </button>
              )}
              <form onSubmit={handleShareWithUser} className="mt-3 flex flex-wrap gap-2 items-end">
                <input
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="Share with email"
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-[160px]"
                />
                <label className="flex items-center gap-1.5 text-sm text-slate-600">
                  <input type="checkbox" checked={shareCanEdit} onChange={(e) => setShareCanEdit(e.target.checked)} />
                  Can edit
                </label>
                <button
                  type="submit"
                  disabled={shareSubmitting || !shareEmail.trim()}
                  className="flex items-center gap-1 bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  <UserPlus size={14} /> Share
                </button>
              </form>
              {shareInfo?.sharedWith && shareInfo.sharedWith.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {shareInfo.sharedWith.map((s) => (
                    <li key={s.userId} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">{s.userEmail ?? s.userName ?? s.userId}</span>
                      <div className="flex items-center gap-2">
                        {s.canEdit && <span className="text-xs text-slate-500">can edit</span>}
                        <button type="button" onClick={() => handleRevokeUser(s.userId)} className="text-red-600 text-xs hover:underline">
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {shareMessage && <p className="text-xs mt-2 text-slate-600">{shareMessage}</p>}
            </div>
          )}

          {error && <p className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        </div>
      </div>
    </div>
  );
}
