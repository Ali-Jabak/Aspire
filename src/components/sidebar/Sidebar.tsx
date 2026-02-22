import { SidebarItem } from "./SidebarItem";
import { SidebarUser } from "./SidebarUser";
import type { Role } from "@prisma/client";

const navItems: { href: string; label: string; iconKey: string; moduleKey?: string; adminOnly?: boolean }[] = [
  { href: "/dashboard", label: "Dashboard", iconKey: "dashboard" },
  { href: "/library", label: "Library", iconKey: "library", moduleKey: "library" },
  { href: "/media", label: "Media", iconKey: "media", moduleKey: "media" },
  { href: "/recipe", label: "Recipes", iconKey: "recipe", moduleKey: "recipe" },
  { href: "/inventory", label: "Inventory", iconKey: "inventory", moduleKey: "inventory" },
  { href: "/event", label: "Events", iconKey: "event", moduleKey: "event" },
  { href: "/admin/users", label: "Create user", iconKey: "users", adminOnly: true },
];

interface SidebarProps {
  allowedModules: string[];
  role: Role;
}

export function Sidebar({ allowedModules, role }: SidebarProps) {
  const visible = navItems.filter((item) => {
    if (item.adminOnly) return role === "ADMIN";
    if (!item.moduleKey) return true; // dashboard
    return allowedModules.length === 0 || allowedModules.includes(item.moduleKey);
  });

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-slate-900 border-r border-slate-800">
      {/* Logo */}
      <div className="flex h-16 items-center px-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            <span className="text-sm font-bold text-white">A</span>
          </div>
          <span className="text-lg font-semibold text-white tracking-tight">
            Aspire
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {visible.map((item) => (
          <SidebarItem key={item.href} href={item.href} label={item.label} iconKey={item.iconKey} />
        ))}
      </nav>

      {/* Footer — user info */}
      <div className="border-t border-slate-800 p-3">
        <SidebarUser />
      </div>
    </aside>
  );
}
