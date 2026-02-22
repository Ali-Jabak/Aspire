"use client";

import { useState, useEffect } from "react";
import {
  X,
  Star,
  Calendar,
  Edit,
  Trash2,
  Loader2,
  ExternalLink,
  Film,
  Music,
  Gamepad2,
} from "lucide-react";

export type MediaStatus = "OWNED" | "WISHLIST" | "CURRENTLY_USING" | "COMPLETED";

interface MediaItem {
  id: string;
  title: string;
  type: string;
  creator?: string | null;
  description?: string | null;
  url?: string | null;
  thumbnailUrl?: string | null;
  genre?: string | null;
  rating?: number | null;
  releaseDate?: string | null;
  completedAt?: string | null;
  status: MediaStatus;
}

const STATUS_OPTIONS: { value: MediaStatus; label: string }[] = [
  { value: "WISHLIST", label: "Wishlist" },
  { value: "OWNED", label: "Owned" },
  { value: "CURRENTLY_USING", label: "Currently using" },
  { value: "COMPLETED", label: "Completed" },
];

interface Props {
  itemId: string;
  onClose: () => void;
  onEdit?: (item: MediaItem) => void;
  onDeleted?: () => void;
  onUpdated?: () => void;
}

export function MediaDetailModal({ itemId, onClose, onEdit, onDeleted, onUpdated }: Props) {
  const [item, setItem] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchItem = async () => {
    const res = await fetch(`/api/media/${itemId}`);
    const data = await res.json().catch(() => null);
    setItem(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchItem();
  }, [itemId]);

  const handleStatusChange = async (newStatus: MediaStatus) => {
    setStatusLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/media/${itemId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
      setItem((prev) => (prev ? { ...prev, status: newStatus } : null));
      onUpdated?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${item?.title}"?`)) return;
    const res = await fetch(`/api/media/${itemId}`, { method: "DELETE" });
    if (res.ok) {
      onDeleted?.();
      onClose();
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8">
          <Loader2 className="animate-spin text-purple-500" size={32} />
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-white rounded-2xl p-8 text-slate-500" onClick={(e) => e.stopPropagation()}>
          Item not found.
        </div>
      </div>
    );
  }

  const TypeIcon = item.type.includes("Movie") || item.type.includes("TV") ? Film : item.type.includes("Music") || item.type.includes("Album") ? Music : Gamepad2;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-slate-900 truncate pr-4">{item.title}</h2>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button onClick={() => { onEdit(item); onClose(); }} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-purple-600" title="Edit">
                <Edit size={16} />
              </button>
            )}
            <button onClick={handleDelete} className="p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600" title="Delete">
              <Trash2 size={16} />
            </button>
            <button onClick={onClose} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex gap-4">
            <div className="w-24 h-32 rounded-xl bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {item.thumbnailUrl ? (
                <img src={item.thumbnailUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <TypeIcon size={32} className="text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-600 font-medium">{item.creator || item.type}</p>
              {item.releaseDate && (
                <p className="text-sm text-slate-400 flex items-center gap-1 mt-1">
                  <Calendar size={12} /> {new Date(item.releaseDate).getFullYear()}
                </p>
              )}
              {item.genre && (
                <span className="inline-block mt-2 bg-purple-50 text-purple-700 text-xs px-2.5 py-1 rounded-full font-medium">
                  {item.genre}
                </span>
              )}
              {item.rating != null && (
                <div className="flex items-center gap-1 mt-2">
                  <Star size={14} className="fill-amber-400 text-amber-400" />
                  <span className="text-sm font-medium">{item.rating}/5</span>
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="mt-5">
            <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
            <select
              value={item.status}
              onChange={(e) => handleStatusChange(e.target.value as MediaStatus)}
              disabled={statusLoading}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-purple-400 disabled:opacity-50"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {item.description && (
            <div className="mt-5">
              <p className="text-xs font-semibold text-slate-500 mb-1">About</p>
              <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
            </div>
          )}

          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 font-medium"
            >
              <ExternalLink size={14} /> Open link
            </a>
          )}

          {error && <p className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        </div>
      </div>
    </div>
  );
}
