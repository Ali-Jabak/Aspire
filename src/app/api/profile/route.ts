import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let profile = await db.profile.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile) {
    const base = slugify(session.user.email?.split("@")[0] || "user");
    let slug = base;
    let n = 0;
    while (await db.profile.findUnique({ where: { slug } })) {
      slug = `${base}-${++n}`;
    }
    profile = await db.profile.create({
      data: {
        userId: session.user.id,
        slug,
        displayName: session.user.name || null,
      },
    });
  }

  return NextResponse.json(profile);
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let profile = await db.profile.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile) {
    const base = slugify(session.user.email?.split("@")[0] || "user");
    let slug = base;
    let n = 0;
    while (await db.profile.findUnique({ where: { slug } })) {
      slug = `${base}-${++n}`;
    }
    profile = await db.profile.create({
      data: { userId: session.user.id, slug, displayName: session.user.name || null },
    });
  }

  try {
    const body = await request.json();
    const { slug: newSlug, displayName, bio, isPublic } = body;

    const slugTrimmed = newSlug?.trim();
    if (slugTrimmed !== undefined) {
      const s = slugify(slugTrimmed);
      if (!s || s.length < 2) {
        return NextResponse.json(
          { error: "Slug must be at least 2 characters (letters/numbers)" },
          { status: 400 }
        );
      }
      const taken = await db.profile.findFirst({
        where: { slug: s, userId: { not: session.user.id } },
      });
      if (taken) {
        return NextResponse.json(
          { error: "This profile URL is already taken" },
          { status: 400 }
        );
      }
    }

    profile = await db.profile.update({
      where: { userId: session.user.id },
      data: {
        ...(slugTrimmed !== undefined && { slug: slugify(slugTrimmed) }),
        ...(displayName !== undefined && { displayName: displayName?.trim() || null }),
        ...(bio !== undefined && { bio: bio?.trim() || null }),
        ...(typeof isPublic === "boolean" && { isPublic }),
      },
    });

    return NextResponse.json(profile);
  } catch (err) {
    console.error("[profile PUT]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update profile" },
      { status: 500 }
    );
  }
}
