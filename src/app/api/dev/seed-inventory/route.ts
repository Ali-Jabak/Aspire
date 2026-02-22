import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const DEMO_ITEMS = [
  { name: "AA Batteries", description: "Alkaline AA for remotes and small devices", quantity: 24, unit: "pcs", category: "Electronics", location: "Utility drawer", minQuantity: 8, status: "IN_STOCK" as const },
  { name: "Printer Paper (A4)", description: "Ream of 500 sheets", quantity: 2, unit: "reams", category: "Office supplies", location: "Supply closet", minQuantity: 1, status: "LOW_STOCK" as const },
  { name: "Staples", quantity: 0, unit: "box", category: "Office supplies", location: "Desk", minQuantity: 1, status: "ORDERED" as const },
  { name: "Hand Sanitizer", quantity: 6, unit: "bottles", category: "Cleaning", location: "Kitchen", minQuantity: 2, status: "IN_STOCK" as const },
  { name: "Paper Towels", quantity: 4, unit: "rolls", category: "Cleaning", location: "Pantry", minQuantity: 2, status: "IN_STOCK" as const },
  { name: "Coffee Beans", description: "Medium roast, 1kg bag", quantity: 1, unit: "bag", category: "Pantry", location: "Kitchen", minQuantity: 1, status: "LOW_STOCK" as const },
  { name: "USB-C Cables", quantity: 5, unit: "pcs", category: "Electronics", location: "Tech drawer", minQuantity: 2, status: "IN_STOCK" as const },
  { name: "Sticky Notes", quantity: 12, unit: "pads", category: "Office supplies", location: "Desk", minQuantity: 3, status: "IN_STOCK" as const },
  { name: "Discontinued Widget v1", quantity: 0, unit: "pcs", category: "Legacy", location: "Archive", minQuantity: null, status: "DISCONTINUED" as const },
  { name: "Whiteboard Markers", quantity: 8, unit: "pcs", category: "Office supplies", location: "Meeting room", minQuantity: 4, status: "IN_STOCK" as const },
];

export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = DEMO_ITEMS.map((row) => ({
      ...row,
      userId: session.user.id,
    }));
    const { count } = await db.inventoryItem.createMany({ data });
    return NextResponse.json({ ok: true, count, message: `Added ${count} demo inventory items.` });
  } catch (err) {
    console.error("[seed-inventory]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to seed inventory" },
      { status: 500 }
    );
  }
}
