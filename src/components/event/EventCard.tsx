"use client";

import { CalendarDays, MapPin, Clock, UserCheck, HelpCircle, XCircle } from "lucide-react";

export type RsvpStatus = "PENDING" | "ATTENDING" | "MAYBE" | "DECLINED" | null;

export interface EventSummary {
  id: string;
  title: string;
  description?: string | null;
  startDate: string;
  endDate?: string | null;
  location?: string | null;
  isAllDay: boolean;
  color?: string | null;
  isOwner?: boolean;
  rsvpStatus?: RsvpStatus;
}

const RSVP_LABELS: Record<string, string> = {
  PENDING: "Pending",
  ATTENDING: "Attending",
  MAYBE: "Maybe",
  DECLINED: "Declined",
};
const RSVP_CLASSES: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-600",
  ATTENDING: "bg-emerald-100 text-emerald-700",
  MAYBE: "bg-amber-100 text-amber-700",
  DECLINED: "bg-red-100 text-red-600",
};
const RSVP_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  PENDING: Clock,
  ATTENDING: UserCheck,
  MAYBE: HelpCircle,
  DECLINED: XCircle,
};

function formatDate(d: string, isAllDay: boolean) {
  const date = new Date(d);
  if (isAllDay) return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  return date.toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

interface Props {
  event: EventSummary;
  onClick: () => void;
}

export function EventCard({ event, onClick }: Props) {
  const RsvpIcon = event.rsvpStatus ? RSVP_ICONS[event.rsvpStatus] : null;
  const isPast = new Date(event.startDate) < new Date();

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col w-full text-left bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-red-300 transition-all overflow-hidden focus:outline-none focus:ring-2 focus:ring-red-400"
    >
      <div
        className="h-2 w-full"
        style={{ backgroundColor: event.color || "#dc2626" }}
      />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2 flex-1">
            {event.title}
          </h3>
          {event.rsvpStatus && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0 ${RSVP_CLASSES[event.rsvpStatus]}`}>
              {RsvpIcon && <RsvpIcon size={10} />}
              {RSVP_LABELS[event.rsvpStatus]}
            </span>
          )}
          {event.isOwner && !event.rsvpStatus && (
            <span className="text-[10px] font-medium text-slate-500 flex-shrink-0">Organizer</span>
          )}
        </div>
        <p className="text-xs text-slate-600 mt-1.5 flex items-center gap-1">
          <CalendarDays size={12} className="flex-shrink-0" />
          {formatDate(event.startDate, event.isAllDay)}
        </p>
        {event.location && (
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 truncate">
            <MapPin size={12} className="flex-shrink-0" />
            {event.location}
          </p>
        )}
        {isPast && (
          <p className="text-[10px] text-slate-400 mt-1">Past event</p>
        )}
      </div>
    </button>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
      <div className="h-2 bg-slate-200" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-200 rounded w-1/2" />
      </div>
    </div>
  );
}
