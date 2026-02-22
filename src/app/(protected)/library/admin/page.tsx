import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  Library, Users, BookOpen, AlertTriangle,
  Clock, CheckCircle, TrendingUp, ShieldCheck,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Library Admin" };

async function getAdminData() {
  // Mark overdue
  await db.checkoutRecord.updateMany({
    where: { status: "ACTIVE", dueDate: { lt: new Date() } },
    data: { status: "OVERDUE" },
  });

  const [
    totalBooks, availableBooks, activeCheckouts, overdueCheckouts,
    totalMembers, recentCheckouts, overdueList, popularBooks, roleBreakdown,
  ] = await Promise.all([
    db.book.count(),
    db.book.count({ where: { status: "AVAILABLE" } }),
    db.checkoutRecord.count({ where: { status: "ACTIVE" } }),
    db.checkoutRecord.count({ where: { status: "OVERDUE" } }),
    db.user.count({ where: { role: "USER" } }),
    db.checkoutRecord.findMany({
      where: { status: { in: ["ACTIVE", "OVERDUE"] } },
      include: {
        book: { select: { id: true, title: true, author: true, genre: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { checkedOutAt: "desc" },
      take: 10,
    }),
    db.checkoutRecord.findMany({
      where: { status: "OVERDUE" },
      include: {
        book: { select: { title: true, author: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 8,
    }),
    db.book.findMany({
      include: { _count: { select: { checkouts: true } } },
      orderBy: { checkouts: { _count: "desc" } },
      take: 5,
    }),
    db.user.groupBy({ by: ["role"], _count: { _all: true } }),
  ]);

  return {
    stats: { totalBooks, availableBooks, activeCheckouts, overdueCheckouts, totalMembers },
    recentCheckouts,
    overdueList,
    popularBooks: popularBooks.map((b) => ({ ...b, checkoutCount: b._count.checkouts })),
    roleBreakdown,
  };
}

export default async function AdminPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "ADMIN" && role !== "LIBRARIAN") {
    redirect("/library");
  }

  const data = await getAdminData();
  const { stats } = data;

  const statCards = [
    { label: "Total Books", value: stats.totalBooks, icon: Library, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Available", value: stats.availableBooks, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
    { label: "Active Checkouts", value: stats.activeCheckouts, icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Overdue", value: stats.overdueCheckouts, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
    { label: "Members", value: stats.totalMembers, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="bg-indigo-50 p-2 rounded-xl">
          <ShieldCheck size={20} className="text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Library Admin Panel</h1>
          <p className="text-sm text-slate-500 mt-0.5">Overview and management</p>
        </div>
        <div className="ml-auto">
          <span className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full font-medium capitalize">
            {role?.toLowerCase()}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className={`inline-flex p-2 rounded-lg mb-2 ${bg}`}>
              <Icon size={16} className={color} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Overdue books */}
        <div className="lg:col-span-2">
          {data.overdueList.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl mb-6">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-red-200">
                <AlertTriangle size={16} className="text-red-600" />
                <h2 className="font-semibold text-red-800 text-sm">Overdue Books ({data.overdueList.length})</h2>
              </div>
              <div className="divide-y divide-red-100">
                {data.overdueList.map((checkout) => {
                  const daysOverdue = Math.round(
                    (new Date().getTime() - new Date(checkout.dueDate).getTime()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <div key={checkout.id} className="px-5 py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{checkout.book.title}</p>
                        <p className="text-xs text-slate-500">{checkout.user.name ?? checkout.user.email}</p>
                      </div>
                      <span className="text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full flex-shrink-0">
                        {daysOverdue}d overdue
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active checkouts */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
              <BookOpen size={16} className="text-indigo-600" />
              <h2 className="font-semibold text-slate-800 text-sm">Active Checkouts</h2>
            </div>
            {data.recentCheckouts.length === 0 ? (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">No active checkouts.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Book</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Borrower</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Due Date</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.recentCheckouts.map((checkout) => (
                      <tr key={checkout.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800 truncate max-w-[160px]">{checkout.book.title}</p>
                          <p className="text-xs text-slate-400">{checkout.book.author}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                          {checkout.user.name ?? checkout.user.email}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {new Date(checkout.dueDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            checkout.status === "OVERDUE"
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
                          }`}>
                            {checkout.status === "OVERDUE" ? "Overdue" : "Active"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Popular books */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
              <TrendingUp size={16} className="text-indigo-600" />
              <h2 className="font-semibold text-slate-800 text-sm">Most Borrowed</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {data.popularBooks.map((book, i) => (
                <div key={book.id} className="px-5 py-3 flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{book.title}</p>
                    <p className="text-xs text-slate-500 truncate">{book.author}</p>
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0">{book.checkoutCount}×</span>
                </div>
              ))}
              {data.popularBooks.length === 0 && (
                <div className="px-5 py-6 text-center text-slate-400 text-sm">No checkout data yet.</div>
              )}
            </div>
          </div>

          {/* User role breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
              <Users size={16} className="text-indigo-600" />
              <h2 className="font-semibold text-slate-800 text-sm">User Breakdown</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {data.roleBreakdown.map((r) => (
                <div key={r.role} className="px-5 py-3 flex items-center justify-between">
                  <span className="text-sm text-slate-600 capitalize">{r.role.toLowerCase()}</span>
                  <span className="text-sm font-semibold text-slate-800">{r._count._all}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
