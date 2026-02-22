"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Film, User, Loader2, ArrowLeft } from "lucide-react";
import { MediaCard } from "@/components/media/MediaCard";
import type { MediaSummary } from "@/components/media/MediaCard";

interface ProfileData {
  profile: { slug: string; displayName: string; bio: string | null; userImage: string | null };
  items: MediaSummary[];
}

export default function PublicProfilePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/media/profile/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Profile not found");
        return res.json();
      })
      .then(setData)
      .catch(() => setError("Profile not found or not public"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-purple-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-slate-600 font-medium">{error || "Profile not found"}</p>
          <p className="text-slate-400 text-sm mt-1">This profile may be private or the link is invalid.</p>
          <Link href="/login" className="mt-4 inline-flex items-center gap-2 text-purple-600 font-medium text-sm">
            <ArrowLeft size={14} /> Go to login
          </Link>
        </div>
      </div>
    );
  }

  const { profile, items } = data;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {profile.userImage ? (
                <img src={profile.userImage} alt="" className="w-full h-full object-cover" />
              ) : (
                <User size={28} className="text-purple-600" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{profile.displayName || "Media collection"}</h1>
              {profile.bio && <p className="text-slate-600 mt-1 text-sm">{profile.bio}</p>}
              <p className="text-slate-400 text-sm mt-2">{items.length} items in collection</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Film size={18} className="text-purple-600" />
          <h2 className="text-lg font-semibold text-slate-800">Collection</h2>
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-slate-500">No media shared yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => (
              <MediaCard key={item.id} item={item} onClick={() => {}} compact />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
