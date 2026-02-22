import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { keywords, location } = await request.json();
  const text = (keywords ?? "").toString().trim();
  if (!text) {
    return NextResponse.json({ error: "Keywords or description are required" }, { status: 400 });
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
            content: `Based on this event idea: "${text}"${location ? ` (location: ${location})` : ""}. Reply with exactly two lines separated by a newline:\nLine 1: A short, catchy event title (max 6 words).\nLine 2: A one-sentence description for the event (max 20 words). Return only these two lines, no labels.`,
          },
        ],
        max_tokens: 100,
        temperature: 0.6,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || "OpenAI API error");
    }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim() ?? "";
    const lines = content.split(/\n/).map((s: string) => s.trim()).filter(Boolean);
    return NextResponse.json({
      title: lines[0] ?? "",
      description: lines[1] ?? "",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI suggest failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
