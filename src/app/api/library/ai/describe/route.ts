import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "LIBRARIAN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, author, genre } = await request.json();
  if (!title || !author) {
    return NextResponse.json({ error: "Title and author are required" }, { status: 400 });
  }

  const openAiKey = process.env.OPENAI_API_KEY;
  if (!openAiKey) {
    return NextResponse.json(
      { error: "AI features require an OpenAI API key. Add OPENAI_API_KEY to your .env file." },
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
            content: `Write an engaging library catalog description (120–150 words) for the book "${title}" by ${author}${genre ? `, genre: ${genre}` : ""}. Be informative, appealing, and spoiler-free. Do not use the phrase "In this book". Return only the description text.`,
          },
        ],
        max_tokens: 200,
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
    const message = err instanceof Error ? err.message : "AI generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
