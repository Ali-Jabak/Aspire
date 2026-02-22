"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Film,
  ChefHat,
  Package,
  CalendarDays,
  UserPlus,
} from "lucide-react";

const ICONS: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  dashboard: LayoutDashboard,
  library: BookOpen,
  media: Film,
  recipe: ChefHat,
  inventory: Package,
  event: CalendarDays,
  users: UserPlus,
};

interface SidebarItemProps {
  href: string;
  label: string;
  iconKey: string;
}

export function SidebarItem({ href, label, iconKey }: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");
  const Icon = ICONS[iconKey] ?? LayoutDashboard;

  return (
    <Link
      href={href}
      className={[
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
        isActive
          ? "bg-indigo-600 text-white shadow-sm"
          : "text-slate-300 hover:bg-slate-700 hover:text-white",
      ].join(" ")}
    >
      <Icon size={18} strokeWidth={1.8} />
      <span>{label}</span>
    </Link>
  );
}
