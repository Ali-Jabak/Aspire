import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

async function canAccess(recipeId: string, userId: string, requireOwner?: boolean) {
  const recipe = await db.recipe.findUnique({ where: { id: recipeId }, include: { shares: true } });
  if (!recipe) return { ok: false, recipe: null as never, canEdit: false };
  if (recipe.userId === userId) return { ok: true, recipe, canEdit: true };
  const share = recipe.shares.find((s) => s.userId === userId);
  if (share) return { ok: true, recipe, canEdit: requireOwner ? false : share.canEdit };
  return { ok: false, recipe: null as never, canEdit: false };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { ok, recipe } = await canAccess(id, session.user.id);
  if (!ok || !recipe)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const myShare = recipe.shares.find((s) => s.userId === session.user.id);
  const isOwner = recipe.userId === session.user.id;
  const canEdit = isOwner || myShare?.canEdit === true;
  const { shares, ...rest } = recipe;
  return NextResponse.json({
    ...rest,
    isOwner,
    canEdit,
    sharedWith: shares.map((s) => ({ userId: s.userId, canEdit: s.canEdit })),
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { ok, canEdit } = await canAccess(id, session.user.id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canEdit) return NextResponse.json({ error: "You do not have permission to edit this recipe" }, { status: 403 });

  try {
    const body = await request.json();
    const {
      title,
      description,
      ingredients,
      instructions,
      prepTime,
      cookTime,
      servings,
      imageUrl,
      category,
      cuisine,
      status,
    } = body;

    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title.trim();
    if (description !== undefined) data.description = description?.trim() || null;
    if (ingredients !== undefined) data.ingredients = ingredients?.trim() || null;
    if (instructions !== undefined) data.instructions = instructions?.trim() || null;
    if (prepTime !== undefined) data.prepTime = prepTime != null ? parseInt(prepTime) || null : null;
    if (cookTime !== undefined) data.cookTime = cookTime != null ? parseInt(cookTime) || null : null;
    if (servings !== undefined) data.servings = servings != null ? parseInt(servings) || null : null;
    if (imageUrl !== undefined) data.imageUrl = imageUrl?.trim() || null;
    if (category !== undefined) data.category = category?.trim() || null;
    if (cuisine !== undefined) data.cuisine = cuisine?.trim() || null;
    if (status !== undefined)
      data.status = status && ["FAVORITE", "TO_TRY", "MADE_BEFORE"].includes(status) ? status : null;

    const recipe = await db.recipe.update({ where: { id }, data: data as never });
    return NextResponse.json(recipe);
  } catch (err) {
    console.error("[recipe PUT]", err);
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
  const { ok, recipe } = await canAccess(id, session.user.id);
  if (!ok || !recipe) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (recipe.userId !== session.user.id)
    return NextResponse.json({ error: "Only the owner can delete this recipe" }, { status: 403 });

  await db.recipe.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
