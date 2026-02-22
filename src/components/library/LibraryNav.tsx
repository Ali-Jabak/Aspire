"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, History, Sparkles, ShieldCheck } from "lucide-react";

interface Props {
  isStaff: boolean;
}

export function LibraryNav({ isStaff }: Props) {
  const pathname = usePathname();

  const tabs = [
    { href: "/library", label: "Catalog", icon: BookOpen },
    { href: "/library/my-checkouts", label: "My Checkouts", icon: History },
    { href: "/library/ai", label: "AI Picks", icon: Sparkles },
    ...(isStaff ? [{ href: "/library/admin", label: "Admin Panel", icon: ShieldCheck }] : []),
  ];

  return (
    <nav className="flex items-center gap-1">
      {tabs.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium transition-all border-b-2 ${
              isActive
                ? "text-indigo-600 border-indigo-600"
                : "text-slate-500 border-transparent hover:text-slate-900 hover:border-slate-300"
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
