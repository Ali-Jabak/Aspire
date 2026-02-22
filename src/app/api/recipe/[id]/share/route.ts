import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const recipe = await db.recipe.findFirst({
    where: { id, userId: session.user.id },
    include: { shares: { include: { user: { select: { id: true, name: true, email: true } } } } },
  });
  if (!recipe) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    shareSlug: recipe.shareSlug,
    sharedWith: recipe.shares.map((s) => ({
      userId: s.userId,
      canEdit: s.canEdit,
      userName: s.user.name,
      userEmail: s.user.email,
    })),
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const recipe = await db.recipe.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!recipe) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const { action, email, userId, canEdit } = body;

  if (action === "link") {
    const slug = recipe.shareSlug ?? randomBytes(12).toString("base64url");
    await db.recipe.update({
      where: { id },
      data: { shareSlug: slug },
    });
    return NextResponse.json({ shareSlug: slug, url: `/recipe/shared/${slug}` });
  }

  if (action === "user") {
    const targetEmail = (email ?? "").toString().trim().toLowerCase();
    if (!targetEmail) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    const targetUser = await db.user.findUnique({
      where: { email: targetEmail },
    });
    if (!targetUser) {
      return NextResponse.json({ error: "User with this email not found" }, { status: 404 });
    }
    if (targetUser.id === session.user.id) {
      return NextResponse.json({ error: "Cannot share with yourself" }, { status: 400 });
    }
    await db.recipeShare.upsert({
      where: {
        recipeId_userId: { recipeId: id, userId: targetUser.id },
      },
      create: {
        recipeId: id,
        userId: targetUser.id,
        sharedById: session.user.id,
        canEdit: !!canEdit,
      },
      update: { canEdit: !!canEdit },
    });
    return NextResponse.json({
      sharedWith: { userId: targetUser.id, email: targetUser.email, canEdit: !!canEdit },
    });
  }

  return NextResponse.json({ error: "Invalid action. Use: link | user" }, { status: 400 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const recipe = await db.recipe.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!recipe) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const targetUserId = searchParams.get("userId");

  if (action === "link") {
    await db.recipe.update({
      where: { id },
      data: { shareSlug: null },
    });
    return NextResponse.json({ success: true });
  }

  if (action === "user" && targetUserId) {
    await db.recipeShare.deleteMany({
      where: { recipeId: id, userId: targetUserId },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Use ?action=link or ?action=user&userId=..." }, { status: 400 });
}
