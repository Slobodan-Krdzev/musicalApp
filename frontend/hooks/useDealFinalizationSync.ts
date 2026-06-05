'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getDealChatSocket } from '@/lib/socket';

export type DealFinalizationPayload = {
  applicationId: string;
  status: string;
  applicantFinalizedAt: string | null;
  ownerFinalizedAt: string | null;
  fullyFinalized: boolean;
};

export function useDealFinalizationSync(applicationId: string | undefined, enabled = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !applicationId || typeof window === 'undefined') return;

    let socket;
    try {
      socket = getDealChatSocket();
    } catch {
      return;
    }

    const onUpdate = (payload: DealFinalizationPayload) => {
      if (payload.applicationId !== applicationId) return;
      queryClient.invalidateQueries({ queryKey: ['application', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    socket.on('deal:finalization_updated', onUpdate);

    return () => {
      socket.off('deal:finalization_updated', onUpdate);
    };
  }, [applicationId, enabled, queryClient]);
}
