'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';

type AdminEventDetail = {
  event: {
    _id: string;
    title: string;
    description?: string;
    date?: string;
    activeTo?: string;
    status: string;
    lookingFor?: string[];
    approximatePayment?: number;
    paymentType?: string;
    createdAt?: string;
    updatedAt?: string;
    venueId?: { _id?: string; email?: string };
  };
  venueProfile: {
    venueName?: string;
    description?: string;
    capacity?: number;
    contactEmail?: string;
    location?: { city?: string; country?: string };
  } | null;
  applicationsCount: number;
  applications: Array<{
    _id: string;
    status: string;
    quote?: number;
    createdAt: string;
    applicantId?: { email?: string; role?: string };
  }>;
};

function formatDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatMoney(n: number) {
  return `€${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4 py-2.5 border-b border-zinc-800/60 last:border-0">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 shrink-0">{label}</span>
      <span className="text-sm text-zinc-200 sm:text-right break-words">{value}</span>
    </div>
  );
}

type AdminEventDetailModalProps = {
  eventId: string | null;
  onClose: () => void;
};

export function AdminEventDetailModal({ eventId, onClose }: AdminEventDetailModalProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-event', eventId],
    queryFn: () => apiRequest<AdminEventDetail>(`/api/admin/events/${eventId}`),
    enabled: !!eventId,
  });

  const event = data?.event;
  const venue = data?.venueProfile;

  return (
    <Modal
      open={!!eventId}
      onClose={onClose}
      title={isLoading ? 'Loading event…' : event?.title || 'Event details'}
      className="max-w-lg sm:max-w-2xl"
      position="center"
    >
      {isLoading && <p className="text-sm text-zinc-500">Loading event details…</p>}
      {isError && <p className="text-sm text-red-400">Could not load event details.</p>}
      {event && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={event.status === 'ACTIVE' ? 'success' : event.status === 'EXPIRED' ? 'warning' : 'default'}>
              {event.status}
            </Badge>
            {event.lookingFor?.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>

          {event.description && (
            <p className="text-sm text-zinc-300 leading-relaxed">{event.description}</p>
          )}

          <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 px-3 py-1 sm:px-4">
            <DetailRow label="Event date" value={formatDate(event.date)} />
            <DetailRow label="Active until" value={formatDate(event.activeTo)} />
            <DetailRow
              label="Payment"
              value={
                event.approximatePayment != null
                  ? `${formatMoney(event.approximatePayment)}${event.paymentType ? ` · ${event.paymentType}` : ''}`
                  : '—'
              }
            />
            <DetailRow label="Created" value={formatDate(event.createdAt)} />
            <DetailRow label="Applications" value={data?.applicationsCount ?? 0} />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-100 mb-2">Venue</h3>
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 px-3 py-1 sm:px-4">
              <DetailRow label="Name" value={venue?.venueName || '—'} />
              <DetailRow label="Email" value={event.venueId?.email || venue?.contactEmail || '—'} />
              <DetailRow
                label="Location"
                value={
                  venue?.location?.city || venue?.location?.country
                    ? [venue.location.city, venue.location.country].filter(Boolean).join(', ')
                    : '—'
                }
              />
              {venue?.capacity != null && <DetailRow label="Capacity" value={venue.capacity} />}
              {event.venueId?._id && (
                <DetailRow
                  label="Profile"
                  value={
                    <Link href={`/profile/${event.venueId._id}`} className="text-violet-400 hover:text-violet-300">
                      View venue profile
                    </Link>
                  }
                />
              )}
            </div>
          </div>

          {data?.applications && data.applications.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-zinc-100 mb-2">Recent applications</h3>
              <div className="space-y-2">
                {data.applications.map((app) => (
                  <div
                    key={app._id}
                    className="flex flex-col gap-1 rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-zinc-200 truncate">{app.applicantId?.email || 'Unknown applicant'}</p>
                      <p className="text-xs text-zinc-500">{formatDate(app.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {app.quote != null && <span className="text-sm text-emerald-400">{formatMoney(app.quote)}</span>}
                      <Badge variant={app.status === 'FINALIZED' || app.status === 'ACCEPTED' ? 'success' : 'default'}>
                        {app.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
