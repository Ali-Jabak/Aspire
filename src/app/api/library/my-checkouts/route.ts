import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Mark overdue records first
  await db.checkoutRecord.updateMany({
    where: {
      userId: session.user.id,
      status: "ACTIVE",
      dueDate: { lt: new Date() },
    },
    data: { status: "OVERDUE" },
  });

  const checkouts = await db.checkoutRecord.findMany({
    where: { userId: session.user.id },
    include: {
      book: {
        select: {
          id: true,
          title: true,
          author: true,
          genre: true,
          coverUrl: true,
          location: true,
        },
      },
    },
    orderBy: { checkedOutAt: "desc" },
  });

  return NextResponse.json(checkouts);
}
