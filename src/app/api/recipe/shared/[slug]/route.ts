import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const recipe = await db.recipe.findFirst({
    where: { shareSlug: slug },
  });
  if (!recipe) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { shareSlug, userId, ...publicRecipe } = recipe;
  return NextResponse.json(publicRecipe);
}
