import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  BookOpen,
  Film,
  ChefHat,
  Package,
  CalendarDays,
  User,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

async function getDashboardStats(userId: string) {
  const [books, media, recipes, inventory, events] = await Promise.all([
    db.book.count({ where: { userId } }),
    db.mediaItem.count({ where: { userId } }),
    db.recipe.count({ where: { userId } }),
    db.inventoryItem.count({ where: { userId } }),
    db.event.count({ where: { userId } }),
  ]);
  return { books, media, recipes, inventory, events };
}

const statCards = [
  { label: "Books", key: "books" as const, icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Media", key: "media" as const, icon: Film, color: "text-purple-600", bg: "bg-purple-50" },
  { label: "Recipes", key: "recipes" as const, icon: ChefHat, color: "text-orange-600", bg: "bg-orange-50" },
  { label: "Inventory", key: "inventory" as const, icon: Package, color: "text-green-600", bg: "bg-green-50" },
  { label: "Events", key: "events" as const, icon: CalendarDays, color: "text-red-600", bg: "bg-red-50" },
];

export default async function DashboardPage() {
  const session = await auth();
  const stats = await getDashboardStats(session!.user.id);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Good to see you,{" "}
          <span className="text-indigo-600">
            {session?.user?.name ?? "there"}
          </span>
          !
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Here&apos;s an overview of your personal hub.
        </p>
      </div>

      {/* Role badge */}
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1">
        <User size={12} className="text-indigo-600" />
        <span className="text-xs font-medium text-indigo-700 capitalize">
          {session?.user?.role?.toLowerCase()} account
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {statCards.map(({ label, key, icon: Icon, color, bg }) => (
          <div
            key={key}
            className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={`mb-3 inline-flex rounded-xl p-2.5 ${bg}`}>
              <Icon size={20} className={color} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats[key]}</p>
            <p className="mt-0.5 text-sm text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Welcome message for empty state */}
      {Object.values(stats).every((v) => v === 0) && (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-slate-500 text-sm">
            Your hub is empty — start adding content to your modules.
          </p>
        </div>
      )}
    </div>
  );
}
