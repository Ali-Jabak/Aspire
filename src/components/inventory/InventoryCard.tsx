"use client";

import { Package, MapPin, AlertTriangle, Truck, XCircle } from "lucide-react";

export type InventoryStatus = "IN_STOCK" | "LOW_STOCK" | "ORDERED" | "DISCONTINUED";

export interface InventorySummary {
  id: string;
  name: string;
  description?: string | null;
  quantity: number;
  unit?: string | null;
  category?: string | null;
  location?: string | null;
  minQuantity?: number | null;
  status: InventoryStatus;
}

const STATUS_LABELS: Record<InventoryStatus, string> = {
  IN_STOCK: "In stock",
  LOW_STOCK: "Low stock",
  ORDERED: "Ordered",
  DISCONTINUED: "Discontinued",
};
const STATUS_CLASSES: Record<InventoryStatus, string> = {
  IN_STOCK: "bg-emerald-100 text-emerald-700",
  LOW_STOCK: "bg-amber-100 text-amber-700",
  ORDERED: "bg-blue-100 text-blue-700",
  DISCONTINUED: "bg-slate-100 text-slate-600",
};
const STATUS_ICONS: Record<InventoryStatus, React.ComponentType<{ size?: number; className?: string }>> = {
  IN_STOCK: Package,
  LOW_STOCK: AlertTriangle,
  ORDERED: Truck,
  DISCONTINUED: XCircle,
};

interface Props {
  item: InventorySummary;
  onClick: () => void;
}

export function InventoryCard({ item, onClick }: Props) {
  const StatusIcon = STATUS_ICONS[item.status];
  const isLow = item.minQuantity != null && item.quantity <= item.minQuantity && item.status !== "DISCONTINUED";

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col w-full text-left bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-green-300 transition-all overflow-hidden focus:outline-none focus:ring-2 focus:ring-green-400"
    >
      <div className="relative h-24 w-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
        <Package size={28} className="text-white/90" />
        <span className={`absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${STATUS_CLASSES[item.status]}`}>
          <StatusIcon size={10} />
          {STATUS_LABELS[item.status]}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2">{item.name}</h3>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-sm font-medium text-slate-700">
            {item.quantity}
            {item.unit ? ` ${item.unit}` : ""}
          </span>
          {isLow && item.status === "IN_STOCK" && (
            <span className="text-[10px] text-amber-600 font-medium">Below min</span>
          )}
        </div>
        {(item.category || item.location) && (
          <p className="text-xs text-slate-500 truncate mt-0.5 flex items-center gap-1">
            {item.category}
            {item.location && (
              <>
                {item.category && " · "}
                <MapPin size={10} className="flex-shrink-0" />
                {item.location}
              </>
            )}
          </p>
        )}
      </div>
    </button>
  );
}

export function InventoryCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
      <div className="h-24 bg-slate-200" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-200 rounded w-1/2" />
      </div>
    </div>
  );
}
