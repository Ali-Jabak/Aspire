import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { RecipeStatus } from "@prisma/client";

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
    const status = searchParams.get("status") || "";
    const cuisine = searchParams.get("cuisine") || "";
    const maxPrep = searchParams.get("maxPrep"); // max prep time in minutes
    const sort = searchParams.get("sort") || "createdAt";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "24"), 48);
    const skip = (page - 1) * limit;

    const userId = session.user.id;

    // Recipes: owned by user OR shared with user
    const shared = await db.recipeShare.findMany({
      where: { userId },
      select: { recipeId: true },
    });
    const sharedIds = shared.map((s) => s.recipeId);
    const visibility =
      sharedIds.length > 0
        ? { OR: [{ userId }, { id: { in: sharedIds } }] as const }
        : { userId };

    const searchClause = search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { ingredients: { contains: search, mode: "insensitive" as const } },
            { category: { contains: search, mode: "insensitive" as const } },
            { cuisine: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const andParts: object[] = [visibility];
    if (Object.keys(searchClause).length > 0) andParts.push(searchClause);
    if (status) andParts.push({ status: status as RecipeStatus });
    if (cuisine) andParts.push({ cuisine: { contains: cuisine, mode: "insensitive" as const } });
    if (maxPrep != null && maxPrep !== "" && !Number.isNaN(parseInt(maxPrep)))
      andParts.push({ prepTime: { lte: parseInt(maxPrep) } });

    const where = andParts.length === 1 ? (andParts[0] as object) : { AND: andParts };

    const orderBy =
      sort === "title"
        ? { title: "asc" as const }
        : sort === "prepTime"
        ? { prepTime: "asc" as const }
        : sort === "updatedAt"
        ? { updatedAt: "desc" as const }
        : { createdAt: "desc" as const };

    const [items, total] = await Promise.all([
      db.recipe.findMany({ where, orderBy, skip, take: limit }),
      db.recipe.count({ where }),
    ]);

    const stats = await db.recipe.groupBy({
      by: ["status"],
      where: { userId },
      _count: { _all: true },
    });

    return NextResponse.json({
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: Object.fromEntries(stats.map((s) => [s.status ?? "NONE", s._count._all])),
    });
  } catch (err) {
    console.error("[recipe GET]", err);
    const status = isDbUnreachable(err) ? 503 : 500;
    const message = isDbUnreachable(err)
      ? "Database unavailable. Check your connection or resume your Neon database."
      : err instanceof Error ? err.message : "Failed to load recipes";
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

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const recipe = await db.recipe.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        ingredients: ingredients?.trim() || null,
        instructions: instructions?.trim() || null,
        prepTime: prepTime != null ? parseInt(prepTime) || null : null,
        cookTime: cookTime != null ? parseInt(cookTime) || null : null,
        servings: servings != null ? parseInt(servings) || null : null,
        imageUrl: imageUrl?.trim() || null,
        category: category?.trim() || null,
        cuisine: cuisine?.trim() || null,
        status:
          status && ["FAVORITE", "TO_TRY", "MADE_BEFORE"].includes(status) ? status : null,
        userId: session.user.id,
      },
    });

    return NextResponse.json(recipe, { status: 201 });
  } catch (err) {
    console.error("[recipe POST]", err);
    const status = isDbUnreachable(err) ? 503 : 500;
    const message = isDbUnreachable(err)
      ? "Database unavailable."
      : err instanceof Error ? err.message : "Failed to create recipe";
    return NextResponse.json({ error: message }, { status });
  }
}
