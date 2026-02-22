"use client";

import { Star, Film, Music, Gamepad2 } from "lucide-react";

export type MediaStatus = "OWNED" | "WISHLIST" | "CURRENTLY_USING" | "COMPLETED";

export interface MediaSummary {
  id: string;
  title: string;
  type: string;
  creator?: string | null;
  thumbnailUrl?: string | null;
  genre?: string | null;
  rating?: number | null;
  releaseDate?: string | null;
  status: MediaStatus;
}

const TYPE_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Movie: Film,
  "TV Show": Film,
  Music: Music,
  Album: Music,
  Game: Gamepad2,
};
const TYPE_GRADIENTS: Record<string, string> = {
  Movie: "from-purple-500 to-violet-600",
  "TV Show": "from-violet-500 to-purple-600",
  Music: "from-pink-500 to-rose-600",
  Album: "from-rose-500 to-pink-600",
  Game: "from-amber-500 to-orange-600",
};

const STATUS_LABELS: Record<MediaStatus, string> = {
  OWNED: "Owned",
  WISHLIST: "Wishlist",
  CURRENTLY_USING: "Using",
  COMPLETED: "Completed",
};
const STATUS_CLASSES: Record<MediaStatus, string> = {
  OWNED: "bg-slate-100 text-slate-700",
  WISHLIST: "bg-amber-100 text-amber-700",
  CURRENTLY_USING: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
};

interface Props {
  item: MediaSummary;
  onClick: () => void;
  compact?: boolean;
}

export function MediaCard({ item, onClick, compact }: Props) {
  const Icon = TYPE_ICONS[item.type] || Film;
  const gradient = TYPE_GRADIENTS[item.type] || "from-purple-400 to-violet-500";
  const initials = item.title.slice(0, 2).toUpperCase();

  if (compact) {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-3 w-full text-left rounded-xl border border-slate-200 bg-white p-3 hover:border-purple-300 hover:shadow-sm transition-all"
      >
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
          {item.thumbnailUrl ? (
            <img src={item.thumbnailUrl} alt="" className="w-full h-full rounded-lg object-cover" />
          ) : (
            <Icon size={20} className="text-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-900 text-sm truncate">{item.title}</p>
          <p className="text-xs text-slate-500 truncate">{item.creator || item.type}</p>
        </div>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_CLASSES[item.status]}`}>
          {STATUS_LABELS[item.status]}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="flex flex-col w-full text-left bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-purple-300 transition-all overflow-hidden focus:outline-none focus:ring-2 focus:ring-purple-400"
    >
      <div className={`relative h-36 w-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
        {item.thumbnailUrl ? (
          <img src={item.thumbnailUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1">
            <span className="text-white/90 text-2xl font-bold">{initials}</span>
            <Icon size={20} className="text-white/70" />
          </div>
        )}
        <span className={`absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_CLASSES[item.status]}`}>
          {STATUS_LABELS[item.status]}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2">{item.title}</h3>
        <p className="text-xs text-slate-500 truncate mt-0.5">{item.creator || item.type}</p>
        {item.rating != null && (
          <div className="flex items-center gap-1 mt-2">
            <Star size={11} className="fill-amber-400 text-amber-400" />
            <span className="text-xs text-slate-600">{item.rating}</span>
          </div>
        )}
        {item.releaseDate && (
          <p className="text-[10px] text-slate-400 mt-1">{new Date(item.releaseDate).getFullYear()}</p>
        )}
      </div>
    </button>
  );
}

export function MediaCardSkeleton() {
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
