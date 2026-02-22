import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const VALID = ["PENDING", "ATTENDING", "MAYBE", "DECLINED"] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: eventId } = await params;
  const event = await db.event.findUnique({ where: { id: eventId } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only invitees can RSVP (not the owner)
  const inv = await db.eventInvitation.findUnique({
    where: { eventId_userId: { eventId, userId: session.user.id } },
  });
  if (!inv) return NextResponse.json({ error: "You are not invited to this event" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const status = body.status;
  if (!status || !VALID.includes(status)) {
    return NextResponse.json(
      { error: "Invalid status. Use: PENDING, ATTENDING, MAYBE, DECLINED" },
      { status: 400 }
    );
  }

  const updated = await db.eventInvitation.update({
    where: { eventId_userId: { eventId, userId: session.user.id } },
    data: { status },
  });
  return NextResponse.json(updated);
}
