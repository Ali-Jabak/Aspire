import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";
import { BookOpen } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Library" };

export default function LibraryPage() {
  return (
    <ModulePlaceholder
      icon={BookOpen}
      title="Library"
      description="Track your reading list, books, and articles"
      color="text-blue-600"
      bg="bg-blue-50"
    />
  );
}
