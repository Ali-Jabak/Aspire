import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";
import { Package } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Inventory" };

export default function InventoryPage() {
  return (
    <ModulePlaceholder
      icon={Package}
      title="Inventory"
      description="Keep track of your items, stock, and assets"
      color="text-green-600"
      bg="bg-green-50"
    />
  );
}
