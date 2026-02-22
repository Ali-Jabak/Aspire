import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

const MODULES = ["library", "media", "recipe", "inventory", "event"] as const;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden. Admin only." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { email, password, name, allowedModules } = body;

    const emailStr = (email ?? "").toString().trim().toLowerCase();
    if (!emailStr) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ error: "Password is required and must be at least 6 characters" }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { email: emailStr } });
    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }

    const modules = Array.isArray(allowedModules)
      ? allowedModules.filter((m: string) => MODULES.includes(m as (typeof MODULES)[number]))
      : [...MODULES];
    if (modules.length === 0) {
      return NextResponse.json({ error: "At least one module must be selected" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await db.user.create({
      data: {
        email: emailStr,
        password: hashedPassword,
        name: (name ?? "").toString().trim() || null,
        role: "USER",
        allowedModules: modules,
      } as any,
    });

    const u = user as { id: string; email: string; name: string | null; createdAt: Date; allowedModules?: string[] };
    return NextResponse.json(
      {
        id: u.id,
        email: u.email,
        name: u.name,
        allowedModules: u.allowedModules ?? modules,
        createdAt: u.createdAt,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[admin/users POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create user" },
      { status: 500 }
    );
  }
}
