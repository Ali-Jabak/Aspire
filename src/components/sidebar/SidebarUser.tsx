import { auth } from "@/lib/auth";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { LogOut, User } from "lucide-react";

export async function SidebarUser() {
  const session = await auth();

  if (!session?.user) return null;

  return (
    <div className="flex items-center gap-3 px-2 py-2">
      {/* Avatar */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-white text-sm font-medium">
        {session.user.name?.charAt(0).toUpperCase() ?? (
          <User size={14} />
        )}
      </div>

      {/* Name & role */}
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-white">
          {session.user.name ?? session.user.email}
        </p>
        <p className="truncate text-xs text-slate-400 capitalize">
          {session.user.role?.toLowerCase() ?? "user"}
        </p>
      </div>

      {/* Sign out */}
      <SignOutButton>
        <LogOut size={16} className="text-slate-400 hover:text-white transition-colors" />
      </SignOutButton>
    </div>
  );
}
