"use client";

import { signOut } from "next-auth/react";

interface SignOutButtonProps {
  children: React.ReactNode;
}

export function SignOutButton({ children }: SignOutButtonProps) {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="cursor-pointer"
      title="Sign out"
    >
      {children}
    </button>
  );
}
