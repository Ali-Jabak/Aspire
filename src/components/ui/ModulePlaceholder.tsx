import type { LucideIcon } from "lucide-react";

interface ModulePlaceholderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  bg: string;
}

export function ModulePlaceholder({
  icon: Icon,
  title,
  description,
  color,
  bg,
}: ModulePlaceholderProps) {
  return (
    <div className="p-8">
      {/* Page header */}
      <div className="mb-8 flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${bg}`}>
          <Icon size={24} className={color} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      </div>

      {/* Placeholder content */}
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center">
        <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${bg}`}>
          <Icon size={32} className={color} />
        </div>
        <h2 className="text-lg font-semibold text-slate-700">
          {title} module coming soon
        </h2>
        <p className="mt-2 text-sm text-slate-400 max-w-sm mx-auto">
          This module is scaffolded and ready for implementation. Connect it to the database and build out the UI.
        </p>
      </div>
    </div>
  );
}
