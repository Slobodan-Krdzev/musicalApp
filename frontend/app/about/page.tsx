import Link from 'next/link';
import { PublicNavbar } from '@/components/PublicNavbar';
import { SiteFooter } from '@/components/Layout/SiteFooter';
import { CursorGlow } from '@/components/about/CursorGlow';
import { TeamSection } from '@/components/about/TeamSection';
import { SupportSection } from '@/components/about/SupportSection';
import { createPageMetadata } from '@/lib/metadata';
import { cn } from '@/lib/cn';

export const metadata = createPageMetadata({
  title: 'About Us',
  description:
    'Learn how GigConnection helps musicians and venues book live gigs, manage applications, and build lasting partnerships in the live music industry.',
  path: '/about',
});

function reveal(delayMs: number, className?: string) {
  return cn(
    'animate-in fade-in slide-in-from-bottom-4 duration-700',
    className,
    `[animation-delay:${delayMs}ms]`
  );
}

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      <PublicNavbar />

      <main className="relative flex-1 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 55% at 50% 0%, rgba(88, 28, 135, 0.45) 0%, rgba(30, 27, 75, 0.18) 45%, rgba(9, 9, 11, 0.98) 78%, rgb(3, 7, 18) 100%)',
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="mx-auto max-w-3xl lg:max-w-5xl">
            <CursorGlow
              revealClassName={reveal(0)}
              glow="violet"
              className="inline-flex rounded-full border-zinc-800/80 bg-zinc-900/60"
            >
              <p className="inline-flex items-center px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-400">
                About Us
              </p>
            </CursorGlow>
            <h1 className={reveal(80, 'mt-4 text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl')}>
              Welcome to{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-fuchsia-400 bg-clip-text text-transparent">
                Gig-Connection.com
              </span>
            </h1>
            <p className={reveal(160, 'mt-4 text-zinc-400')}>
              We’re building GigConnection to make finding quality gigs (and quality talent) simple, fast, and fair.
            </p>

            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <CursorGlow
                revealClassName={reveal(240)}
                glow="violet"
                className="rounded-2xl border-zinc-800/80 bg-black/40 p-6"
              >
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
              </CursorGlow>
              <CursorGlow
                revealClassName={reveal(320)}
                glow="indigo"
                className="rounded-2xl border-zinc-800/80 bg-black/40 p-6"
              >
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
              </CursorGlow>
              <CursorGlow
                revealClassName={reveal(400)}
                glow="fuchsia"
                className="rounded-2xl border-zinc-800/80 bg-black/40 p-6 md:col-span-2 lg:col-span-1"
              >
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
              </CursorGlow>
            </div>

            <div className={reveal(480, 'mt-10 rounded-2xl border border-zinc-800 bg-black/40 p-6 sm:p-8')}>
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-white sm:text-2xl">How it works</h2>
                <span className="hidden rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1 text-xs font-medium text-zinc-400 sm:inline-flex">
                  Simple. Transparent. Fast.
                </span>
              </div>
              <ol className="mt-5 grid gap-4 sm:grid-cols-2">
                <CursorGlow
                  as="li"
                  revealClassName={reveal(560)}
                  glow="indigo"
                  className="rounded-2xl border-zinc-800/80 bg-gradient-to-br from-zinc-950/60 via-zinc-950/30 to-transparent p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
                >
                  <div className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(ellipse_60%_60%_at_50%_0%,rgba(99,102,241,0.20)_0%,rgba(217,70,239,0.12)_45%,transparent_72%)]" />
                  <div className="relative">
                    <p className="text-lg font-semibold text-white">Venues post events</p>
                    <p className="mt-3 text-sm leading-relaxed text-zinc-300 sm:text-base">
                      Dates, details, and budget — so musicians can instantly see if it’s a fit.
                    </p>
                    <div className="pointer-events-none absolute -bottom-6 -right-4 text-[96px] font-semibold leading-none text-white/5 sm:text-[110px]">
                      1
                    </div>
                  </div>
                </CursorGlow>
                <CursorGlow
                  as="li"
                  revealClassName={reveal(640)}
                  glow="blue"
                  className="rounded-2xl border-zinc-800/80 bg-gradient-to-br from-zinc-950/60 via-zinc-950/30 to-transparent p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
                >
                  <div className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(ellipse_60%_60%_at_50%_0%,rgba(59,130,246,0.18)_0%,rgba(99,102,241,0.10)_45%,transparent_72%)]" />
                  <div className="relative">
                    <p className="text-lg font-semibold text-white">Musicians post offerings</p>
                    <p className="mt-3 text-sm leading-relaxed text-zinc-300 sm:text-base">
                      Availability, style, and what they’re looking for.
                    </p>
                    <div className="pointer-events-none absolute -bottom-6 -right-4 text-[96px] font-semibold leading-none text-white/5 sm:text-[110px]">
                      2
                    </div>
                  </div>
                </CursorGlow>
                <CursorGlow
                  as="li"
                  revealClassName={reveal(720)}
                  glow="purple"
                  className="rounded-2xl border-zinc-800/80 bg-gradient-to-br from-zinc-950/60 via-zinc-950/30 to-transparent p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
                >
                  <div className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(ellipse_60%_60%_at_50%_0%,rgba(168,85,247,0.18)_0%,rgba(217,70,239,0.10)_45%,transparent_72%)]" />
                  <div className="relative">
                    <p className="text-lg font-semibold text-white">Apply and agree</p>
                    <p className="mt-3 text-sm leading-relaxed text-zinc-300 sm:text-base">
                      Apply with a quote, review offers, and finalize when it’s a match.
                    </p>
                    <div className="pointer-events-none absolute -bottom-6 -right-4 text-[96px] font-semibold leading-none text-white/5 sm:text-[110px]">
                      3
                    </div>
                  </div>
                </CursorGlow>
                <CursorGlow
                  as="li"
                  revealClassName={reveal(800)}
                  glow="pink"
                  className="rounded-2xl border-zinc-800/80 bg-gradient-to-br from-zinc-950/60 via-zinc-950/30 to-transparent p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
                >
                  <div className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(ellipse_60%_60%_at_50%_0%,rgba(236,72,153,0.16)_0%,rgba(168,85,247,0.10)_45%,transparent_72%)]" />
                  <div className="relative">
                    <p className="text-lg font-semibold text-white">Coordinate the gig</p>
                    <p className="mt-3 text-sm leading-relaxed text-zinc-300 sm:text-base">
                      After finalization, both sides get the information they need to plan smoothly.
                    </p>
                    <div className="pointer-events-none absolute -bottom-6 -right-4 text-[96px] font-semibold leading-none text-white/5 sm:text-[110px]">
                      4
                    </div>
                  </div>
                </CursorGlow>
              </ol>
            </div>

            <CursorGlow
              as="section"
              revealClassName={reveal(880)}
              glow="violet"
              className="mt-10 rounded-2xl border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-black/40 to-zinc-950 p-6 sm:p-8"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
                <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold text-white sm:text-2xl">We don&apos;t just connect gigs — we help promote them</h2>
                  <div className="mt-4 space-y-4 text-sm leading-relaxed text-zinc-300 sm:text-base">
                    <p>
                      Booking the right match is only half the story. Once a deal is finalized on GigConnection, the event becomes
                      part of our public <strong className="font-medium text-zinc-100">Parties</strong> experience — a curated view of
                      upcoming live music near you. That means your show isn&apos;t locked inside private messages; it gets real visibility
                      with people who are actively looking for a night out.
                    </p>
                    <p>
                      For <strong className="font-medium text-zinc-100">venues</strong>, that extra exposure helps fill the room, build
                      a reputation for consistent programming, and turn one-off bookings into repeat audiences. For{' '}
                      <strong className="font-medium text-zinc-100">musicians and bands</strong>, it&apos;s a chance to be discovered
                      beyond your existing fan base — new listeners find you through the event, not just through social posts you have
                      to push yourself.
                    </p>
                    <p>
                      We also reach subscribers through our party newsletter, highlighting upcoming gigs matched to their location so
                      the right crowd hears about the right show at the right time. GigConnection was built by working musicians who
                      know how hard it is to get noticed; promotion is built into the platform so both sides benefit from the connection
                      long after the deal is agreed.
                    </p>
                  </div>
                  <Link
                    href="/parties"
                    className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-violet-300 transition-colors hover:text-violet-200"
                  >
                    Browse upcoming parties
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </div>
              </div>
            </CursorGlow>

            <TeamSection />

            <SupportSection />

            <div className={reveal(1520, 'mt-10 flex flex-col gap-3 sm:flex-row')}>
              <CursorGlow glow="violet" className="w-full rounded-full sm:w-auto">
                <Link
                  href="/register"
                  className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-8 py-3 text-base font-semibold text-white transition-colors hover:from-indigo-400 hover:to-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
                >
                  Create account
                </Link>
              </CursorGlow>
              <CursorGlow glow="indigo" className="w-full rounded-full sm:w-auto">
                <Link
                  href="/"
                  className="inline-flex w-full items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/60 px-8 py-3 text-base font-semibold text-zinc-100 transition-colors hover:border-zinc-500 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
                >
                  Back to Home
                </Link>
              </CursorGlow>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
