"use client";

import { useState, useEffect } from "react";
import { Sparkles, Loader2, Film } from "lucide-react";

export default function MediaAIPage() {
  const [data, setData] = useState<{ reasoning: string; topGenres: string[]; topTypes: string[]; totalItems: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/media/ai/recommend")
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-gradient-to-br from-purple-500 to-violet-600 p-2.5 rounded-xl">
          <Sparkles size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AI Picks</h1>
          <p className="text-sm text-slate-500">Insights from your collection</p>
        </div>
      </div>

      {data && (
        <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-2xl p-6">
          <p className="text-sm font-semibold text-purple-800 mb-2">Recommendation</p>
          <p className="text-slate-700 leading-relaxed">{data.reasoning}</p>
          {(data.topGenres.length > 0 || data.topTypes.length > 0) && (
            <div className="flex flex-wrap gap-2 mt-4">
              {data.topTypes.map((t) => (
                <span key={t} className="bg-purple-100 text-purple-700 text-xs px-2.5 py-1 rounded-full font-medium">
                  {t}
                </span>
              ))}
              {data.topGenres.map((g) => (
                <span key={g} className="bg-violet-100 text-violet-700 text-xs px-2.5 py-1 rounded-full font-medium">
                  {g}
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-slate-500 mt-4">You have {data.totalItems} items in your collection.</p>
        </div>
      )}

      {data?.totalItems === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Film size={36} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Add media to get AI insights</p>
          <p className="text-slate-400 text-sm mt-1">We'll suggest similar titles and summarize your taste.</p>
        </div>
      )}
    </div>
  );
}
