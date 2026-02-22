import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "LIBRARIAN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Mark overdue records
  await db.checkoutRecord.updateMany({
    where: { status: "ACTIVE", dueDate: { lt: new Date() } },
    data: { status: "OVERDUE" },
  });

  const [
    totalBooks,
    availableBooks,
    activeCheckouts,
    overdueCheckouts,
    totalMembers,
    recentCheckouts,
    overdueList,
    popularBooks,
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
        book: { select: { id: true, title: true, author: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 10,
    }),
    db.book.findMany({
      include: { _count: { select: { checkouts: true } } },
      orderBy: { checkouts: { _count: "desc" } },
      take: 5,
    }),
  ]);

  return NextResponse.json({
    stats: {
      totalBooks,
      availableBooks,
      activeCheckouts,
      overdueCheckouts,
      totalMembers,
    },
    recentCheckouts,
    overdueList,
    popularBooks: popularBooks.map((b) => ({
      ...b,
      checkoutCount: b._count.checkouts,
      _count: undefined,
    })),
  });
}
