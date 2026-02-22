"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Film, Music, Gamepad2, List, Sparkles, User } from "lucide-react";

const tabs = [
  { href: "/media", label: "All", icon: List },
  { href: "/media?type=Movie", label: "Movies", icon: Film },
  { href: "/media?type=Music", label: "Music", icon: Music },
  { href: "/media?type=Game", label: "Games", icon: Gamepad2 },
  { href: "/media?status=WISHLIST", label: "Wishlist", icon: List },
  { href: "/media/ai", label: "AI Picks", icon: Sparkles },
  { href: "/media/profile", label: "My profile", icon: User },
];

export function MediaNavClient() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString() ? `?${searchParams.toString()}` : "";

  return (
    <nav className="flex items-center gap-1 flex-wrap">
      {tabs.map(({ href, label, icon: Icon }) => {
        const [path, qs] = href.includes("?") ? href.split("?") : [href, ""];
        const isActive = pathname === path && (qs ? search === `?${qs}` : !search);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium border-b-2 transition-all ${
              isActive ? "text-purple-600 border-purple-600" : "text-slate-500 border-transparent hover:text-slate-900 hover:border-slate-300"
            }`}
          >
            <Icon size={14} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
