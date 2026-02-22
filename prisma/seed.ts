import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const SAMPLE_BOOKS = [
  {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    isbn: "9780743273565",
    genre: "Fiction",
    publisher: "Scribner",
    publishedYear: 1925,
    pageCount: 180,
    language: "English",
    tags: ["classic", "american literature", "jazz age"],
    totalCopies: 4,
    availableCopies: 3,
    location: "A-1-1",
    description:
      "A story of the fabulously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan, set in the summer of 1922 on Long Island.",
  },
  {
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    isbn: "9780061935466",
    genre: "Fiction",
    publisher: "HarperCollins",
    publishedYear: 1960,
    pageCount: 336,
    language: "English",
    tags: ["classic", "justice", "pulitzer prize"],
    totalCopies: 5,
    availableCopies: 2,
    location: "A-1-2",
    description:
      "The unforgettable novel of a childhood in a sleepy Southern town and the crisis of conscience that rocked it, told through the eyes of Scout Finch.",
  },
  {
    title: "1984",
    author: "George Orwell",
    isbn: "9780451524935",
    genre: "Science Fiction",
    publisher: "Signet Classic",
    publishedYear: 1949,
    pageCount: 328,
    language: "English",
    tags: ["dystopia", "political", "classic"],
    totalCopies: 3,
    availableCopies: 1,
    location: "B-2-1",
    description:
      "A chilling prophecy about the future, set in a totalitarian society where Big Brother watches your every move and the Thought Police can read your mind.",
  },
  {
    title: "Dune",
    author: "Frank Herbert",
    isbn: "9780441013593",
    genre: "Science Fiction",
    publisher: "Ace Books",
    publishedYear: 1965,
    pageCount: 688,
    language: "English",
    tags: ["space opera", "politics", "ecology"],
    totalCopies: 2,
    availableCopies: 2,
    location: "B-2-2",
    description:
      "Set in the distant future amidst a feudal interstellar society, Dune tells the story of young Paul Atreides on the desert planet Arrakis.",
  },
  {
    title: "Sapiens: A Brief History of Humankind",
    author: "Yuval Noah Harari",
    isbn: "9780062316097",
    genre: "History",
    publisher: "Harper",
    publishedYear: 2011,
    pageCount: 443,
    language: "English",
    tags: ["history", "anthropology", "bestseller"],
    totalCopies: 3,
    availableCopies: 3,
    location: "C-3-1",
    description:
      "A groundbreaking narrative of humanity's creation and evolution that explores how biology and history have defined us and enhanced our understanding of what it means to be human.",
  },
  {
    title: "The Hitchhiker's Guide to the Galaxy",
    author: "Douglas Adams",
    isbn: "9780345391803",
    genre: "Science Fiction",
    publisher: "Del Rey",
    publishedYear: 1979,
    pageCount: 224,
    language: "English",
    tags: ["comedy", "space", "cult classic"],
    totalCopies: 2,
    availableCopies: 2,
    location: "B-2-3",
    description:
      "Seconds before Earth is demolished for a galactic freeway, Arthur Dent is plucked off the planet by his friend Ford Prefect. Together they travel the universe with just a copy of the Hitchhiker's Guide.",
  },
  {
    title: "Thinking, Fast and Slow",
    author: "Daniel Kahneman",
    isbn: "9780374533557",
    genre: "Psychology",
    publisher: "Farrar, Straus and Giroux",
    publishedYear: 2011,
    pageCount: 499,
    language: "English",
    tags: ["psychology", "behavioral economics", "decision making"],
    totalCopies: 2,
    availableCopies: 1,
    location: "D-4-1",
    description:
      "Kahneman exposes the two systems that drive the way we think: System 1 is fast, intuitive, and emotional; System 2 is slower, more deliberative, and more logical.",
  },
  {
    title: "The Alchemist",
    author: "Paulo Coelho",
    isbn: "9780062315007",
    genre: "Fiction",
    publisher: "HarperOne",
    publishedYear: 1988,
    pageCount: 208,
    language: "English",
    tags: ["inspirational", "philosophy", "journey"],
    totalCopies: 4,
    availableCopies: 4,
    location: "A-1-3",
    description:
      "A magical story about Santiago, an Andalusian shepherd boy who yearns to travel in search of a worldly treasure as extravagant as any ever found.",
  },
  {
    title: "Atomic Habits",
    author: "James Clear",
    isbn: "9780735211292",
    genre: "Self-Help",
    publisher: "Avery",
    publishedYear: 2018,
    pageCount: 320,
    language: "English",
    tags: ["productivity", "habits", "self-improvement"],
    totalCopies: 5,
    availableCopies: 3,
    location: "E-5-1",
    description:
      "A revolutionary system to get 1 percent better every day. James Clear shares practical strategies grounded in biology, psychology, and neuroscience.",
  },
  {
    title: "The Name of the Wind",
    author: "Patrick Rothfuss",
    isbn: "9780756404741",
    genre: "Fantasy",
    publisher: "DAW Books",
    publishedYear: 2007,
    pageCount: 662,
    language: "English",
    tags: ["epic fantasy", "magic", "adventure"],
    totalCopies: 2,
    availableCopies: 2,
    location: "F-6-1",
    description:
      "The tale of Kvothe—from his childhood in a troupe of traveling players to years spent as a near-feral orphan in a crime-riddled city, to his daringly brazen yet successful bid to enter a legendary school of magic.",
  },
  {
    title: "A Brief History of Time",
    author: "Stephen Hawking",
    isbn: "9780553380163",
    genre: "Science",
    publisher: "Bantam Books",
    publishedYear: 1988,
    pageCount: 212,
    language: "English",
    tags: ["physics", "cosmology", "popular science"],
    totalCopies: 2,
    availableCopies: 2,
    location: "G-7-1",
    description:
      "A landmark volume in science writing from one of the great minds of our time, Stephen Hawking's book explores such profound questions as: How did the universe begin?",
  },
  {
    title: "The Pragmatic Programmer",
    author: "David Thomas, Andrew Hunt",
    isbn: "9780135957059",
    genre: "Technology",
    publisher: "Addison-Wesley",
    publishedYear: 2019,
    pageCount: 352,
    language: "English",
    tags: ["programming", "software engineering", "career"],
    totalCopies: 3,
    availableCopies: 2,
    location: "H-8-1",
    description:
      "The classic guide for developers who want to develop their skills and broaden their understanding of the craft of programming.",
  },
  {
    title: "Pride and Prejudice",
    author: "Jane Austen",
    isbn: "9780141439518",
    genre: "Romance",
    publisher: "Penguin Classics",
    publishedYear: 1813,
    pageCount: 432,
    language: "English",
    tags: ["classic", "regency era", "romance"],
    totalCopies: 3,
    availableCopies: 3,
    location: "A-1-4",
    description:
      "The story follows the main character Elizabeth Bennet as she deals with issues of manners, upbringing, morality, education, and marriage in the society of the landed gentry of early 19th-century England.",
  },
  {
    title: "Educated",
    author: "Tara Westover",
    isbn: "9780399590504",
    genre: "Biography",
    publisher: "Random House",
    publishedYear: 2018,
    pageCount: 334,
    language: "English",
    tags: ["memoir", "education", "family"],
    totalCopies: 2,
    availableCopies: 1,
    location: "I-9-1",
    description:
      "A memoir about a young girl who, kept out of school, leaves her survivalist family and goes on to earn a PhD from Cambridge University.",
  },
  {
    title: "The Midnight Library",
    author: "Matt Haig",
    isbn: "9780525559474",
    genre: "Fiction",
    publisher: "Viking",
    publishedYear: 2020,
    pageCount: 304,
    language: "English",
    tags: ["contemporary", "philosophical", "life choices"],
    totalCopies: 3,
    availableCopies: 2,
    location: "A-1-5",
    description:
      "Between life and death there is a library. When Nora Seed finds herself there, she has a chance to undo her regrets and try out some of the lives she never lived.",
  },
  {
    title: "Clean Code",
    author: "Robert C. Martin",
    isbn: "9780132350884",
    genre: "Technology",
    publisher: "Prentice Hall",
    publishedYear: 2008,
    pageCount: 431,
    language: "English",
    tags: ["programming", "best practices", "software craft"],
    totalCopies: 4,
    availableCopies: 4,
    location: "H-8-2",
    description:
      "Even bad code can function. But if code isn't clean, it can bring a development organization to its knees. This book is packed with practical advice on writing clean, readable code.",
  },
  {
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    isbn: "9780547928227",
    genre: "Fantasy",
    publisher: "Houghton Mifflin Harcourt",
    publishedYear: 1937,
    pageCount: 310,
    language: "English",
    tags: ["fantasy", "adventure", "classic"],
    totalCopies: 5,
    availableCopies: 4,
    location: "F-6-2",
    description:
      "Bilbo Baggins is a hobbit who enjoys a comfortable, unambitious life, rarely traveling any farther than his pantry or cellar. Then one morning, Gandalf the wizard appears at his door with a group of dwarves.",
  },
  {
    title: "Becoming",
    author: "Michelle Obama",
    isbn: "9781524763138",
    genre: "Biography",
    publisher: "Crown",
    publishedYear: 2018,
    pageCount: 448,
    language: "English",
    tags: ["memoir", "politics", "inspiration"],
    totalCopies: 3,
    availableCopies: 3,
    location: "I-9-2",
    description:
      "In her memoir, Michelle Obama invites readers into her world, chronicling the experiences that have shaped her—from her childhood on the South Side of Chicago to her years as an executive balancing the demands of motherhood and work.",
  },
  {
    title: "The Power of Now",
    author: "Eckhart Tolle",
    isbn: "9781577314806",
    genre: "Self-Help",
    publisher: "New World Library",
    publishedYear: 1997,
    pageCount: 236,
    language: "English",
    tags: ["mindfulness", "spirituality", "meditation"],
    totalCopies: 2,
    availableCopies: 2,
    location: "E-5-2",
    description:
      "A guide to spiritual enlightenment that emphasizes the importance of living in the present moment and transcending thoughts of the past or future.",
  },
  {
    title: "The Silent Patient",
    author: "Alex Michaelides",
    isbn: "9781250301697",
    genre: "Mystery",
    publisher: "Celadon Books",
    publishedYear: 2019,
    pageCount: 325,
    language: "English",
    tags: ["thriller", "psychological", "mystery"],
    totalCopies: 3,
    availableCopies: 0,
    status: "CHECKED_OUT" as const,
    location: "J-10-1",
    description:
      "Alicia Berenson's life is seemingly perfect until one day she shoots her husband five times in the face and then never speaks another word.",
  },
];

async function main() {
  const hashedPassword = await bcrypt.hash("password123", 12);

  const admin = await db.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@example.com",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  const librarian = await db.user.upsert({
    where: { email: "librarian@example.com" },
    update: {},
    create: {
      name: "Librarian",
      email: "librarian@example.com",
      password: hashedPassword,
      role: "LIBRARIAN",
    },
  });

  const user = await db.user.upsert({
    where: { email: "user@example.com" },
    update: {},
    create: {
      name: "User",
      email: "user@example.com",
      password: hashedPassword,
      role: "USER",
    },
  });

  console.log("✓ Seeded:", admin.email, "(ADMIN)");
  console.log("✓ Seeded:", librarian.email, "(LIBRARIAN)");
  console.log("✓ Seeded:", user.email, "(USER)");

  // Seed books
  for (const bookData of SAMPLE_BOOKS) {
    await db.book.upsert({
      where: { isbn: bookData.isbn },
      update: {},
      create: {
        ...bookData,
        status: bookData.status ?? "AVAILABLE",
        addedByUserId: admin.id,
      },
    });
  }
  console.log(`✓ Seeded ${SAMPLE_BOOKS.length} books`);

  // Seed a checkout record for "The Silent Patient" (checked out by the regular user)
  const silentPatient = await db.book.findUnique({
    where: { isbn: "9781250301697" },
  });
  if (silentPatient) {
    await db.checkoutRecord.upsert({
      where: { id: "seed-checkout-1" },
      update: {},
      create: {
        id: "seed-checkout-1",
        bookId: silentPatient.id,
        userId: user.id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: "ACTIVE",
      },
    });
    console.log("✓ Seeded sample checkout record");
  }

  // Seed some reviews
  const greatGatsby = await db.book.findUnique({
    where: { isbn: "9780743273565" },
  });
  if (greatGatsby) {
    await db.bookReview.upsert({
      where: { bookId_userId: { bookId: greatGatsby.id, userId: user.id } },
      update: {},
      create: {
        bookId: greatGatsby.id,
        userId: user.id,
        rating: 5,
        comment:
          "A timeless classic. Fitzgerald's prose is simply beautiful. Highly recommended.",
      },
    });
  }
  console.log("✓ Seeded sample reviews");

  // Profiles for sharing collections
  await db.profile.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id, slug: "admin", displayName: "Admin", isPublic: true },
  });
  await db.profile.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id, slug: "user", displayName: "Demo User", isPublic: true },
  });
  await db.profile.upsert({
    where: { userId: librarian.id },
    update: {},
    create: { userId: librarian.id, slug: "librarian", displayName: "Librarian", isPublic: true },
  });
  console.log("✓ Seeded profiles");

  // Demo media: clear existing media for demo users, then create so re-running seed repopulates
  await db.mediaItem.deleteMany({
    where: { userId: { in: [admin.id, user.id, librarian.id] } },
  });

  const statuses = ["OWNED", "WISHLIST", "CURRENTLY_USING", "COMPLETED"] as const;
  const mediaRows: Array<{
    title: string;
    type: string;
    creator: string;
    genre: string;
    releaseDate: Date;
    status: (typeof statuses)[number];
    rating?: number;
    userId: string;
  }> = [
    // Movies — user
    { title: "Inception", type: "Movie", creator: "Christopher Nolan", genre: "Sci-Fi", releaseDate: new Date("2010-07-16"), status: "COMPLETED", rating: 5, userId: user.id },
    { title: "The Dark Knight", type: "Movie", creator: "Christopher Nolan", genre: "Action", releaseDate: new Date("2008-07-18"), status: "OWNED", rating: 5, userId: user.id },
    { title: "Interstellar", type: "Movie", creator: "Christopher Nolan", genre: "Sci-Fi", releaseDate: new Date("2014-11-07"), status: "WISHLIST", userId: user.id },
    { title: "Parasite", type: "Movie", creator: "Bong Joon-ho", genre: "Thriller", releaseDate: new Date("2019-05-30"), status: "COMPLETED", rating: 5, userId: user.id },
    { title: "Everything Everywhere All at Once", type: "Movie", creator: "Daniel Kwan", genre: "Sci-Fi", releaseDate: new Date("2022-03-25"), status: "OWNED", rating: 5, userId: user.id },
    { title: "Spirited Away", type: "Movie", creator: "Hayao Miyazaki", genre: "Animation", releaseDate: new Date("2001-07-20"), status: "COMPLETED", rating: 5, userId: user.id },
    { title: "The Shawshank Redemption", type: "Movie", creator: "Frank Darabont", genre: "Drama", releaseDate: new Date("1994-09-23"), status: "OWNED", rating: 5, userId: user.id },
    { title: "Pulp Fiction", type: "Movie", creator: "Quentin Tarantino", genre: "Crime", releaseDate: new Date("1994-10-14"), status: "COMPLETED", rating: 5, userId: user.id },
    { title: "Dune", type: "Movie", creator: "Denis Villeneuve", genre: "Sci-Fi", releaseDate: new Date("2021-10-22"), status: "WISHLIST", userId: user.id },
    { title: "The Matrix", type: "Movie", creator: "Lana Wachowski", genre: "Sci-Fi", releaseDate: new Date("1999-03-31"), status: "OWNED", rating: 5, userId: user.id },
    // TV — user
    { title: "Breaking Bad", type: "TV Show", creator: "Vince Gilligan", genre: "Drama", releaseDate: new Date("2008-01-20"), status: "COMPLETED", rating: 5, userId: user.id },
    { title: "Severance", type: "TV Show", creator: "Dan Erickson", genre: "Sci-Fi", releaseDate: new Date("2022-02-18"), status: "CURRENTLY_USING", rating: 5, userId: user.id },
    { title: "The Bear", type: "TV Show", creator: "Christopher Storer", genre: "Drama", releaseDate: new Date("2022-06-23"), status: "WISHLIST", userId: user.id },
    // Music — user
    { title: "Abbey Road", type: "Album", creator: "The Beatles", genre: "Rock", releaseDate: new Date("1969-09-26"), status: "OWNED", rating: 5, userId: user.id },
    { title: "Random Access Memories", type: "Album", creator: "Daft Punk", genre: "Electronic", releaseDate: new Date("2013-05-17"), status: "OWNED", rating: 5, userId: user.id },
    { title: "Blonde", type: "Album", creator: "Frank Ocean", genre: "R&B", releaseDate: new Date("2016-08-20"), status: "COMPLETED", rating: 5, userId: user.id },
    { title: "To Pimp a Butterfly", type: "Album", creator: "Kendrick Lamar", genre: "Hip-Hop", releaseDate: new Date("2015-03-15"), status: "OWNED", rating: 5, userId: user.id },
    { title: "Rumours", type: "Album", creator: "Fleetwood Mac", genre: "Rock", releaseDate: new Date("1977-02-04"), status: "WISHLIST", userId: user.id },
    // Games — user
    { title: "The Legend of Zelda: Breath of the Wild", type: "Game", creator: "Nintendo", genre: "Adventure", releaseDate: new Date("2017-03-03"), status: "CURRENTLY_USING", rating: 5, userId: user.id },
    { title: "Elden Ring", type: "Game", creator: "FromSoftware", genre: "RPG", releaseDate: new Date("2022-02-25"), status: "WISHLIST", userId: user.id },
    { title: "Hades", type: "Game", creator: "Supergiant Games", genre: "Roguelike", releaseDate: new Date("2020-09-17"), status: "COMPLETED", rating: 5, userId: user.id },
    { title: "Stardew Valley", type: "Game", creator: "ConcernedApe", genre: "Simulation", releaseDate: new Date("2016-02-26"), status: "OWNED", rating: 5, userId: user.id },
    { title: "Portal 2", type: "Game", creator: "Valve", genre: "Puzzle", releaseDate: new Date("2011-04-19"), status: "COMPLETED", rating: 5, userId: user.id },
    // Admin — movies & TV
    { title: "Oppenheimer", type: "Movie", creator: "Christopher Nolan", genre: "Biography", releaseDate: new Date("2023-07-21"), status: "OWNED", rating: 5, userId: admin.id },
    { title: "Succession", type: "TV Show", creator: "Jesse Armstrong", genre: "Drama", releaseDate: new Date("2018-06-03"), status: "COMPLETED", rating: 5, userId: admin.id },
    { title: "True Detective", type: "TV Show", creator: "Nic Pizzolatto", genre: "Crime", releaseDate: new Date("2014-01-12"), status: "OWNED", userId: admin.id },
    { title: "The Godfather", type: "Movie", creator: "Francis Ford Coppola", genre: "Crime", releaseDate: new Date("1972-03-24"), status: "COMPLETED", rating: 5, userId: admin.id },
    { title: "2001: A Space Odyssey", type: "Movie", creator: "Stanley Kubrick", genre: "Sci-Fi", releaseDate: new Date("1968-04-06"), status: "OWNED", rating: 5, userId: admin.id },
    { title: "Blade Runner 2049", type: "Movie", creator: "Denis Villeneuve", genre: "Sci-Fi", releaseDate: new Date("2017-10-06"), status: "WISHLIST", userId: admin.id },
    { title: "Drive", type: "Movie", creator: "Nicolas Winding Refn", genre: "Thriller", releaseDate: new Date("2011-09-16"), status: "OWNED", rating: 5, userId: admin.id },
    { title: "Arrival", type: "Movie", creator: "Denis Villeneuve", genre: "Sci-Fi", releaseDate: new Date("2016-11-11"), status: "COMPLETED", rating: 5, userId: admin.id },
    // Admin — music & games
    { title: "Kid A", type: "Album", creator: "Radiohead", genre: "Rock", releaseDate: new Date("2000-10-02"), status: "OWNED", rating: 5, userId: admin.id },
    { title: "Homogenic", type: "Album", creator: "Björk", genre: "Electronic", releaseDate: new Date("1997-09-22"), status: "OWNED", userId: admin.id },
    { title: "Disco Elysium", type: "Game", creator: "ZA/UM", genre: "RPG", releaseDate: new Date("2019-10-15"), status: "COMPLETED", rating: 5, userId: admin.id },
    { title: "Baldur's Gate 3", type: "Game", creator: "Larian Studios", genre: "RPG", releaseDate: new Date("2023-08-03"), status: "CURRENTLY_USING", rating: 5, userId: admin.id },
    { title: "Outer Wilds", type: "Game", creator: "Mobius Digital", genre: "Adventure", releaseDate: new Date("2019-05-30"), status: "COMPLETED", rating: 5, userId: admin.id },
    // Librarian — mixed
    { title: "Past Lives", type: "Movie", creator: "Celine Song", genre: "Romance", releaseDate: new Date("2023-06-02"), status: "WISHLIST", userId: librarian.id },
    { title: "Aftersun", type: "Movie", creator: "Charlotte Wells", genre: "Drama", releaseDate: new Date("2022-10-21"), status: "COMPLETED", rating: 5, userId: librarian.id },
    { title: "The Last of Us", type: "TV Show", creator: "Craig Mazin", genre: "Drama", releaseDate: new Date("2023-01-15"), status: "CURRENTLY_USING", rating: 5, userId: librarian.id },
    { title: "Fleabag", type: "TV Show", creator: "Phoebe Waller-Bridge", genre: "Comedy", releaseDate: new Date("2016-07-21"), status: "COMPLETED", rating: 5, userId: librarian.id },
    { title: "Norman Fucking Rockwell", type: "Album", creator: "Lana Del Rey", genre: "Pop", releaseDate: new Date("2019-08-30"), status: "OWNED", rating: 5, userId: librarian.id },
    { title: "Fetch the Bolt Cutters", type: "Album", creator: "Fiona Apple", genre: "Indie", releaseDate: new Date("2020-04-17"), status: "OWNED", userId: librarian.id },
    { title: "Celeste", type: "Game", creator: "Maddy Makes Games", genre: "Platformer", releaseDate: new Date("2018-01-25"), status: "COMPLETED", rating: 5, userId: librarian.id },
    { title: "Hollow Knight", type: "Game", creator: "Team Cherry", genre: "Metroidvania", releaseDate: new Date("2017-02-24"), status: "WISHLIST", userId: librarian.id },
    { title: "Podcast: How I Built This", type: "Podcast", creator: "NPR", genre: "Business", releaseDate: new Date("2016-09-12"), status: "CURRENTLY_USING", userId: librarian.id },
    { title: "Podcast: 99% Invisible", type: "Podcast", creator: "Roman Mars", genre: "Design", releaseDate: new Date("2010-08-16"), status: "OWNED", userId: librarian.id },
  ];

  const { count } = await db.mediaItem.createMany({ data: mediaRows });
  console.log(`✓ Seeded ${count} media items`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
