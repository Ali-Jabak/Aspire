import { auth } from "@/lib/auth";
import { LibraryNav } from "@/components/library/LibraryNav";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Library" };

export default async function LibraryLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = session?.user?.role;
  const isStaff = role === "ADMIN" || role === "LIBRARIAN";

  return (
    <div className="flex flex-col h-full">
      {/* Library sub-nav */}
      <div className="bg-white border-b border-slate-200 px-8">
        <LibraryNav isStaff={isStaff ?? false} />
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
