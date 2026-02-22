import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";
import { ChefHat } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Recipes" };

export default function RecipePage() {
  return (
    <ModulePlaceholder
      icon={ChefHat}
      title="Recipes"
      description="Store and organise your favourite recipes"
      color="text-orange-600"
      bg="bg-orange-50"
    />
  );
}
