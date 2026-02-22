import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { BookOpen, Clock, CheckCircle, AlertTriangle, RotateCcw, MapPin } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Checkouts" };

const STATUS_CONFIG = {
  ACTIVE: { label: "Active", icon: Clock, classes: "bg-blue-100 text-blue-700", row: "border-blue-100" },
  RETURNED: { label: "Returned", icon: CheckCircle, classes: "bg-green-100 text-green-700", row: "border-slate-100" },
  OVERDUE: { label: "Overdue", icon: AlertTriangle, classes: "bg-red-100 text-red-700", row: "border-red-100 bg-red-50/30" },
};

async function getCheckouts(userId: string) {
  // Mark overdue before fetching
  await db.checkoutRecord.updateMany({
    where: { userId, status: "ACTIVE", dueDate: { lt: new Date() } },
    data: { status: "OVERDUE" },
  });

  return db.checkoutRecord.findMany({
    where: { userId },
    include: {
      book: {
        select: {
          id: true, title: true, author: true,
          genre: true, coverUrl: true, location: true,
        },
      },
    },
    orderBy: { checkedOutAt: "desc" },
  });
}

function daysBetween(d1: Date, d2: Date) {
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function MyCheckoutsPage() {
  const session = await auth();
  if (!session) return null;

  const checkouts = await getCheckouts(session.user.id);

  const active = checkouts.filter((c) => c.status === "ACTIVE");
  const overdue = checkouts.filter((c) => c.status === "OVERDUE");
  const returned = checkouts.filter((c) => c.status === "RETURNED");
  const now = new Date();

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Checkouts</h1>
        <p className="text-sm text-slate-500 mt-0.5">Track your borrowed books</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: "Currently Borrowed", value: active.length, color: "text-blue-600", bg: "bg-blue-50", icon: BookOpen },
          { label: "Overdue", value: overdue.length, color: "text-red-600", bg: "bg-red-50", icon: AlertTriangle },
          { label: "Total Read", value: returned.length, color: "text-green-600", bg: "bg-green-50", icon: CheckCircle },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
            <div className={`p-2 rounded-lg ${bg}`}>
              <Icon size={16} className={color} />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {checkouts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-16 text-center">
          <div className="bg-slate-100 rounded-full p-5 inline-block mb-4">
            <BookOpen size={32} className="text-slate-400" />
          </div>
          <h3 className="text-slate-700 font-semibold mb-1">No checkouts yet</h3>
          <p className="text-slate-400 text-sm">Head to the catalog to check out a book!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overdue alert */}
          {overdue.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800 text-sm">
                  You have {overdue.length} overdue book{overdue.length !== 1 ? "s" : ""}!
                </p>
                <p className="text-red-600 text-xs mt-0.5">
                  Please return them to the library as soon as possible.
                </p>
              </div>
            </div>
          )}

          {/* Active + Overdue */}
          {(active.length > 0 || overdue.length > 0) && (
            <section>
              <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Clock size={14} /> Currently Borrowed
              </h2>
              <div className="space-y-3">
                {[...overdue, ...active].map((checkout) => {
                  const cfg = STATUS_CONFIG[checkout.status as keyof typeof STATUS_CONFIG];
                  const StatusIcon = cfg.icon;
                  const isOverdue = checkout.status === "OVERDUE";
                  const daysOverdue = isOverdue ? daysBetween(new Date(checkout.dueDate), now) : 0;
                  const daysLeft = checkout.status === "ACTIVE" ? daysBetween(now, new Date(checkout.dueDate)) : 0;

                  return (
                    <div
                      key={checkout.id}
                      className={`bg-white rounded-xl border p-5 flex items-start gap-4 ${cfg.row}`}
                    >
                      <div className="w-12 h-16 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-indigo-700 font-bold text-lg">
                          {checkout.book.title.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-slate-900 text-sm leading-snug">
                              {checkout.book.title}
                            </p>
                            <p className="text-xs text-slate-500">{checkout.book.author}</p>
                          </div>
                          <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${cfg.classes}`}>
                            <StatusIcon size={11} />
                            {cfg.label}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <BookOpen size={11} />
                            Checked out {new Date(checkout.checkedOutAt).toLocaleDateString()}
                          </span>
                          {checkout.book.location && (
                            <span className="flex items-center gap-1">
                              <MapPin size={11} />
                              {checkout.book.location}
                            </span>
                          )}
                          {isOverdue ? (
                            <span className="text-red-600 font-medium flex items-center gap-1">
                              <AlertTriangle size={11} />
                              {daysOverdue} day{daysOverdue !== 1 ? "s" : ""} overdue
                            </span>
                          ) : (
                            <span className={`flex items-center gap-1 ${daysLeft <= 3 ? "text-orange-600 font-medium" : ""}`}>
                              <Clock size={11} />
                              Due {new Date(checkout.dueDate).toLocaleDateString()}
                              {daysLeft <= 3 && ` · ${daysLeft}d left`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Returned history */}
          {returned.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <RotateCcw size={14} /> Reading History
              </h2>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Book</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Author</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Borrowed</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Returned</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {returned.map((checkout) => (
                      <tr key={checkout.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-800">{checkout.book.title}</td>
                        <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{checkout.book.author}</td>
                        <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                          {new Date(checkout.checkedOutAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {checkout.returnedAt ? new Date(checkout.returnedAt).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
