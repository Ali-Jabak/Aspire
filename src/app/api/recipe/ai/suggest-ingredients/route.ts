import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, cuisine, servings } = await request.json();
  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
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
            content: `List ingredients for the recipe "${title}"${cuisine ? ` (${cuisine} cuisine)` : ""}${servings ? ` for ${servings} servings` : ""}. Return a plain list, one ingredient per line (e.g. "2 cups flour\\n1 tsp salt"). No numbering or bullets.`,
          },
        ],
        max_tokens: 400,
        temperature: 0.5,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || "OpenAI API error");
    }
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim() ?? "";
    const ingredients = text
      .split(/\n+/)
      .map((s: string) => s.replace(/^[\d\.\-\*]+\s*/, "").trim())
      .filter(Boolean);
    return NextResponse.json({ ingredients });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI suggest failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
