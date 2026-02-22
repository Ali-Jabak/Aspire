"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Sparkles, BookOpen, Star, Loader2, RefreshCw,
  Brain, Zap, TrendingUp,
} from "lucide-react";
import { BookDetailModal } from "@/components/library/BookDetailModal";

interface BookRec {
  id: string;
  title: string;
  author: string;
  genre?: string | null;
  availableCopies: number;
  totalCopies: number;
  status: "AVAILABLE" | "CHECKED_OUT" | "RESERVED" | "MAINTENANCE";
  avgRating?: number | null;
  publishedYear?: number | null;
  tags: string[];
}

interface RecResponse {
  recommendations: BookRec[];
  reasoning: string;
  topGenres: string[];
  hasHistory: boolean;
}

function StarDisplay({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={12}
          className={s <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-slate-200"}
        />
      ))}
    </div>
  );
}

export default function AIPicsPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";
  const userRole = session?.user?.role ?? "USER";

  const [data, setData] = useState<RecResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailBookId, setDetailBookId] = useState<string | null>(null);

  const fetchRecs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/library/ai/recommend");
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecs(); }, []);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-2.5 rounded-xl shadow-sm">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">AI Book Picks</h1>
            <p className="text-sm text-slate-500 mt-0.5">Personalized recommendations just for you</p>
          </div>
        </div>
        <button
          onClick={fetchRecs}
          disabled={loading}
          className="flex items-center gap-2 border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { icon: Brain, title: "Analyzes Your History", desc: "Reviews your past checkouts and ratings to understand your taste", color: "text-violet-600", bg: "bg-violet-50" },
          { icon: TrendingUp, title: "Finds Patterns", desc: "Identifies your favorite genres, authors, and themes", color: "text-indigo-600", bg: "bg-indigo-50" },
          { icon: Zap, title: "Smart Matching", desc: "Matches you with available books you haven't read yet", color: "text-amber-600", bg: "bg-amber-50" },
        ].map(({ icon: Icon, title, desc, color, bg }) => (
          <div key={title} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className={`inline-flex p-2 rounded-lg mb-3 ${bg}`}>
              <Icon size={16} className={color} />
            </div>
            <p className="text-sm font-semibold text-slate-800 mb-1">{title}</p>
            <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 text-center">
          <Loader2 size={32} className="animate-spin text-violet-500 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Analyzing your reading preferences...</p>
        </div>
      ) : data ? (
        <div>
          {/* AI Reasoning */}
          <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-2xl p-5 mb-6">
            <div className="flex items-start gap-3">
              <div className="bg-violet-100 p-1.5 rounded-lg mt-0.5">
                <Sparkles size={14} className="text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-violet-800 mb-1">Why these books?</p>
                <p className="text-sm text-violet-700 leading-relaxed">{data.reasoning}</p>
                {data.topGenres.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {data.topGenres.map((g) => (
                      <span key={g} className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">
                        {g}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {!data.hasHistory && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 text-xs text-amber-700 flex items-center gap-2">
              <BookOpen size={13} />
              Check out some books to get personalized recommendations based on your taste!
            </div>
          )}

          {/* Recommendations grid */}
          {data.recommendations.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
              <BookOpen size={32} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No recommendations available right now.</p>
              <p className="text-slate-400 text-xs mt-1">Check back after checking out some books!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.recommendations.map((book, idx) => (
                <button
                  key={book.id}
                  onClick={() => setDetailBookId(book.id)}
                  className="group text-left bg-white rounded-2xl border border-slate-200 hover:border-violet-300 hover:shadow-md transition-all overflow-hidden focus:outline-none focus:ring-2 focus:ring-violet-400"
                >
                  {/* Rank badge + gradient header */}
                  <div className="bg-gradient-to-br from-violet-400 to-indigo-500 h-24 flex items-end px-4 pb-3 relative">
                    <span className="absolute top-3 right-3 bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="text-white font-bold leading-snug line-clamp-2 text-sm">{book.title}</p>
                      <p className="text-white/80 text-xs">{book.author}</p>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      {book.genre && (
                        <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                          {book.genre}
                        </span>
                      )}
                      {book.avgRating != null && (
                        <div className="flex items-center gap-1">
                          <StarDisplay value={book.avgRating} />
                          <span className="text-xs text-slate-500">{book.avgRating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        book.status === "AVAILABLE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {book.availableCopies}/{book.totalCopies} available
                      </span>
                      <span className="text-xs text-indigo-600 font-medium group-hover:underline">
                        View details →
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {detailBookId && (
        <BookDetailModal
          bookId={detailBookId}
          userRole={userRole}
          userId={userId}
          onClose={() => setDetailBookId(null)}
          onCheckoutChange={fetchRecs}
        />
      )}
    </div>
  );
}
