import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const VALID_STATUSES = ["OWNED", "WISHLIST", "CURRENTLY_USING", "COMPLETED"] as const;

export async function PATCH(
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
    const body = await request.json().catch(() => ({}));
    const status = body.status;
    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Use: OWNED, WISHLIST, CURRENTLY_USING, COMPLETED" },
        { status: 400 }
      );
    }

    const item = await db.mediaItem.update({
      where: { id },
      data: {
        status,
        completedAt: status === "COMPLETED" ? new Date() : null,
      },
    });

    return NextResponse.json(item);
  } catch (err) {
    console.error("[media status PATCH]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update status" },
      { status: 500 }
    );
  }
}
