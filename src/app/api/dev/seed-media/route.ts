import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const DEMO_MEDIA = [
  { title: "Inception", type: "Movie", creator: "Christopher Nolan", genre: "Sci-Fi", releaseDate: new Date("2010-07-16"), status: "COMPLETED" as const, rating: 5 },
  { title: "The Dark Knight", type: "Movie", creator: "Christopher Nolan", genre: "Action", releaseDate: new Date("2008-07-18"), status: "OWNED" as const, rating: 5 },
  { title: "Interstellar", type: "Movie", creator: "Christopher Nolan", genre: "Sci-Fi", releaseDate: new Date("2014-11-07"), status: "WISHLIST" as const },
  { title: "Breaking Bad", type: "TV Show", creator: "Vince Gilligan", genre: "Drama", releaseDate: new Date("2008-01-20"), status: "COMPLETED" as const, rating: 5 },
  { title: "Abbey Road", type: "Album", creator: "The Beatles", genre: "Rock", releaseDate: new Date("1969-09-26"), status: "OWNED" as const, rating: 5 },
  { title: "Random Access Memories", type: "Album", creator: "Daft Punk", genre: "Electronic", releaseDate: new Date("2013-05-17"), status: "OWNED" as const, rating: 5 },
  { title: "The Legend of Zelda: Breath of the Wild", type: "Game", creator: "Nintendo", genre: "Adventure", releaseDate: new Date("2017-03-03"), status: "CURRENTLY_USING" as const, rating: 5 },
  { title: "Hades", type: "Game", creator: "Supergiant Games", genre: "Roguelike", releaseDate: new Date("2020-09-17"), status: "COMPLETED" as const, rating: 5 },
  { title: "Stardew Valley", type: "Game", creator: "ConcernedApe", genre: "Simulation", releaseDate: new Date("2016-02-26"), status: "OWNED" as const, rating: 5 },
  { title: "Parasite", type: "Movie", creator: "Bong Joon-ho", genre: "Thriller", releaseDate: new Date("2019-05-30"), status: "COMPLETED" as const, rating: 5 },
];

export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = DEMO_MEDIA.map((row) => ({
      ...row,
      userId: session.user.id,
    }));
    const { count } = await db.mediaItem.createMany({ data });
    return NextResponse.json({ ok: true, count, message: `Added ${count} demo media items.` });
  } catch (err) {
    console.error("[seed-media]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to seed media" },
      { status: 500 }
    );
  }
}
