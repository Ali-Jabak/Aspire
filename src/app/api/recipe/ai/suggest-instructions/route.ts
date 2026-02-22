import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, ingredients } = await request.json();
  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "AI instructions require OPENAI_API_KEY in .env" },
      { status: 503 }
    );
  }

  try {
    const ingText = Array.isArray(ingredients)
      ? ingredients.join("\n")
      : typeof ingredients === "string"
      ? ingredients
      : "";
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `Write step-by-step cooking instructions for the recipe "${title}".${ingText ? ` Use these ingredients:\n${ingText}` : ""} Return numbered steps, one per line (e.g. "1. Preheat oven...\\n2. Mix..."). No other text.`,
          },
        ],
        max_tokens: 600,
        temperature: 0.5,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || "OpenAI API error");
    }
    const data = await res.json();
    const instructions = data.choices?.[0]?.message?.content?.trim() ?? "";
    return NextResponse.json({ instructions });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI instructions failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
