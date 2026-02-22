import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";
import { Film } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Media" };

export default function MediaPage() {
  return (
    <ModulePlaceholder
      icon={Film}
      title="Media"
      description="Manage your movies, shows, podcasts and more"
      color="text-purple-600"
      bg="bg-purple-50"
    />
  );
}
