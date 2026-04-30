import Link from 'next/link';
import { PublicNavbar } from '@/components/PublicNavbar';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <PublicNavbar />

      <main className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 55% at 50% 0%, rgba(88, 28, 135, 0.45) 0%, rgba(30, 27, 75, 0.18) 45%, rgba(9, 9, 11, 0.98) 78%, rgb(3, 7, 18) 100%)',
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="mx-auto max-w-3xl lg:max-w-5xl">
            <p className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-400">
              About Us
            </p>
            <h1 className="mt-4 text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Welcome to{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-fuchsia-400 bg-clip-text text-transparent">
                Gig-Connection.com
              </span>
            </h1>
            <p className="mt-4 text-zinc-400">
              We’re building GigConnection to make finding quality gigs (and quality talent) simple, fast, and fair.
            </p>

            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-zinc-800/80 bg-black/40 p-6">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-10 w-10 min-w-[40px] items-center justify-center rounded-full bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/25">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path
                        d="M9 18V5l12-2v13"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M9 18a3 3 0 11-6 0 3 3 0 016 0z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M21 16a3 3 0 11-6 0 3 3 0 016 0z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-white">Made by musicians</h2>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                  We’re two working musicians who struggled to break out of the local gig market. Too many cold messages, not enough
                  clarity, and no reliable way to match the right band with the right venue.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-800/80 bg-black/40 p-6">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-10 w-10 min-w-[40px] items-center justify-center rounded-full bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/25">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path
                        d="M12 21a9 9 0 100-18 9 9 0 000 18z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M3.6 9h16.8M3.6 15h16.8"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12 3c2.8 2.5 4.2 5.5 4.2 9s-1.4 6.5-4.2 9c-2.8-2.5-4.2-5.5-4.2-9S9.2 5.5 12 3z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-white">Worldwide connections</h2>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                  Our goal is to connect bands and venues world-wide — and make it easy for both sides to find the best fit.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-800/80 bg-black/40 p-6">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-10 w-10 min-w-[40px] items-center justify-center rounded-full bg-fuchsia-500/15 text-fuchsia-300 ring-1 ring-fuchsia-500/25">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path
                        d="M4 20V7a2 2 0 012-2h12a2 2 0 012 2v13"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M9 20v-6h6v6"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M8 9h.01M12 9h.01M16 9h.01"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-white">Venue promotion</h2>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                  Finalized deals become publicly visible — helping venues show real activity and giving musicians confidence when
                  choosing where to play.
                </p>
              </div>
            </div>

            <div className="mt-10 rounded-2xl border border-zinc-800 bg-black/40 p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-white sm:text-2xl">How it works</h2>
                <span className="hidden rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1 text-xs font-medium text-zinc-400 sm:inline-flex">
                  Simple. Transparent. Fast.
                </span>
              </div>
              <ol className="mt-5 grid gap-4 sm:grid-cols-2">
                <li className="group relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-gradient-to-br from-zinc-950/60 via-zinc-950/30 to-transparent p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
                  <div className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(ellipse_60%_60%_at_50%_0%,rgba(99,102,241,0.20)_0%,rgba(217,70,239,0.12)_45%,transparent_72%)]" />
                  <div className="relative">
                    <div className="flex items-center gap-3">
                      {/* <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/50 text-sm font-semibold text-zinc-100">
                        1
                      </span> */}
                      <p className="text-lg font-semibold text-white">Venues post events</p>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-zinc-300 sm:text-base">
                    Dates, details, and budget — so musicians can instantly see if it’s a fit.
                    </p>
                    <div className="pointer-events-none absolute -bottom-6 -right-4 text-[96px] font-semibold leading-none text-white/5 sm:text-[110px]">
                      1
                    </div>
                  </div>
                </li>
                <li className="group relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-gradient-to-br from-zinc-950/60 via-zinc-950/30 to-transparent p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
                  <div className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(ellipse_60%_60%_at_50%_0%,rgba(59,130,246,0.18)_0%,rgba(99,102,241,0.10)_45%,transparent_72%)]" />
                  <div className="relative">
                    <div className="flex items-center gap-3">
                      {/* <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/50 text-sm font-semibold text-zinc-100">
                        2
                      </span> */}
                      <p className="text-lg font-semibold text-white">Musicians post offerings</p>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-zinc-300 sm:text-base">
                      Availability, style, and what they’re looking for.
                    </p>
                    <div className="pointer-events-none absolute -bottom-6 -right-4 text-[96px] font-semibold leading-none text-white/5 sm:text-[110px]">
                      2
                    </div>
                  </div>
                </li>
                <li className="group relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-gradient-to-br from-zinc-950/60 via-zinc-950/30 to-transparent p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
                  <div className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(ellipse_60%_60%_at_50%_0%,rgba(168,85,247,0.18)_0%,rgba(217,70,239,0.10)_45%,transparent_72%)]" />
                  <div className="relative">
                    <div className="flex items-center gap-3">
                      {/* <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/50 text-sm font-semibold text-zinc-100">
                        3
                      </span> */}
                      <p className="text-lg font-semibold text-white">Apply and agree</p>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-zinc-300 sm:text-base">
                      Apply with a quote, review offers, and finalize when it’s a match.
                    </p>
                    <div className="pointer-events-none absolute -bottom-6 -right-4 text-[96px] font-semibold leading-none text-white/5 sm:text-[110px]">
                      3
                    </div>
                  </div>
                </li>
                <li className="group relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-gradient-to-br from-zinc-950/60 via-zinc-950/30 to-transparent p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
                  <div className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(ellipse_60%_60%_at_50%_0%,rgba(236,72,153,0.16)_0%,rgba(168,85,247,0.10)_45%,transparent_72%)]" />
                  <div className="relative">
                    <div className="flex items-center gap-3">
                      {/* <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/50 text-sm font-semibold text-zinc-100">
                        4
                      </span> */}
                      <p className="text-lg font-semibold text-white">Coordinate the gig</p>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-zinc-300 sm:text-base">
                    After finalization, both sides get the information they need to plan smoothly.
                    </p>
                    <div className="pointer-events-none absolute -bottom-6 -right-4 text-[96px] font-semibold leading-none text-white/5 sm:text-[110px]">
                      4
                    </div>
                  </div>
                </li>
              </ol>
            </div>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-8 py-3 text-base font-semibold text-white transition-colors hover:from-indigo-400 hover:to-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-zinc-950 sm:w-auto"
              >
                Create account
              </Link>
              <Link
                href="/"
                className="inline-flex w-full items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/60 px-8 py-3 text-base font-semibold text-zinc-100 transition-colors hover:border-zinc-500 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-950 sm:w-auto"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

