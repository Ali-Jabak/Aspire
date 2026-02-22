import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await db.mediaItem.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const genreCounts: Record<string, number> = {};
  const typeCounts: Record<string, number> = {};
  for (const item of items) {
    if (item.genre) genreCounts[item.genre] = (genreCounts[item.genre] || 0) + 1;
    typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;
  }

  const topGenres = Object.entries(genreCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([g]) => g);
  const topTypes = Object.entries(typeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([t]) => t);

  const reasoning =
    topGenres.length || topTypes.length
      ? `Based on your collection (${items.length} items), we're highlighting ${[...topTypes, ...topGenres].join(", ")}.`
      : "Add more items to get personalized picks!";

  const openAiKey = process.env.OPENAI_API_KEY;
  let recReasoning = reasoning;
  if (openAiKey && items.length > 0) {
    try {
      const summary = items
        .slice(0, 8)
        .map((i) => `"${i.title}" (${i.type}${i.genre ? `, ${i.genre}` : ""})`)
        .join(", ");
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
              content: `A user's media collection includes: ${summary}. Write one short friendly sentence (max 25 words) suggesting they might enjoy similar titles. No quotes.`,
            },
          ],
          max_tokens: 50,
          temperature: 0.7,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        recReasoning = data.choices?.[0]?.message?.content?.trim() || reasoning;
      }
    } catch {
      // keep default
    }
  }

  return NextResponse.json({
    reasoning: recReasoning,
    topGenres,
    topTypes,
    totalItems: items.length,
  });
}
