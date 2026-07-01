import Link from 'next/link';
import { CursorGlow } from '@/components/about/CursorGlow';
import { cn } from '@/lib/cn';

export function FreeTrialSection() {
  return (
    <section className="relative overflow-hidden border-t border-zinc-800/60 bg-zinc-950 px-4 py-16 sm:py-24">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 70% at 50% 50%, rgba(99, 102, 241, 0.22) 0%, rgba(139, 92, 246, 0.12) 40%, rgba(9, 9, 11, 0.98) 75%)',
        }}
      />
      <div className="relative mx-auto max-w-3xl">
        <CursorGlow glow="indigo" className="rounded-3xl border-zinc-800/80 bg-black/50 p-8 text-center sm:p-12">
          <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">
            Free Pass
          </span>
          <h2 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Try it now for{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              15 free days
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            Explore full platform access — post gigs, apply to events, and connect with venues or musicians before you
            choose a plan.
          </p>
          <Link
            href="/register"
            className={cn(
              'mt-8 inline-flex items-center justify-center rounded-full bg-violet-500 px-8 py-3.5 text-base font-semibold text-white transition-colors',
              'hover:bg-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-zinc-950'
            )}
          >
            Start your free trial
          </Link>
        </CursorGlow>
      </div>
    </section>
  );
}
