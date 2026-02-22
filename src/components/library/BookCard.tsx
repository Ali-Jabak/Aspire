"use client";

import { Star, BookOpen, Users } from "lucide-react";

export interface BookSummary {
  id: string;
  title: string;
  author: string;
  genre?: string | null;
  coverUrl?: string | null;
  status: "AVAILABLE" | "CHECKED_OUT" | "RESERVED" | "MAINTENANCE";
  availableCopies: number;
  totalCopies: number;
  avgRating?: number | null;
  reviewCount?: number;
  publishedYear?: number | null;
  tags: string[];
}

const GENRE_GRADIENTS: Record<string, string> = {
  Fiction: "from-blue-400 to-blue-600",
  "Non-Fiction": "from-slate-400 to-slate-600",
  "Science Fiction": "from-cyan-400 to-violet-600",
  Mystery: "from-purple-400 to-purple-700",
  Biography: "from-green-400 to-emerald-600",
  History: "from-amber-400 to-orange-600",
  Science: "from-teal-400 to-cyan-600",
  Technology: "from-indigo-400 to-indigo-700",
  "Self-Help": "from-yellow-400 to-amber-500",
  Business: "from-sky-400 to-blue-600",
  Romance: "from-pink-400 to-rose-500",
  Fantasy: "from-violet-400 to-purple-600",
  Horror: "from-red-700 to-red-900",
  "Children's": "from-orange-300 to-yellow-400",
  "Young Adult": "from-fuchsia-400 to-pink-600",
  Philosophy: "from-stone-400 to-stone-600",
  Psychology: "from-emerald-400 to-teal-600",
};

const STATUS_BADGE: Record<string, { label: string; classes: string }> = {
  AVAILABLE: { label: "Available", classes: "bg-green-100 text-green-700" },
  CHECKED_OUT: { label: "Checked Out", classes: "bg-red-100 text-red-700" },
  RESERVED: { label: "Reserved", classes: "bg-yellow-100 text-yellow-700" },
  MAINTENANCE: { label: "Maintenance", classes: "bg-slate-100 text-slate-600" },
};

interface Props {
  book: BookSummary;
  onClick: () => void;
}

export function BookCard({ book, onClick }: Props) {
  const gradient = GENRE_GRADIENTS[book.genre ?? ""] ?? "from-slate-400 to-slate-600";
  const badge = STATUS_BADGE[book.status];
  const initials = book.title
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <button
      onClick={onClick}
      className="group flex flex-col w-full text-left bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200 overflow-hidden focus:outline-none focus:ring-2 focus:ring-indigo-400"
    >
      {/* Cover */}
      <div className={`relative h-40 w-full bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
        {book.coverUrl ? (
          <img src={book.coverUrl} alt={book.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1">
            <span className="text-white/80 text-3xl font-bold">{initials}</span>
            {book.genre && (
              <span className="text-white/60 text-xs">{book.genre}</span>
            )}
          </div>
        )}
        {/* Status badge */}
        <span
          className={`absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.classes}`}
        >
          {badge.label}
        </span>
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-4 gap-1">
        <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-indigo-700 transition-colors">
          {book.title}
        </h3>
        <p className="text-xs text-slate-500 truncate">{book.author}</p>

        {/* Rating */}
        {book.avgRating != null && (
          <div className="flex items-center gap-1 mt-0.5">
            <Star size={11} className="fill-amber-400 text-amber-400" />
            <span className="text-xs text-slate-600">
              {book.avgRating.toFixed(1)}
            </span>
            {book.reviewCount != null && book.reviewCount > 0 && (
              <span className="text-[10px] text-slate-400">({book.reviewCount})</span>
            )}
          </div>
        )}

        {/* Copies */}
        <div className="flex items-center gap-1 mt-auto pt-2 border-t border-slate-100">
          <Users size={11} className="text-slate-400" />
          <span className="text-[11px] text-slate-500">
            {book.availableCopies}/{book.totalCopies} copies
          </span>
          {book.publishedYear && (
            <span className="ml-auto text-[10px] text-slate-400">{book.publishedYear}</span>
          )}
        </div>
      </div>
    </button>
  );
}

export function BookCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
      <div className="h-40 bg-slate-200" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-200 rounded w-1/2" />
        <div className="h-3 bg-slate-100 rounded w-1/4 mt-2" />
      </div>
    </div>
  );
}

export function EmptyLibrary() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <div className="bg-slate-100 rounded-full p-5 mb-4">
        <BookOpen size={36} className="text-slate-400" />
      </div>
      <h3 className="text-slate-700 font-semibold mb-1">No books found</h3>
      <p className="text-slate-400 text-sm">Try adjusting your search or filters.</p>
    </div>
  );
}
