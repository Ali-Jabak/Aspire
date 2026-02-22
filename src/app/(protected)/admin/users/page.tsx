import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { CreateUserForm } from "@/components/admin/CreateUserForm";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-lg">
        <h1 className="text-2xl font-bold text-slate-900">Create user</h1>
        <p className="text-sm text-slate-500 mt-1">
          Add a new user account and choose which screens they can access.
        </p>
        <CreateUserForm />
      </div>
    </div>
  );
}
