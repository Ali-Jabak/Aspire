import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  BookOpen,
  Film,
  ChefHat,
  Package,
  CalendarDays,
  User,
  WifiOff,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

async function getDashboardStats(userId: string) {
  const [books, media, recipes, inventory, events] = await Promise.all([
    db.book.count(),
    db.mediaItem.count({ where: { userId } }),
    db.recipe.count({ where: { userId } }),
    db.inventoryItem.count({ where: { userId } }),
    db.event.count({ where: { userId } }),
  ]);
  return { books, media, recipes, inventory, events };
}

async function getActiveCheckouts(userId: string) {
  return db.checkoutRecord.count({ where: { userId, status: "ACTIVE" } });
}

const statCards = [
  { label: "Library Books", key: "books" as const, icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50", href: "/library" },
  { label: "Media", key: "media" as const, icon: Film, color: "text-purple-600", bg: "bg-purple-50", href: "/media" },
  { label: "Recipes", key: "recipes" as const, icon: ChefHat, color: "text-orange-600", bg: "bg-orange-50", href: "/recipe" },
  { label: "Inventory", key: "inventory" as const, icon: Package, color: "text-green-600", bg: "bg-green-50", href: "/inventory" },
  { label: "Events", key: "events" as const, icon: CalendarDays, color: "text-red-600", bg: "bg-red-50", href: "/event" },
];

export default async function DashboardPage() {
  const session = await auth();

  let stats: Awaited<ReturnType<typeof getDashboardStats>>;
  let activeCheckouts: number;

  try {
    [stats, activeCheckouts] = await Promise.all([
      getDashboardStats(session!.user.id),
      getActiveCheckouts(session!.user.id),
    ]);
  } catch (err) {
    const isDbError =
      err && typeof err === "object" && "code" in err &&
      (err.code === "P1001" || err.code === "P1002" || err.code === "P1017");

    return (
      <div className="p-8">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 max-w-lg">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 p-2.5 rounded-xl bg-amber-100">
              <WifiOff size={24} className="text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-amber-900">Database unavailable</h2>
              <p className="mt-1 text-sm text-amber-800">
                {isDbError
                  ? "We can't reach the database. If you use Neon, the database may be paused — open your Neon dashboard to resume it. Check your connection and DATABASE_URL in .env."
                  : "Something went wrong loading your dashboard."}
              </p>
              <Link
                href="/dashboard"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-amber-700 hover:text-amber-900"
              >
                <RefreshCw size={14} />
                Try again
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
      <div className="mb-6 flex items-center gap-3 flex-wrap">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1">
          <User size={12} className="text-indigo-600" />
          <span className="text-xs font-medium text-indigo-700 capitalize">
            {session?.user?.role?.toLowerCase()} account
          </span>
        </div>
        {activeCheckouts > 0 && (
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1">
            <BookOpen size={12} className="text-blue-600" />
            <span className="text-xs font-medium text-blue-700">
              {activeCheckouts} book{activeCheckouts !== 1 ? "s" : ""} borrowed
            </span>
          </div>
        )}
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
