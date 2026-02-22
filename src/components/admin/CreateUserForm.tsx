"use client";

import { useState } from "react";
import { Loader2, UserPlus, BookOpen, Film, ChefHat, Package, CalendarDays } from "lucide-react";

const MODULES: { key: string; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { key: "library", label: "Library", icon: BookOpen },
  { key: "media", label: "Media", icon: Film },
  { key: "recipe", label: "Recipes", icon: ChefHat },
  { key: "inventory", label: "Inventory", icon: Package },
  { key: "event", label: "Events", icon: CalendarDays },
];

export function CreateUserForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [allowedModules, setAllowedModules] = useState<string[]>(["library", "media", "recipe", "inventory", "event"]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const toggleModule = (key: string) => {
    setAllowedModules((prev) =>
      prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          name: name.trim() || undefined,
          allowedModules,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to create user");
      setSuccess(`User ${data.email} created. They can sign in with this email and password.`);
      setEmail("");
      setPassword("");
      setName("");
      setAllowedModules(["library", "media", "recipe", "inventory", "event"]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white";
  const labelCls = "block text-sm font-medium text-slate-700 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
      <div>
        <label htmlFor="create-user-email" className={labelCls}>
          Email *
        </label>
        <input
          id="create-user-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
          className={inputCls}
          autoComplete="off"
        />
      </div>
      <div>
        <label htmlFor="create-user-password" className={labelCls}>
          Password *
        </label>
        <input
          id="create-user-password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
          className={inputCls}
          autoComplete="new-password"
        />
      </div>
      <div>
        <label htmlFor="create-user-name" className={labelCls}>
          Name (optional)
        </label>
        <input
          id="create-user-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Display name"
          className={inputCls}
        />
      </div>
      <div>
        <p className={labelCls}>Screens this user can see</p>
        <p className="text-xs text-slate-500 mb-2">
          Select which modules appear in the sidebar for this user. Dashboard is always visible.
        </p>
        <div className="flex flex-wrap gap-3">
          {MODULES.map(({ key, label, icon: Icon }) => (
            <label
              key={key}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-colors ${
                allowedModules.includes(key)
                  ? "border-indigo-500 bg-indigo-50 text-indigo-800"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
              }`}
            >
              <input
                type="checkbox"
                checked={allowedModules.includes(key)}
                onChange={() => toggleModule(key)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-400"
              />
              <Icon size={18} />
              <span className="text-sm font-medium">{label}</span>
            </label>
          ))}
        </div>
        {allowedModules.length === 0 && (
          <p className="text-xs text-amber-600 mt-1.5">Select at least one screen.</p>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>
      )}
      {success && (
        <p className="text-sm text-emerald-700 bg-emerald-50 px-4 py-2.5 rounded-xl">{success}</p>
      )}
      <button
        type="submit"
        disabled={loading || allowedModules.length === 0}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 disabled:pointer-events-none"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
        {loading ? "Creating…" : "Create user"}
      </button>
    </form>
  );
}
