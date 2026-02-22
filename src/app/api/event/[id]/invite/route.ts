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
  const event = await db.event.findFirst({
    where: { id, userId: session.user.id },
    include: { invitations: { include: { user: { select: { id: true, name: true, email: true } } } } },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    invitees: event.invitations.map((i) => ({
      userId: i.userId,
      status: i.status,
      userName: i.user.name,
      userEmail: i.user.email,
    })),
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: eventId } = await params;
  const event = await db.event.findFirst({
    where: { id: eventId, userId: session.user.id },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const email = (body.email ?? "").toString().trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: "User with this email not found" }, { status: 404 });
  if (user.id === session.user.id) {
    return NextResponse.json({ error: "You cannot invite yourself" }, { status: 400 });
  }

  await db.eventInvitation.upsert({
    where: { eventId_userId: { eventId, userId: user.id } },
    create: { eventId, userId: user.id, invitedById: session.user.id },
    update: {},
  });

  return NextResponse.json({
    invited: { userId: user.id, email: user.email, name: user.name },
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: eventId } = await params;
  const event = await db.event.findFirst({
    where: { id: eventId, userId: session.user.id },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId query parameter required" }, { status: 400 });
  }

  await db.eventInvitation.deleteMany({
    where: { eventId, userId },
  });
  return NextResponse.json({ success: true });
}
