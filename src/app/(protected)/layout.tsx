import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar/Sidebar";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar
        allowedModules={session.user.allowedModules ?? []}
        role={session.user.role}
      />
      <main className="flex-1 ml-64 overflow-y-auto">
        <div className="min-h-full">{children}</div>
      </main>
    </div>
  );
}
