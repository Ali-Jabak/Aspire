# Aspire

A personal management hub built with **Next.js 16**, **TypeScript**, **Tailwind CSS**, **Prisma**, and **Auth.js (NextAuth v5)**. Fully deployable to Vercel with a Neon PostgreSQL database.

## Modules

| Module    | Route        | Description                              |
| --------- | ------------ | ---------------------------------------- |
| Dashboard | `/dashboard` | Overview with stats from all modules     |
| Library   | `/library`   | Books, reading lists, articles           |
| Media     | `/media`     | Movies, shows, podcasts                  |
| Recipes   | `/recipe`    | Personal recipe collection               |
| Inventory | `/inventory` | Item tracking and stock management       |
| Events    | `/event`     | Calendar and event planning              |

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **ORM**: Prisma 6
- **Database**: PostgreSQL (Neon free tier compatible)
- **Auth**: Auth.js (NextAuth v5)
- **Deployment**: Vercel (serverless, no custom server)

---

## 1. Installation

```bash
git clone <your-repo-url>
cd aspire
npm install
```

---

## 2. Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

| Variable       | Description                                              |
| -------------- | -------------------------------------------------------- |
| `DATABASE_URL` | Neon PostgreSQL connection string                        |
| `AUTH_SECRET`  | Random secret for JWT signing (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Public app URL (`http://localhost:3000` locally)         |

---

## 3. Setting Up Neon (PostgreSQL)

1. Go to [console.neon.tech](https://console.neon.tech) and create a free account.
2. Create a new **project** and **database**.
3. Copy the **connection string** from the dashboard.
4. Paste it into your `.env` as `DATABASE_URL`.

> The connection string looks like:
> `postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require`

---

## 4. Running Prisma Migrations

Generate the Prisma client and apply the schema to your database:

```bash
# Push the schema to your database (development)
npx prisma db push

# Or run migrations (production / version-controlled)
npx prisma migrate dev --name init

# Open Prisma Studio to browse data
npx prisma studio
```

---

## 5. Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You will be redirected to `/login`.

> **Tip:** Create a first user directly in Prisma Studio or by inserting a seeded row. Make sure to hash the password using `bcryptjs` before storing it.

### Seed a test user (optional)

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("password123", 12);
  await db.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@example.com",
      password,
      role: "ADMIN",
    },
  });
  console.log("Seed complete.");
}

main().finally(() => db.$disconnect());
```

Run it:

```bash
npx tsx prisma/seed.ts
```

---

## 6. Deploying to Vercel

1. Push your repository to GitHub.
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo.
3. Add the following **Environment Variables** in the Vercel dashboard:
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `NEXTAUTH_URL` (set to your Vercel deployment URL)
4. Add a **Build Command** override if needed (default `next build` works).
5. Add this to the Vercel **Post-Build** command (or run manually after deploy):

```bash
npx prisma generate && npx prisma migrate deploy
```

> Vercel runs in a serverless environment — no Express, no custom server, no background processes needed.

---

## Project Structure

```
aspire/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── layout.tsx     # Auth pages layout
│   │   │   └── login/
│   │   │       └── page.tsx   # Login page
│   │   ├── (protected)/
│   │   │   ├── layout.tsx     # Protected layout (sidebar + auth guard)
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── library/page.tsx
│   │   │   ├── media/page.tsx
│   │   │   ├── recipe/page.tsx
│   │   │   ├── inventory/page.tsx
│   │   │   └── event/page.tsx
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts   # NextAuth handler
│   │   │   └── health/route.ts               # Health check endpoint
│   │   ├── globals.css
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Root redirect
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── SignOutButton.tsx
│   │   ├── sidebar/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── SidebarItem.tsx
│   │   │   └── SidebarUser.tsx
│   │   └── ui/
│   │       └── ModulePlaceholder.tsx
│   ├── lib/
│   │   ├── auth.ts            # NextAuth configuration
│   │   ├── db.ts              # Prisma client singleton
│   │   └── utils.ts           # Shared utilities
│   ├── middleware.ts           # Route protection middleware
│   └── types/
│       └── next-auth.d.ts     # Type augmentation for NextAuth
├── .env.example
├── next.config.ts
└── README.md
```

---

## Role-Based Access

| Role    | Access                               |
| ------- | ------------------------------------ |
| `USER`  | All standard module routes           |
| `ADMIN` | All routes including `/admin/*`      |

Roles are stored in the database and included in the JWT token. Middleware enforces route-level protection.
