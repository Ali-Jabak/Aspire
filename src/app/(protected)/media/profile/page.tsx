"use client";

import { useState, useEffect } from "react";
import { User, Link2, Loader2, Copy, Check, Globe, Lock } from "lucide-react";

interface Profile {
  id: string;
  slug: string;
  displayName: string | null;
  bio: string | null;
  isPublic: boolean;
}

export default function MediaProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ slug: "", displayName: "", bio: "", isPublic: false });
  const [error, setError] = useState("");
  const [origin, setOrigin] = useState("");
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    setOrigin(typeof window !== "undefined" ? window.location.origin : "");
    fetch("/api/profile")
      .then((res) => res.json())
      .then((p) => {
        setProfile(p);
        setForm({
          slug: p.slug || "",
          displayName: p.displayName || "",
          bio: p.bio || "",
          isPublic: p.isPublic ?? false,
        });
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (origin && (profile?.slug || form.slug)) {
      setShareUrl(`${origin}/profile/${profile?.slug || form.slug}`);
    } else {
      setShareUrl("");
    }
  }, [origin, profile?.slug, form.slug]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProfile(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-purple-50 p-2 rounded-xl">
          <User size={20} className="text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Share your collection</h1>
          <p className="text-sm text-slate-500">Create a public profile so others can see your media.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Profile URL</label>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-sm">{origin || "..."}/profile/</span>
            <input
              value={form.slug}
              onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
              placeholder="your-name"
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400"
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">Letters, numbers, and hyphens only. Must be unique.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Display name</label>
          <input
            value={form.displayName}
            onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))}
            placeholder="Your name"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Bio (optional)</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
            rows={3}
            placeholder="A short bio..."
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 resize-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setForm((p) => ({ ...p, isPublic: !p.isPublic }))}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${form.isPublic ? "bg-purple-600" : "bg-slate-200"}`}
          >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${form.isPublic ? "translate-x-5" : "translate-x-1"}`} />
          </button>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            {form.isPublic ? <Globe size={16} /> : <Lock size={16} />}
            {form.isPublic ? "Profile is public (anyone with the link can view)" : "Profile is private"}
          </div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          Save profile
        </button>
      </form>

      {profile && (
        <div className="mt-8 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <p className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
            <Link2 size={12} /> Share link
          </p>
          <div className="flex items-center gap-2">
            <input readOnly value={shareUrl} className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600" suppressHydrationWarning />
            <button
              type="button"
              onClick={copyLink}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          {!form.isPublic && (
            <p className="text-xs text-amber-600 mt-2">Turn profile public above for the link to work.</p>
          )}
        </div>
      )}
    </div>
  );
}
