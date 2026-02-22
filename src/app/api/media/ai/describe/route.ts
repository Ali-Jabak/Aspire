import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, type, creator, genre } = await request.json();
  if (!title || !type) {
    return NextResponse.json(
      { error: "Title and type are required" },
      { status: 400 }
    );
  }

  const openAiKey = process.env.OPENAI_API_KEY;
  if (!openAiKey) {
    return NextResponse.json(
      { error: "AI description requires OPENAI_API_KEY in .env" },
      { status: 503 }
    );
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `Write a short catalog description (80–120 words) for: "${title}"${creator ? ` by ${creator}` : ""}, type: ${type}${genre ? `, genre: ${genre}` : ""}. Be engaging and spoiler-free. Return only the description.`,
          },
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || "OpenAI API error");
    }

    const data = await res.json();
    const description = data.choices?.[0]?.message?.content?.trim();
    return NextResponse.json({ description });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI description failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
