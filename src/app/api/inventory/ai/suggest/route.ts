import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, category } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "AI suggestions require OPENAI_API_KEY in .env" },
      { status: 503 }
    );
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `For an inventory item named "${name.trim()}"${category ? ` (category hint: ${category})` : ""}, respond with exactly two short lines separated by a newline:\nLine 1: A single category word or short phrase (e.g. "Electronics", "Office supplies", "Pantry").\nLine 2: A one-sentence description (max 15 words) for the item. Return only these two lines, no labels or numbers.`,
          },
        ],
        max_tokens: 120,
        temperature: 0.4,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || "OpenAI API error");
    }
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim() ?? "";
    const lines = text.split(/\n/).map((s: string) => s.trim()).filter(Boolean);
    const suggestedCategory = lines[0] ?? "";
    const suggestedDescription = lines[1] ?? "";
    return NextResponse.json({ category: suggestedCategory, description: suggestedDescription });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI suggest failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
