import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { BookStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const genre = searchParams.get("genre") || "";
  const status = searchParams.get("status") || "";
  const sort = searchParams.get("sort") || "createdAt";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "12");
  const skip = (page - 1) * limit;

  const where = {
    AND: [
      search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" as const } },
              { author: { contains: search, mode: "insensitive" as const } },
              { isbn: { contains: search, mode: "insensitive" as const } },
              { genre: { contains: search, mode: "insensitive" as const } },
              { publisher: { contains: search, mode: "insensitive" as const } },
              { description: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {},
      genre ? { genre: { equals: genre } } : {},
      status ? { status: { equals: status as BookStatus } } : {},
    ],
  };

  const orderBy =
    sort === "title"
      ? { title: "asc" as const }
      : sort === "author"
      ? { author: "asc" as const }
      : sort === "publishedYear"
      ? { publishedYear: "desc" as const }
      : { createdAt: "desc" as const };

  const [books, total, available, checkedOut] = await Promise.all([
    db.book.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        reviews: { select: { rating: true } },
        _count: { select: { checkouts: true } },
      },
    }),
    db.book.count({ where }),
    db.book.count({ where: { status: "AVAILABLE" } }),
    db.book.count({ where: { status: "CHECKED_OUT" } }),
  ]);

  const enriched = books.map((book) => ({
    ...book,
    avgRating:
      book.reviews.length > 0
        ? book.reviews.reduce((s, r) => s + r.rating, 0) / book.reviews.length
        : null,
    reviewCount: book.reviews.length,
    reviews: undefined,
    _count: undefined,
  }));

  return NextResponse.json({
    books: enriched,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    stats: { total: await db.book.count(), available, checkedOut },
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "LIBRARIAN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
  } = body;

  if (!title || !author) {
    return NextResponse.json({ error: "Title and author are required" }, { status: 400 });
  }

  const copies = Math.max(1, parseInt(totalCopies) || 1);

  const book = await db.book.create({
    data: {
      title: title.trim(),
      author: author.trim(),
      isbn: isbn?.trim() || undefined,
      description: description?.trim() || undefined,
      coverUrl: coverUrl?.trim() || undefined,
      genre: genre?.trim() || undefined,
      publisher: publisher?.trim() || undefined,
      publishedYear: publishedYear ? parseInt(publishedYear) : undefined,
      language: language?.trim() || "English",
      pageCount: pageCount ? parseInt(pageCount) : undefined,
      tags: Array.isArray(tags)
        ? tags
        : tags
        ? tags.split(",").map((t: string) => t.trim()).filter(Boolean)
        : [],
      totalCopies: copies,
      availableCopies: copies,
      location: location?.trim() || undefined,
      addedByUserId: session.user.id,
    },
  });

  return NextResponse.json(book, { status: 201 });
}
