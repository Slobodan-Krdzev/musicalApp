'use client';

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { InlineCheckout } from '@/components/subscription/InlineCheckout';
import { SUBSCRIPTION_PLANS, syncSubscription, type PlanId } from '@/lib/subscription';

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * Plan cards that mount Stripe Embedded Checkout inline when a plan is chosen.
 * On completion the subscription/auth queries are refreshed and a success state is shown.
 */
export function SubscriptionPlans({
  ctaLabel = 'Subscribe',
  onCompleted,
}: {
  ctaLabel?: string;
  onCompleted?: () => void;
}) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<PlanId | null>(null);
  const [pickedPlan, setPickedPlan] = useState<PlanId | null>(null);
  const [completed, setCompleted] = useState(false);

  const handleComplete = useCallback(
    async (_sessionId: string | null) => {
      setCompleted(true);
      try {
        await syncSubscription();
      } catch {
        // ignore — the webhook will reconcile, and we refetch below regardless
      }
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      onCompleted?.();
    },
    [queryClient, onCompleted]
  );

  if (completed) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
          <CheckIcon className="h-6 w-6 text-emerald-400" />
        </div>
        <p className="font-semibold text-emerald-200">Payment complete</p>
        <p className="mt-1 text-sm text-emerald-100/70">
          Your subscription is being activated — this can take a few seconds to appear.
        </p>
      </div>
    );
  }

  if (selected) {
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === selected);
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to plans
        </button>
        {plan && (
          <p className="text-sm text-zinc-400">
            {plan.name} — <span className="text-zinc-200">{plan.price}</span>
            <span className="text-zinc-500">{plan.cadence}</span>
          </p>
        )}
        <InlineCheckout planId={selected} onComplete={handleComplete} />
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {SUBSCRIPTION_PLANS.map((plan) => {
        const isSelected = pickedPlan === plan.id;
        return (
          <div
            key={plan.id}
            role="button"
            tabIndex={0}
            onClick={() => setPickedPlan(plan.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setPickedPlan(plan.id);
              }
            }}
            className={cn(
              'relative flex cursor-pointer flex-col rounded-2xl border bg-zinc-950/40 p-5 text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50',
              isSelected
                ? 'border-violet-500 ring-2 ring-violet-500/30'
                : 'border-zinc-800 hover:border-zinc-700'
            )}
          >
            {plan.badge && (
              <span className="absolute -top-3 right-4 rounded-full bg-violet-500 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                {plan.badge}
              </span>
            )}
            {isSelected && (
              <span className="absolute left-4 top-4 flex h-5 w-5 items-center justify-center rounded-full bg-violet-500">
                <CheckIcon className="h-3 w-3 text-white" />
              </span>
            )}
            <h3 className={cn('text-lg font-bold', isSelected ? 'text-violet-300' : 'text-white', plan.badge && 'mt-2')}>
              {plan.name}
            </h3>
            <p className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-white">{plan.price}</span>
              <span className="text-sm text-zinc-400">{plan.cadence}</span>
            </p>
            <ul className="mt-4 flex-1 space-y-2.5">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2.5 text-sm text-zinc-200">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/20">
                    <CheckIcon className="h-3 w-3 text-violet-400" />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              className="mt-5 w-full"
              variant={isSelected ? 'primary' : 'secondary'}
              onClick={(e) => {
                e.stopPropagation();
                setPickedPlan(plan.id);
                setSelected(plan.id);
              }}
            >
              {ctaLabel} {plan.name}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
