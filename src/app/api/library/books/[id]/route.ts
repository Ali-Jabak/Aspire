import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const book = await db.book.findUnique({
    where: { id },
    include: {
      reviews: {
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "desc" },
      },
      checkouts: {
        where: { status: "ACTIVE" },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { checkedOutAt: "desc" },
      },
      addedBy: { select: { id: true, name: true } },
    },
  });

  if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });

  const avgRating =
    book.reviews.length > 0
      ? book.reviews.reduce((s, r) => s + r.rating, 0) / book.reviews.length
      : null;

  const userCheckout = book.checkouts.find((c) => c.userId === session.user.id);

  return NextResponse.json({ ...book, avgRating, userCheckout: userCheckout || null });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "LIBRARIAN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const {
    title,
    author,
    isbn,
    description,
    coverUrl,
    genre,
    publisher,
    publishedYear,
    language,
    pageCount,
    tags,
    totalCopies,
    location,
    status,
  } = body;

  const existing = await db.book.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Book not found" }, { status: 404 });

  const newTotalCopies = totalCopies ? parseInt(totalCopies) : existing.totalCopies;
  const copiesDiff = newTotalCopies - existing.totalCopies;
  const newAvailableCopies = Math.max(0, existing.availableCopies + copiesDiff);

  const book = await db.book.update({
    where: { id },
    data: {
      title: title?.trim() ?? existing.title,
      author: author?.trim() ?? existing.author,
      isbn: isbn?.trim() ?? existing.isbn,
      description: description?.trim() ?? existing.description,
      coverUrl: coverUrl?.trim() ?? existing.coverUrl,
      genre: genre?.trim() ?? existing.genre,
      publisher: publisher?.trim() ?? existing.publisher,
      publishedYear: publishedYear ? parseInt(publishedYear) : existing.publishedYear,
      language: language?.trim() ?? existing.language,
      pageCount: pageCount ? parseInt(pageCount) : existing.pageCount,
      tags: Array.isArray(tags)
        ? tags
        : tags !== undefined
        ? tags.split(",").map((t: string) => t.trim()).filter(Boolean)
        : existing.tags,
      totalCopies: newTotalCopies,
      availableCopies: newAvailableCopies,
      location: location?.trim() ?? existing.location,
      status: status ?? (newAvailableCopies > 0 ? "AVAILABLE" : existing.status),
    },
  });

  return NextResponse.json(book);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden – Admin only" }, { status: 403 });
  }

  const { id } = await params;
  await db.book.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
