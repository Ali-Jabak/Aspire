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
  const item = await db.mediaItem.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await db.mediaItem.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
      completedAt,
    } = body;

    const item = await db.mediaItem.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(type !== undefined && { type: type.trim() }),
        ...(creator !== undefined && { creator: creator?.trim() || null }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(url !== undefined && { url: url?.trim() || null }),
        ...(thumbnailUrl !== undefined && { thumbnailUrl: thumbnailUrl?.trim() || null }),
        ...(genre !== undefined && { genre: genre?.trim() || null }),
        ...(rating !== undefined && {
          rating: rating == null ? null : Math.min(5, Math.max(1, parseInt(rating))),
        }),
        ...(releaseDate !== undefined && {
          releaseDate: releaseDate ? new Date(releaseDate) : null,
        }),
        ...(status !== undefined &&
          ["OWNED", "WISHLIST", "CURRENTLY_USING", "COMPLETED"].includes(status) && {
            status,
            ...(status === "COMPLETED" && { completedAt: new Date() }),
            ...(status !== "COMPLETED" && { completedAt: null }),
          }),
        ...(completedAt !== undefined && { completedAt: completedAt ? new Date(completedAt) : null }),
      },
    });

    return NextResponse.json(item);
  } catch (err) {
    console.error("[media PUT]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await db.mediaItem.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.mediaItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
