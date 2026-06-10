'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type GrantProps = {
  mode: 'grant';
  open: boolean;
  userEmail: string;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (data: { endDate: string; note: string }) => void;
};

type RevokeProps = {
  mode: 'revoke';
  open: boolean;
  userEmail: string;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (data: { note: string }) => void;
};

type Props = GrantProps | RevokeProps;

function defaultEndDate() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

export function AdminFreePassModal(props: Props) {
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [note, setNote] = useState('');

  function handleClose() {
    setNote('');
    setEndDate(defaultEndDate());
    props.onClose();
  }

  if (props.mode === 'grant') {
    return (
      <Modal open={props.open} onClose={handleClose} title="Grant Free Pass" className="max-w-md" position="center">
        <p className="mb-4 text-sm text-zinc-400">
          Give <span className="text-zinc-200">{props.userEmail}</span> complimentary access until a chosen date. Any
          active Stripe subscription will be cancelled immediately.
        </p>
        <div className="space-y-4">
          <div>
            <label htmlFor="free-pass-end" className="mb-1.5 block text-xs font-medium text-zinc-400">
              Access until
            </label>
            <Input
              id="free-pass-end"
              type="date"
              value={endDate}
              min={defaultEndDate()}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="free-pass-note" className="mb-1.5 block text-xs font-medium text-zinc-400">
              Note to user (optional)
            </label>
            <textarea
              id="free-pass-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="This message will be shown to the user in the app and by email."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
          {props.error && <p className="text-sm text-red-400">{props.error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              loading={props.loading}
              onClick={() => props.onSubmit({ endDate, note: note.trim() })}
              disabled={!endDate}
            >
              Grant Free Pass
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={props.open} onClose={handleClose} title="Revoke Free Pass" className="max-w-md" position="center">
      <p className="mb-4 text-sm text-zinc-400">
        Remove Free Pass access for <span className="text-zinc-200">{props.userEmail}</span>. The user will be notified
        by email and in-app notification.
      </p>
      <div className="space-y-4">
        <div>
          <label htmlFor="revoke-pass-note" className="mb-1.5 block text-xs font-medium text-zinc-400">
            Message to user (optional)
          </label>
          <textarea
            id="revoke-pass-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Optional explanation for the user."
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>
        {props.error && <p className="text-sm text-red-400">{props.error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="danger" loading={props.loading} onClick={() => props.onSubmit({ note: note.trim() })}>
            Revoke Free Pass
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function formatPlanLabel(planId?: string, freePassActive?: boolean) {
  if (freePassActive || planId === 'free_pass') return 'Free Pass';
  if (planId === 'free_trial') return 'Free trial';
  if (planId === 'pro') return 'Pro';
  if (planId === 'premium') return 'Premium';
  return planId?.replace('_', ' ') ?? '—';
}
