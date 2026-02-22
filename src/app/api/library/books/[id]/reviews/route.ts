import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: bookId } = await params;

  const reviews = await db.bookReview.findMany({
    where: { bookId },
    include: { user: { select: { id: true, name: true, image: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(reviews);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: bookId } = await params;
  const { rating, comment } = await request.json();

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
  }

  const review = await db.bookReview.upsert({
    where: { bookId_userId: { bookId, userId: session.user.id } },
    update: { rating, comment: comment?.trim() || null },
    create: {
      bookId,
      userId: session.user.id,
      rating,
      comment: comment?.trim() || null,
    },
    include: { user: { select: { id: true, name: true, image: true } } },
  });

  return NextResponse.json(review, { status: 201 });
}
