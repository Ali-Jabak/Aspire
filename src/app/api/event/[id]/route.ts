import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

async function canAccess(eventId: string, userId: string) {
  const event = await db.event.findUnique({
    where: { id: eventId },
    include: { invitations: { include: { user: { select: { id: true, name: true, email: true } } } } },
  });
  if (!event) return { ok: false, event: null, isOwner: false };
  const isOwner = event.userId === userId;
  const invited = event.invitations.some((i) => i.userId === userId);
  return { ok: isOwner || invited, event, isOwner };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await canAccess(id, session.user.id);
  if (!result.ok || !result.event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const event = result.event;
  const myInv = event.invitations.find((i) => i.userId === session.user.id);
  const { invitations, ...rest } = event;
  return NextResponse.json({
    ...rest,
    isOwner: event.userId === session.user.id,
    rsvpStatus: myInv?.status ?? null,
    invitees: invitations.map((i) => ({
      userId: i.userId,
      status: i.status,
      userName: i.user.name,
      userEmail: i.user.email,
    })),
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await canAccess(id, session.user.id);
  if (!result.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!result.isOwner) return NextResponse.json({ error: "Only the organizer can edit this event" }, { status: 403 });

  try {
    const body = await request.json();
    const { title, description, startDate, endDate, location, isAllDay, color } = body;

    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title.trim();
    if (description !== undefined) data.description = description?.trim() || null;
    if (startDate !== undefined) {
      const d = new Date(startDate);
      if (!Number.isNaN(d.getTime())) data.startDate = d;
    }
    if (endDate !== undefined) {
      data.endDate = endDate ? new Date(endDate) : null;
    }
    if (location !== undefined) data.location = location?.trim() || null;
    if (isAllDay !== undefined) data.isAllDay = !!isAllDay;
    if (color !== undefined) data.color = color?.trim() || null;

    const event = await db.event.update({ where: { id }, data: data as never });
    return NextResponse.json(event);
  } catch (err) {
    console.error("[event PUT]", err);
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
  const event = await db.event.findFirst({ where: { id, userId: session.user.id } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.event.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
