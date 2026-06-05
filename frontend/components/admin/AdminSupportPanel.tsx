'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

type SupportTicketRow = {
  _id: string;
  ticketNumber: string;
  subject: string;
  message: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  adminNote?: string;
  createdAt: string;
  resolvedAt?: string;
  userId?: { email?: string; role?: string };
  resolvedBy?: { email?: string };
};

const STATUSES = ['ALL', 'PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;

const STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
  PENDING: 'warning',
  IN_PROGRESS: 'default',
  RESOLVED: 'success',
  CLOSED: 'success',
};

function formatDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatStatus(status: string) {
  return status.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

export function AdminSupportPanel() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<SupportTicketRow['status']>('PENDING');
  const [adminNote, setAdminNote] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-support-tickets', statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      params.set('limit', '50');
      return apiRequest<{ tickets: SupportTicketRow[]; pendingCount: number }>(`/api/admin/support/tickets?${params}`);
    },
  });

  const { data: ticketDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['admin-support-ticket', selectedId],
    queryFn: () => apiRequest<{ ticket: SupportTicketRow }>(`/api/admin/support/tickets/${selectedId}`).then((r) => r.ticket),
    enabled: !!selectedId,
  });

  useEffect(() => {
    if (ticketDetail) {
      setEditStatus(ticketDetail.status);
      setAdminNote(ticketDetail.adminNote || '');
    }
  }, [ticketDetail]);

  const updateMutation = useMutation({
    mutationFn: (body: { status: SupportTicketRow['status']; adminNote?: string }) =>
      apiRequest(`/api/admin/support/tickets/${selectedId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['admin-support-ticket', selectedId] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  const openTicket = (ticket: SupportTicketRow) => {
    setSelectedId(ticket._id);
    setEditStatus(ticket.status);
    setAdminNote(ticket.adminNote || '');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-medium sm:px-3 sm:py-1.5 sm:text-xs ${
              statusFilter === s ? 'bg-violet-500 text-white' : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            {s === 'ALL' ? 'All' : formatStatus(s)}
          </button>
        ))}
        {data?.pendingCount != null && data.pendingCount > 0 && (
          <Badge variant="warning">{data.pendingCount} open</Badge>
        )}
      </div>

      {isLoading ? (
        <Card><CardContent className="p-6 text-sm text-zinc-500">Loading tickets…</CardContent></Card>
      ) : !data?.tickets?.length ? (
        <Card><CardContent className="p-6 text-sm text-zinc-500">No support tickets found.</CardContent></Card>
      ) : (
        <>
          <div className="space-y-2 md:hidden">
            {data.tickets.map((t) => (
              <button
                key={t._id}
                type="button"
                onClick={() => openTicket(t)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-left hover:border-violet-500/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-100 truncate">{t.subject}</p>
                    <p className="text-xs text-zinc-500 mt-1">{t.userId?.email}</p>
                    <p className="text-xs font-mono text-zinc-600 mt-0.5">{t.ticketNumber}</p>
                  </div>
                  <Badge variant={STATUS_VARIANT[t.status]}>{formatStatus(t.status)}</Badge>
                </div>
              </button>
            ))}
          </div>

          <Card className="hidden md:block">
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-zinc-500 border-b border-zinc-800">
                    {['Ticket', 'User', 'Subject', 'Status', 'Created'].map((h) => (
                      <th key={h} className="py-3 px-4 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.tickets.map((t) => (
                    <tr
                      key={t._id}
                      onClick={() => openTicket(t)}
                      className="border-b border-zinc-800/50 cursor-pointer hover:bg-zinc-800/30"
                    >
                      <td className="py-3 px-4 font-mono text-xs text-zinc-400">{t.ticketNumber}</td>
                      <td className="py-3 px-4 text-zinc-400">{t.userId?.email || '—'}</td>
                      <td className="py-3 px-4 text-zinc-200">{t.subject}</td>
                      <td className="py-3 px-4"><Badge variant={STATUS_VARIANT[t.status]}>{formatStatus(t.status)}</Badge></td>
                      <td className="py-3 px-4 text-zinc-500">{formatDate(t.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}

      <Modal
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
        title={detailLoading ? 'Loading…' : ticketDetail?.subject || 'Support ticket'}
        className="max-w-lg sm:max-w-2xl"
        position="center"
      >
        {detailLoading && <p className="text-sm text-zinc-500">Loading ticket…</p>}
        {ticketDetail && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge variant={STATUS_VARIANT[ticketDetail.status]}>{formatStatus(ticketDetail.status)}</Badge>
              <span className="text-zinc-500 font-mono">{ticketDetail.ticketNumber}</span>
            </div>
            <div className="rounded-lg bg-zinc-950/50 border border-zinc-800 px-3 py-2 text-sm">
              <p className="text-zinc-500 text-xs">From</p>
              <p className="text-zinc-200">{ticketDetail.userId?.email} ({ticketDetail.userId?.role})</p>
              <p className="text-zinc-500 text-xs mt-2">Submitted</p>
              <p className="text-zinc-300">{formatDate(ticketDetail.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 mb-1">Message</p>
              <p className="text-sm text-zinc-300 whitespace-pre-wrap rounded-lg bg-zinc-950/50 border border-zinc-800 p-3">
                {ticketDetail.message}
              </p>
            </div>

            <div>
              <label htmlFor="admin-ticket-status" className="block text-sm text-zinc-400 mb-1.5">Status</label>
              <select
                id="admin-ticket-status"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as SupportTicketRow['status'])}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100"
              >
                {STATUSES.filter((s) => s !== 'ALL').map((s) => (
                  <option key={s} value={s}>{formatStatus(s)}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="admin-ticket-note" className="block text-sm text-zinc-400 mb-1.5">Note to user (optional)</label>
              <textarea
                id="admin-ticket-note"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Add a response or resolution note…"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600"
              />
            </div>

            {updateMutation.isError && <p className="text-sm text-red-400">Could not update ticket.</p>}
            {updateMutation.isSuccess && <p className="text-sm text-emerald-400">Ticket updated. User has been notified.</p>}

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => setSelectedId(null)}>Close</Button>
              <Button
                onClick={() =>
                  updateMutation.mutate({
                    status: editStatus,
                    adminNote: adminNote.trim() || undefined,
                  })
                }
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Saving…' : 'Save & notify user'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
