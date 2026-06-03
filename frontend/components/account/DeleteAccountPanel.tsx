'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

type DeleteAccountPanelProps = {
  onDeleted: () => void;
};

export function DeleteAccountPanel({ onDeleted }: DeleteAccountPanelProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [password, setPassword] = useState('');

  const deleteMutation = useMutation({
    mutationFn: () =>
      apiRequest<{ message: string }>('/api/users/me/account', {
        method: 'DELETE',
        body: JSON.stringify({ password }),
      }),
    onSuccess: () => {
      setConfirmOpen(false);
      onDeleted();
    },
  });

  function handleDelete() {
    if (!password.trim()) return;
    deleteMutation.mutate();
  }

  return (
    <>
      <Card className="border-red-500/20">
        <CardHeader>
          <h2 className="text-lg font-semibold text-zinc-100">Delete account</h2>
          <p className="text-sm text-zinc-400">
            Permanently remove your profile, listings, applications, and subscription data. This cannot be undone.
          </p>
        </CardHeader>
        <CardContent>
          <Button variant="danger" onClick={() => setConfirmOpen(true)}>
            Delete my profile
          </Button>
        </CardContent>
      </Card>

      <Modal
        open={confirmOpen}
        onClose={() => {
          if (deleteMutation.isPending) return;
          setConfirmOpen(false);
          setPassword('');
          deleteMutation.reset();
        }}
        title="Delete your account?"
        className="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-400">
            This will permanently delete your GigConnection account, profile, events, offerings, and related data.
          </p>
          <Input
            label="Confirm with your password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={deleteMutation.error?.message}
          />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="ghost"
              onClick={() => {
                setConfirmOpen(false);
                setPassword('');
                deleteMutation.reset();
              }}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleteMutation.isPending}
              disabled={!password.trim()}
              onClick={handleDelete}
            >
              Delete permanently
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
