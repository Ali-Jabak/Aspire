import { LoginForm } from "@/components/auth/LoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm px-4">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 mb-4 shadow-lg">
          <span className="text-xl font-bold text-white">A</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-500">Sign in to your account</p>
      </div>

      {/* Card */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6">
        <LoginForm />
      </div>
    </div>
  );
}
