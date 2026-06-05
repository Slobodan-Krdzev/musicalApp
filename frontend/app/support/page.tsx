'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';

type SupportTicket = {
  _id: string;
  ticketNumber: string;
  subject: string;
  message: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
};

type SupportContact = {
  email: string;
  phone: string | null;
};

const STATUS_VARIANT: Record<SupportTicket['status'], 'default' | 'success' | 'warning' | 'danger'> = {
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

export default function SupportPage() {
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [submittedTicket, setSubmittedTicket] = useState<SupportTicket | null>(null);

  const { data: contact } = useQuery({
    queryKey: ['support-contact'],
    queryFn: () => apiRequest<{ contact: SupportContact }>('/api/support/contact').then((r) => r.contact),
  });

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: () => apiRequest<{ tickets: SupportTicket[] }>('/api/support').then((r) => r.tickets),
  });

  const createMutation = useMutation({
    mutationFn: (body: { subject: string; message: string }) =>
      apiRequest<{ ticket: SupportTicket }>('/api/support', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: (data) => {
      setSubmittedTicket(data.ticket);
      setSubject('');
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ subject: subject.trim(), message: message.trim() });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-100">Support</h1>
        <p className="text-sm text-zinc-500 mt-1">Contact our team or track your open requests.</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-zinc-100">Contact us</h2>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between rounded-lg bg-zinc-800/40 px-4 py-3">
            <span className="text-zinc-500">Email</span>
            <a href={`mailto:${contact?.email || 'connectiongig@gmail.com'}`} className="text-violet-400 hover:text-violet-300 break-all">
              {contact?.email || 'connectiongig@gmail.com'}
            </a>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between rounded-lg bg-zinc-800/40 px-4 py-3">
            <span className="text-zinc-500">Phone</span>
            <span className="text-zinc-300">
              {contact?.phone ? (
                <a href={`tel:${contact.phone}`} className="text-violet-400 hover:text-violet-300">
                  {contact.phone}
                </a>
              ) : (
                'Coming soon'
              )}
            </span>
          </div>
        </CardContent>
      </Card>

      {submittedTicket && (
        <Card className="border-emerald-500/30 bg-emerald-950/20">
          <CardContent className="p-4 sm:p-5">
            <p className="text-sm font-medium text-emerald-300">Ticket submitted successfully</p>
            <p className="text-sm text-zinc-300 mt-1">
              Reference <span className="font-mono text-zinc-100">{submittedTicket.ticketNumber}</span> — we sent a confirmation to your email and notified our support team.
            </p>
            <button
              type="button"
              onClick={() => setSubmittedTicket(null)}
              className="mt-3 text-xs text-zinc-500 hover:text-zinc-300"
            >
              Dismiss
            </button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-zinc-100">Submit a ticket</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="support-subject" className="block text-sm text-zinc-400 mb-1.5">
                Subject
              </label>
              <Input
                id="support-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of your issue"
                required
                minLength={3}
                maxLength={200}
              />
            </div>
            <div>
              <label htmlFor="support-message" className="block text-sm text-zinc-400 mb-1.5">
                Message
              </label>
              <textarea
                id="support-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue in detail…"
                required
                minLength={10}
                maxLength={5000}
                rows={5}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
            {createMutation.isError && (
              <p className="text-sm text-red-400">Could not submit ticket. Please try again.</p>
            )}
            <Button type="submit" disabled={createMutation.isPending} className="w-full sm:w-auto">
              {createMutation.isPending ? 'Submitting…' : 'Submit ticket'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold text-zinc-100 mb-3">Your tickets</h2>
        {isLoading ? (
          <p className="text-sm text-zinc-500">Loading tickets…</p>
        ) : !tickets?.length ? (
          <Card>
            <CardContent className="p-6 text-sm text-zinc-500">No tickets yet. Submit one above if you need help.</CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {tickets.map((ticket) => {
              const expanded = expandedId === ticket._id;
              return (
                <Card key={ticket._id} className="overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : ticket._id)}
                    className="w-full text-left px-4 py-3 sm:px-5 sm:py-4 hover:bg-zinc-800/20 transition-colors"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-medium text-zinc-100 truncate">{ticket.subject}</p>
                        <p className="text-xs text-zinc-500 mt-1 font-mono">{ticket.ticketNumber}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={STATUS_VARIANT[ticket.status]}>{formatStatus(ticket.status)}</Badge>
                        <span className="text-xs text-zinc-500">{formatDate(ticket.createdAt)}</span>
                      </div>
                    </div>
                  </button>
                  {expanded && (
                    <CardContent className="border-t border-zinc-800/80 pt-4 pb-4 sm:px-5">
                      <p className="text-sm text-zinc-300 whitespace-pre-wrap">{ticket.message}</p>
                      {ticket.adminNote && (
                        <div className="mt-4 rounded-lg bg-violet-950/30 border border-violet-500/20 px-3 py-2.5">
                          <p className="text-xs font-medium text-violet-300 mb-1">Response from support</p>
                          <p className="text-sm text-zinc-300 whitespace-pre-wrap">{ticket.adminNote}</p>
                        </div>
                      )}
                      {ticket.resolvedAt && (
                        <p className="text-xs text-zinc-500 mt-3">Resolved {formatDate(ticket.resolvedAt)}</p>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
