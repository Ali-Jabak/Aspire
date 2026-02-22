import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

function addDays(d: Date, days: number) {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0);

  const DEMO_EVENTS = [
    { title: "Team standup", description: "Daily sync with the product team", startDate: addDays(base, 1), endDate: addDays(base, 1), location: "Conference room A", isAllDay: false, color: "#dc2626" },
    { title: "Product roadmap review", description: "Q1 planning and priorities", startDate: addDays(base, 3), endDate: addDays(base, 3), location: "Zoom", isAllDay: false, color: "#ea580c" },
    { title: "Office lunch", description: "Casual get-together", startDate: addDays(base, 5), endDate: addDays(base, 5), location: "Downtown bistro", isAllDay: false, color: "#65a30d" },
    { title: "Workshop: React best practices", description: "Hands-on session", startDate: addDays(base, 7), endDate: addDays(base, 7), location: "Training room", isAllDay: false, color: "#0891b2" },
    { title: "Hackathon weekend", description: "Build something fun", startDate: addDays(base, 14), endDate: addDays(base, 16), location: "HQ", isAllDay: true, color: "#7c3aed" },
    { title: "All-hands meeting", description: "Company updates", startDate: addDays(base, 21), endDate: addDays(base, 21), location: "Main hall", isAllDay: false, color: "#db2777" },
  ];

  try {
    const data = DEMO_EVENTS.map((e) => {
      const end = e.endDate && e.startDate.getTime() !== e.endDate.getTime() ? e.endDate : null;
      return { ...e, endDate: end, userId: session.user.id };
    });
    const { count } = await db.event.createMany({ data });
    return NextResponse.json({ ok: true, count, message: `Added ${count} demo events.` });
  } catch (err) {
    console.error("[seed-events]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to seed events" },
      { status: 500 }
    );
  }
}
