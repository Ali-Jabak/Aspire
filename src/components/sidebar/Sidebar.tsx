import { SidebarItem } from "./SidebarItem";
import { SidebarUser } from "./SidebarUser";

const navItems = [
  { href: "/dashboard", label: "Dashboard", iconKey: "dashboard" },
  { href: "/library", label: "Library", iconKey: "library" },
  { href: "/media", label: "Media", iconKey: "media" },
  { href: "/recipe", label: "Recipes", iconKey: "recipe" },
  { href: "/inventory", label: "Inventory", iconKey: "inventory" },
  { href: "/event", label: "Events", iconKey: "event" },
];

export function Sidebar() {
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
        {navItems.map((item) => (
          <SidebarItem key={item.href} {...item} />
        ))}
      </nav>

      {/* Footer — user info */}
      <div className="border-t border-slate-800 p-3">
        <SidebarUser />
      </div>
    </aside>
  );
}
