import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const VALID = ["IN_STOCK", "LOW_STOCK", "ORDERED", "DISCONTINUED"] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await db.inventoryItem.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const status = body.status;
  if (!status || !VALID.includes(status)) {
    return NextResponse.json(
      { error: "Invalid status. Use: IN_STOCK, LOW_STOCK, ORDERED, DISCONTINUED" },
      { status: 400 }
    );
  }

  const item = await db.inventoryItem.update({
    where: { id },
    data: { status },
  });
  return NextResponse.json(item);
}
