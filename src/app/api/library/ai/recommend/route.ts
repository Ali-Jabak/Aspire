import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get user's checkout history to understand preferences
  const history = await db.checkoutRecord.findMany({
    where: { userId: session.user.id },
    include: { book: { select: { genre: true, author: true, tags: true, title: true } } },
    orderBy: { checkedOutAt: "desc" },
    take: 20,
  });

  // Get user's highly-rated reviews
  const topReviews = await db.bookReview.findMany({
    where: { userId: session.user.id, rating: { gte: 4 } },
    include: { book: { select: { genre: true, tags: true } } },
  });

  // Aggregate favorite genres and tags
  const genreCounts: Record<string, number> = {};
  const tagCounts: Record<string, number> = {};
  const checkedOutBookIds = new Set(history.map((h) => h.bookId));

  for (const record of history) {
    if (record.book.genre) {
      genreCounts[record.book.genre] = (genreCounts[record.book.genre] || 0) + 1;
    }
    for (const tag of record.book.tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }
  for (const review of topReviews) {
    if (review.book.genre) {
      genreCounts[review.book.genre] = (genreCounts[review.book.genre] || 0) + 2;
    }
    for (const tag of review.book.tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 2;
    }
  }

  const topGenres = Object.entries(genreCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([g]) => g);

  // Find books the user hasn't checked out yet, in preferred genres
  const candidateBooks = await db.book.findMany({
    where: {
      id: { notIn: [...checkedOutBookIds] },
      status: "AVAILABLE",
      ...(topGenres.length > 0 && { genre: { in: topGenres } }),
    },
    include: {
      reviews: { select: { rating: true } },
    },
    take: 20,
  });

  // Score books: avg rating + genre match weight
  const scored = candidateBooks.map((book) => {
    const avgRating =
      book.reviews.length > 0
        ? book.reviews.reduce((s, r) => s + r.rating, 0) / book.reviews.length
        : 3;
    const genreScore = topGenres.indexOf(book.genre ?? "") >= 0 ? 2 : 0;
    const tagScore = book.tags.reduce((s, t) => s + (tagCounts[t] || 0), 0);
    return { ...book, score: avgRating + genreScore + tagScore, avgRating };
  });

  scored.sort((a, b) => b.score - a.score);
  const recommendations = scored.slice(0, 6).map(({ reviews: _r, score: _s, ...b }) => b);

  // If user has no history, return highest-rated available books
  if (history.length === 0) {
    const topRated = await db.book.findMany({
      where: { status: "AVAILABLE" },
      include: { reviews: { select: { rating: true } } },
      take: 20,
    });
    const ratedAndSorted = topRated
      .map((b) => ({
        ...b,
        avgRating:
          b.reviews.length > 0
            ? b.reviews.reduce((s, r) => s + r.rating, 0) / b.reviews.length
            : 3,
      }))
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 6);

    return NextResponse.json({
      recommendations: ratedAndSorted.map(({ reviews: _r, ...b }) => b),
      reasoning: "Here are our highest-rated available books to get you started!",
      topGenres: [],
      hasHistory: false,
    });
  }

  // Use OpenAI for personalized reasoning message if API key is set
  let reasoning = `Based on your love of ${topGenres.join(", ")} books, you might enjoy these picks from our catalog.`;

  const openAiKey = process.env.OPENAI_API_KEY;
  if (openAiKey && recommendations.length > 0) {
    try {
      const historyText = history
        .slice(0, 5)
        .map((h) => `"${h.book.title}" (${h.book.genre})`)
        .join(", ");
      const recTitles = recommendations
        .slice(0, 3)
        .map((r) => `"${r.title}"`)
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
              content: `A library member has read: ${historyText}. We're recommending: ${recTitles}. Write one friendly, personalized sentence (max 30 words) explaining why they'll enjoy these picks. No quotes.`,
            },
          ],
          max_tokens: 60,
          temperature: 0.7,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        reasoning = data.choices?.[0]?.message?.content?.trim() ?? reasoning;
      }
    } catch {
      // fallback to rule-based reasoning
    }
  }

  return NextResponse.json({
    recommendations,
    reasoning,
    topGenres,
    hasHistory: true,
  });
}
