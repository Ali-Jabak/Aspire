import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { MediaStatus } from "@prisma/client";

function isDbUnreachable(err: unknown): boolean {
  const code = err && typeof err === "object" && "code" in err ? (err as { code: string }).code : "";
  return code === "P1001" || code === "P1002" || code === "P1017";
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";
    const status = searchParams.get("status") || "";
    const genre = searchParams.get("genre") || "";
    const sort = searchParams.get("sort") || "createdAt";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const skip = (page - 1) * limit;

    const where = {
      userId: session.user.id,
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { creator: { contains: search, mode: "insensitive" as const } },
          { genre: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(type && { type: { equals: type } }),
      ...(status && { status: { equals: status as MediaStatus } }),
      ...(genre && { genre: { contains: genre, mode: "insensitive" as const } }),
    };

    const orderBy =
      sort === "title"
        ? { title: "asc" as const }
        : sort === "releaseDate"
        ? { releaseDate: "desc" as const }
        : sort === "rating"
        ? { rating: "desc" as const }
        : { createdAt: "desc" as const };

    const [items, total] = await Promise.all([
      db.mediaItem.findMany({ where, orderBy, skip, take: limit }),
      db.mediaItem.count({ where }),
    ]);

    const stats = await db.mediaItem.groupBy({
      by: ["status"],
      where: { userId: session.user.id },
      _count: { _all: true },
    });

    return NextResponse.json({
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: Object.fromEntries(stats.map((s) => [s.status, s._count._all])),
    });
  } catch (err) {
    console.error("[media GET]", err);
    const status = isDbUnreachable(err) ? 503 : 500;
    const message = isDbUnreachable(err)
      ? "Database unavailable. Check your connection or resume your Neon database."
      : err instanceof Error ? err.message : "Failed to load media";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const {
      title,
      type,
      creator,
      description,
      url,
      thumbnailUrl,
      genre,
      rating,
      releaseDate,
      status,
    } = body;

    if (!title || !type) {
      return NextResponse.json(
        { error: "Title and type are required" },
        { status: 400 }
      );
    }

    const item = await db.mediaItem.create({
      data: {
        title: title.trim(),
        type: type.trim(),
        creator: creator?.trim() || null,
        description: description?.trim() || null,
        url: url?.trim() || null,
        thumbnailUrl: thumbnailUrl?.trim() || null,
        genre: genre?.trim() || null,
        rating: rating != null ? Math.min(5, Math.max(1, parseInt(rating))) : null,
        releaseDate: releaseDate ? new Date(releaseDate) : null,
        status: status && ["OWNED", "WISHLIST", "CURRENTLY_USING", "COMPLETED"].includes(status)
          ? status
          : "OWNED",
        userId: session.user.id,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    console.error("[media POST]", err);
    const status = isDbUnreachable(err) ? 503 : 500;
    const message = isDbUnreachable(err)
      ? "Database unavailable. Check your connection or resume your Neon database."
      : err instanceof Error ? err.message : "Failed to create media";
    return NextResponse.json({ error: message }, { status });
  }
}
