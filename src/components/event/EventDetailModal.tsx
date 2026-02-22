"use client";

import { useState, useEffect } from "react";
import {
  X,
  Edit,
  Trash2,
  Loader2,
  CalendarDays,
  MapPin,
  UserPlus,
  UserCheck,
  HelpCircle,
  XCircle,
  Clock,
} from "lucide-react";
import type { RsvpStatus } from "./EventCard";

interface EventDetail {
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
  invitees?: { userId: string; status: string; userName?: string | null; userEmail?: string | null }[];
}

const RSVP_OPTIONS: { value: RsvpStatus; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "ATTENDING", label: "Attending" },
  { value: "MAYBE", label: "Maybe" },
  { value: "DECLINED", label: "Declined" },
];

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  ATTENDING: "Attending",
  MAYBE: "Maybe",
  DECLINED: "Declined",
};

function formatDate(d: string, isAllDay: boolean) {
  const date = new Date(d);
  if (isAllDay) return date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  return date.toLocaleString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

interface Props {
  eventId: string;
  onClose: () => void;
  onEdit?: (event: EventDetail) => void;
  onDeleted?: () => void;
  onUpdated?: () => void;
}

export function EventDetailModal({ eventId, onClose, onEdit, onDeleted, onUpdated }: Props) {
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [invitePanel, setInvitePanel] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState("");
  const [error, setError] = useState("");

  const fetchEvent = async () => {
    const res = await fetch(`/api/event/${eventId}`);
    const data = await res.json().catch(() => null);
    setEvent(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const handleRsvp = async (status: RsvpStatus) => {
    if (!event?.rsvpStatus && event?.isOwner) return; // owner doesn't RSVP
    setRsvpLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/event/${eventId}/rsvp`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
      setEvent((prev) => (prev ? { ...prev, rsvpStatus: status ?? undefined } : null));
      onUpdated?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update RSVP");
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!event || !confirm(`Delete "${event.title}"?`)) return;
    const res = await fetch(`/api/event/${eventId}`, { method: "DELETE" });
    if (res.ok) {
      onDeleted?.();
      onClose();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to delete");
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviteSubmitting(true);
    setInviteMessage("");
    try {
      const res = await fetch(`/api/event/${eventId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInviteEmail("");
      setInviteMessage(`Invited ${data.invited?.email ?? "user"}.`);
      await fetchEvent();
    } catch (e) {
      setInviteMessage(e instanceof Error ? e.message : "Failed to invite");
    } finally {
      setInviteSubmitting(false);
    }
  };

  const handleRemoveInvite = async (userId: string) => {
    try {
      await fetch(`/api/event/${eventId}/invite?userId=${encodeURIComponent(userId)}`, { method: "DELETE" });
      await fetchEvent();
    } catch {
      setInviteMessage("Failed to remove invite");
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8">
          <Loader2 className="animate-spin text-red-500" size={32} />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-white rounded-2xl p-8 text-slate-500" onClick={(ev) => ev.stopPropagation()}>
          Event not found.
        </div>
      </div>
    );
  }

  const isPast = new Date(event.startDate) < new Date();

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={(ev) => ev.target === ev.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div
          className="h-2 w-full flex-shrink-0"
          style={{ backgroundColor: event.color || "#dc2626" }}
        />
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-slate-900 truncate pr-4">{event.title}</h2>
          <div className="flex items-center gap-2">
            {event.isOwner && (
              <button
                type="button"
                onClick={() => setInvitePanel((p) => !p)}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-red-600"
                title="Invite"
                aria-label="Invite guests"
              >
                <UserPlus size={16} />
              </button>
            )}
            {event.isOwner && onEdit && (
              <button
                type="button"
                onClick={() => { onEdit(event); onClose(); }}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-red-600"
                title="Edit"
                aria-label="Edit event"
              >
                <Edit size={16} />
              </button>
            )}
            {event.isOwner && (
              <button
                type="button"
                onClick={handleDelete}
                className="p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
                title="Delete"
                aria-label="Delete event"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button type="button" onClick={onClose} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <CalendarDays size={16} className="flex-shrink-0" />
            {formatDate(event.startDate, event.isAllDay)}
          </div>
          {event.endDate && (
            <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-2">
              <Clock size={14} /> Until {formatDate(event.endDate, event.isAllDay)}
            </p>
          )}
          {event.location && (
            <p className="text-sm text-slate-600 mt-2 flex items-center gap-2">
              <MapPin size={16} className="flex-shrink-0" />
              {event.location}
            </p>
          )}

          {!event.isOwner && event.rsvpStatus != null && (
            <div className="mt-4">
              <label className="block text-xs font-medium text-slate-500 mb-1">Your response</label>
              <select
                aria-label="RSVP status"
                value={event.rsvpStatus}
                onChange={(e) => handleRsvp((e.target.value as RsvpStatus) || null)}
                disabled={rsvpLoading}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-red-400 disabled:opacity-50"
              >
                {RSVP_OPTIONS.map((o) => (
                  <option key={o.value ?? ""} value={o.value ?? ""}>{o.label}</option>
                ))}
              </select>
            </div>
          )}

          {event.isOwner && event.invitees && event.invitees.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-slate-500 mb-2">Invitees</p>
              <ul className="space-y-1.5">
                {event.invitees.map((i) => (
                  <li key={i.userId} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{i.userEmail ?? i.userName ?? i.userId}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">{STATUS_LABELS[i.status] ?? i.status}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveInvite(i.userId)}
                        className="text-red-600 text-xs hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {invitePanel && event.isOwner && (
            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-sm font-semibold text-slate-700 mb-2">Invite by email</p>
              <form onSubmit={handleInvite} className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Email address"
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  aria-label="Invitee email"
                />
                <button
                  type="submit"
                  disabled={inviteSubmitting || !inviteEmail.trim()}
                  className="flex items-center gap-1 bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  <UserPlus size={14} /> Invite
                </button>
              </form>
              {inviteMessage && <p className="text-xs mt-2 text-slate-600">{inviteMessage}</p>}
            </div>
          )}

          {event.description && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-slate-500 mb-1">Description</p>
              <p className="text-sm text-slate-600 leading-relaxed">{event.description}</p>
            </div>
          )}

          {isPast && <p className="mt-3 text-xs text-slate-400">This event has passed.</p>}
          {error && <p className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        </div>
      </div>
    </div>
  );
}
