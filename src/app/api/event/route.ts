import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

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
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const location = searchParams.get("location") || "";
    const sort = searchParams.get("sort") || "startDate";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "24"), 48);
    const skip = (page - 1) * limit;

    const userId = session.user.id;

    // Events I own OR events I'm invited to
    const myInvitationIds = await db.eventInvitation.findMany({
      where: { userId },
      select: { eventId: true },
    });
    const invitedEventIds = myInvitationIds.map((i) => i.eventId);

    const where: Record<string, unknown> = {
      OR: [
        { userId },
        ...(invitedEventIds.length > 0 ? [{ id: { in: invitedEventIds } }] : []),
      ],
    };

    if (search) {
      where.AND = [
        ...((where.AND as object[]) ?? []),
        {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
            { location: { contains: search, mode: "insensitive" as const } },
          ],
        },
      ];
    }
    const dateConditions: object[] = [];
    if (dateFrom) {
      const from = new Date(dateFrom);
      if (!Number.isNaN(from.getTime())) dateConditions.push({ startDate: { gte: from } });
    }
    if (dateTo) {
      const to = new Date(dateTo);
      if (!Number.isNaN(to.getTime())) dateConditions.push({ startDate: { lte: to } });
    }
    if (dateConditions.length > 0) {
      where.AND = [...((where.AND as object[]) ?? []), ...dateConditions];
    }
    if (location) {
      where.AND = [...((where.AND as object[]) ?? []), { location: { contains: location, mode: "insensitive" as const } }];
    }

    const orderBy =
      sort === "title"
        ? { title: "asc" as const }
        : sort === "createdAt"
        ? { createdAt: "desc" as const }
        : { startDate: "asc" as const };

    const events = await db.event.findMany({
      where: where as never,
      orderBy,
      skip,
      take: limit,
      include: {
        invitations: {
          where: { userId },
          select: { status: true },
        },
      },
    });

    const total = await db.event.count({ where: where as never });

    const items = events.map((e) => {
      const myInv = e.invitations[0];
      return {
        id: e.id,
        title: e.title,
        description: e.description,
        startDate: e.startDate,
        endDate: e.endDate,
        location: e.location,
        isAllDay: e.isAllDay,
        color: e.color,
        userId: e.userId,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
        isOwner: e.userId === userId,
        rsvpStatus: myInv?.status ?? null,
      };
    });

    return NextResponse.json({
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("[event GET]", err);
    const status = isDbUnreachable(err) ? 503 : 500;
    const message = isDbUnreachable(err)
      ? "Database unavailable."
      : err instanceof Error ? err.message : "Failed to load events";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { title, description, startDate, endDate, location, isAllDay, color } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!startDate) {
      return NextResponse.json({ error: "Start date is required" }, { status: 400 });
    }

    const start = new Date(startDate);
    if (Number.isNaN(start.getTime())) {
      return NextResponse.json({ error: "Invalid start date" }, { status: 400 });
    }

    const end = endDate ? new Date(endDate) : null;
    if (end != null && Number.isNaN(end.getTime())) {
      return NextResponse.json({ error: "Invalid end date" }, { status: 400 });
    }

    const event = await db.event.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        startDate: start,
        endDate: end,
        location: location?.trim() || null,
        isAllDay: !!isAllDay,
        color: color?.trim() || null,
        userId: session.user.id,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (err) {
    console.error("[event POST]", err);
    const status = isDbUnreachable(err) ? 503 : 500;
    const message = isDbUnreachable(err)
      ? "Database unavailable."
      : err instanceof Error ? err.message : "Failed to create event";
    return NextResponse.json({ error: message }, { status });
  }
}
