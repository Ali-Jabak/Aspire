import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: bookId } = await params;
  let dueDays = 14;
  try {
    const body = await request.json().catch(() => ({}));
    dueDays = body.dueDays ?? 14;
  } catch {
    // empty body is fine, use default
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const book = await tx.book.findUnique({ where: { id: bookId } });
      if (!book) throw new Error("Book not found");
      if (book.availableCopies <= 0) throw new Error("No copies available");

      const existing = await tx.checkoutRecord.findFirst({
        where: { bookId, userId: session.user.id, status: "ACTIVE" },
      });
      if (existing) throw new Error("You already have this book checked out");

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + dueDays);

      const checkout = await tx.checkoutRecord.create({
        data: {
          bookId,
          userId: session.user.id,
          dueDate,
          status: "ACTIVE",
        },
      });

      const newAvailable = book.availableCopies - 1;
      await tx.book.update({
        where: { id: bookId },
        data: {
          availableCopies: newAvailable,
          status: newAvailable === 0 ? "CHECKED_OUT" : "AVAILABLE",
        },
      });

      return checkout;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to checkout";
    const status =
      message === "Book not found" ? 404 :
      message === "No copies available" || message === "You already have this book checked out" ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
