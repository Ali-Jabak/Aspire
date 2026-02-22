import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: bookId } = await params;

  try {
    const result = await db.$transaction(async (tx) => {
      const isStaff =
        session.user.role === "ADMIN" || session.user.role === "LIBRARIAN";

      // ACTIVE or OVERDUE both mean "not yet returned"
      const checkout = await tx.checkoutRecord.findFirst({
        where: {
          bookId,
          status: { in: ["ACTIVE", "OVERDUE"] },
          ...(!isStaff && { userId: session.user.id }),
        },
        orderBy: { checkedOutAt: "desc" },
      });

      if (!checkout) return null;

      const [updated] = await Promise.all([
        tx.checkoutRecord.update({
          where: { id: checkout.id },
          data: { status: "RETURNED", returnedAt: new Date() },
        }),
        tx.book.update({
          where: { id: bookId },
          data: {
            availableCopies: { increment: 1 },
            status: "AVAILABLE",
          },
        }),
      ]);

      return updated;
    });

    if (!result) {
      return NextResponse.json(
        { error: "No active or overdue checkout found for this book." },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[return]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to return book" },
      { status: 500 }
    );
  }
}
