import type { FinalizationStatus } from '@/lib/application';

export function FinalizationStatusText({
  status,
  className = '',
}: {
  status: FinalizationStatus;
  className?: string;
}) {
  if (status.isFullyFinalized) {
    return (
      <p className={`flex items-center gap-2 text-sm font-medium text-emerald-400 ${className}`}>
        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" aria-hidden />
        <span>{status.summary}</span>
      </p>
    );
  }

  if (status.waitingOnYou) {
    return (
      <p
        className={`flex items-center gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-sm font-semibold text-amber-200 ${className}`}
      >
        <span className="status-dot-shine h-2.5 w-2.5 shrink-0 rounded-full bg-amber-400" aria-hidden />
        <span>{status.summary}</span>
      </p>
    );
  }

  if (status.currentUserFinalized) {
    return (
      <p className={`flex items-center gap-2 text-sm font-medium text-zinc-400 ${className}`}>
        <span className="h-2 w-2 shrink-0 rounded-full bg-zinc-500" aria-hidden />
        <span>{status.summary}</span>
      </p>
    );
  }

  return (
    <p className={`flex items-center gap-2 text-sm font-medium text-violet-300/90 ${className}`}>
      <span className="h-2 w-2 shrink-0 rounded-full bg-violet-400/70" aria-hidden />
      <span>{status.summary}</span>
    </p>
  );
}
