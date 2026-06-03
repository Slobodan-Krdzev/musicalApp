import Link from 'next/link';
import { PublicNavbar } from '@/components/PublicNavbar';
import { cn } from '@/lib/cn';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <PublicNavbar />

      <main className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden px-4 py-16">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 55% at 50% 20%, rgba(88, 28, 135, 0.35) 0%, rgba(30, 27, 75, 0.12) 45%, rgba(9, 9, 11, 0.98) 78%, rgb(3, 7, 18) 100%)',
          }}
        />

        <div className="relative mx-auto max-w-lg text-center">
          <p className="text-8xl font-bold tracking-tighter text-zinc-800 sm:text-9xl">404</p>
          <h1 className="mt-2 text-2xl font-bold text-zinc-50 sm:text-3xl">
            This page hit a{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              wrong note
            </span>
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-zinc-400 sm:text-base">
            The page you&apos;re looking for doesn&apos;t exist, was moved, or the link may be broken.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className={cn(
                'inline-flex w-full items-center justify-center rounded-full bg-zinc-100 px-6 py-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 sm:w-auto'
              )}
            >
              Back to homepage
            </Link>
            <Link
              href="/parties"
              className={cn(
                'inline-flex w-full items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/60 px-6 py-3 text-sm font-medium text-zinc-100 transition-colors hover:border-zinc-500 hover:bg-zinc-800 sm:w-auto'
              )}
            >
              Browse parties
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
