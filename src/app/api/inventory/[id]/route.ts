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
  const item = await db.inventoryItem.findFirst({
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
  const existing = await db.inventoryItem.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const body = await request.json();
    const { name, description, quantity, unit, category, location, minQuantity, status } = body;
    const validStatuses = ["IN_STOCK", "LOW_STOCK", "ORDERED", "DISCONTINUED"] as const;

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name.trim();
    if (description !== undefined) data.description = description?.trim() || null;
    if (quantity !== undefined) data.quantity = quantity != null ? parseInt(quantity) || 0 : 0;
    if (unit !== undefined) data.unit = unit?.trim() || null;
    if (category !== undefined) data.category = category?.trim() || null;
    if (location !== undefined) data.location = location?.trim() || null;
    if (minQuantity !== undefined) data.minQuantity = minQuantity != null ? parseInt(minQuantity) || null : null;
    if (status !== undefined && validStatuses.includes(status)) data.status = status;

    const item = await db.inventoryItem.update({ where: { id }, data: data as never });
    return NextResponse.json(item);
  } catch (err) {
    console.error("[inventory PUT]", err);
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
  const existing = await db.inventoryItem.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.inventoryItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
