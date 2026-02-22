import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { InventoryStatus } from "@prisma/client";

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
    const category = searchParams.get("category") || "";
    const sort = searchParams.get("sort") || "createdAt";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "24"), 48);
    const skip = (page - 1) * limit;

    const where = {
      userId: session.user.id,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
          { category: { contains: search, mode: "insensitive" as const } },
          { location: { contains: search, mode: "insensitive" as const } },
          { unit: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(status && { status: status as InventoryStatus }),
      ...(category && { category: { contains: category, mode: "insensitive" as const } }),
    };

    const orderBy =
      sort === "name"
        ? { name: "asc" as const }
        : sort === "quantity"
        ? { quantity: "desc" as const }
        : sort === "updatedAt"
        ? { updatedAt: "desc" as const }
        : { createdAt: "desc" as const };

    const [items, total] = await Promise.all([
      db.inventoryItem.findMany({ where, orderBy, skip, take: limit }),
      db.inventoryItem.count({ where }),
    ]);

    const stats = await db.inventoryItem.groupBy({
      by: ["status"],
      where: { userId: session.user.id },
      _count: { _all: true },
    });

    return NextResponse.json({
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: Object.fromEntries(stats.map((s) => [s.status, s._count._all])),
    });
  } catch (err) {
    console.error("[inventory GET]", err);
    const status = isDbUnreachable(err) ? 503 : 500;
    const message = isDbUnreachable(err)
      ? "Database unavailable. Check your connection or resume your Neon database."
      : err instanceof Error ? err.message : "Failed to load inventory";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { name, description, quantity, unit, category, location, minQuantity, status } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const validStatuses = ["IN_STOCK", "LOW_STOCK", "ORDERED", "DISCONTINUED"] as const;
    const item = await db.inventoryItem.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        quantity: quantity != null ? parseInt(quantity) || 0 : 0,
        unit: unit?.trim() || null,
        category: category?.trim() || null,
        location: location?.trim() || null,
        minQuantity: minQuantity != null ? parseInt(minQuantity) || null : null,
        status:
          status && validStatuses.includes(status) ? status : "IN_STOCK",
        userId: session.user.id,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    console.error("[inventory POST]", err);
    const status = isDbUnreachable(err) ? 503 : 500;
    const message = isDbUnreachable(err)
      ? "Database unavailable."
      : err instanceof Error ? err.message : "Failed to create item";
    return NextResponse.json({ error: message }, { status });
  }
}
