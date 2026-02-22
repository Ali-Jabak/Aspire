import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!slug) return NextResponse.json({ error: "Slug required" }, { status: 400 });

  const profile = await db.profile.findUnique({
    where: { slug: slug.toLowerCase(), isPublic: true },
    include: { user: { select: { id: true, name: true, image: true } } },
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found or not public" }, { status: 404 });
  }

  const items = await db.mediaItem.findMany({
    where: { userId: profile.userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    profile: {
      slug: profile.slug,
      displayName: profile.displayName || profile.user.name,
      bio: profile.bio,
      userImage: profile.user.image,
    },
    items,
  });
}
