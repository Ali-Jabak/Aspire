import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";
import { CalendarDays } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Events" };

export default function EventPage() {
  return (
    <ModulePlaceholder
      icon={CalendarDays}
      title="Events"
      description="Plan and schedule your upcoming events"
      color="text-red-600"
      bg="bg-red-50"
    />
  );
}
