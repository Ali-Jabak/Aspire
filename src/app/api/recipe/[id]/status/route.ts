import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const VALID: Array<"FAVORITE" | "TO_TRY" | "MADE_BEFORE" | null> = ["FAVORITE", "TO_TRY", "MADE_BEFORE", null];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const recipe = await db.recipe.findFirst({
    where: {
      id,
      OR: [
        { userId: session.user.id },
        { shares: { some: { userId: session.user.id, canEdit: true } } },
      ],
    },
  });
  if (!recipe)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const status = body.status === null || body.status === "" ? null : body.status;
  if (status !== null && !VALID.includes(status)) {
    return NextResponse.json(
      { error: "Invalid status. Use: FAVORITE, TO_TRY, MADE_BEFORE, or null" },
      { status: 400 }
    );
  }

  const updated = await db.recipe.update({
    where: { id },
    data: { status },
  });
  return NextResponse.json(updated);
}
