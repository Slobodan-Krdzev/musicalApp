'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { SubscriptionPlans } from '@/components/subscription/SubscriptionPlans';
import type { Subscription } from '@/lib/subscription';

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008M10.34 3.94 1.7 18a1.5 1.5 0 0 0 1.3 2.25h18a1.5 1.5 0 0 0 1.3-2.25L13.66 3.94a1.5 1.5 0 0 0-2.6 0Z" />
    </svg>
  );
}

/**
 * Shown at the top of the dashboard when the user's subscription has ended (expired/canceled),
 * prompting them to renew. Opens a modal with plan options that start Stripe checkout.
 */
export function RenewSubscriptionBanner({ sub }: { sub: Subscription | null }) {
  const [open, setOpen] = useState(false);

  // Only prompt users who previously had a plan that has now lapsed.
  const expired = !!sub && sub.isExpired === true;
  if (!expired) return null;

  const wasTrial = sub?.planId === 'free_trial';
  const wasFreePass = sub?.planId === 'free_pass';
  const title = wasTrial ? 'Your free trial has ended' : wasFreePass ? 'Your Free Pass has ended' : 'Your subscription has ended';

  return (
    <>
      <div className="flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
            <WarningIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold text-amber-200">{title}</p>
            <p className="text-sm text-amber-100/70">
              Renew now to keep creating listings, applying, and connecting.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
        >
          Renew subscription
        </button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Choose your plan" className="max-w-2xl" position="center">
        <p className="mb-4 text-sm text-zinc-400">
          Pick a plan to renew. Payment is completed securely below — you won&apos;t leave this page.
        </p>
        <SubscriptionPlans ctaLabel="Renew" />
      </Modal>
    </>
  );
}
