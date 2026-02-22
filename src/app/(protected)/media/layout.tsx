import { Suspense } from "react";
import { MediaNavClient } from "./MediaNavClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Media" };

// Media is personalized per user; do not prerender at build time
export const dynamic = "force-dynamic";

export default function MediaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-slate-200 px-6">
        <Suspense fallback={<div className="h-12" />}>
          <MediaNavClient />
        </Suspense>
      </div>
      <div className="flex-1 overflow-y-auto">
        <Suspense fallback={<div className="p-8 flex justify-center">Loading…</div>}>
          {children}
        </Suspense>
      </div>
    </div>
  );
}
