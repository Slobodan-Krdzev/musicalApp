import Link from 'next/link';
import { UnderDevelopmentModal } from '@/components/UnderDevelopmentModal';
import { PublicNavbar } from '@/components/PublicNavbar';
import { SiteFooter } from '@/components/Layout/SiteFooter';
import { NewsletterSection } from '@/components/home/NewsletterSection';
import { FreeTrialSection } from '@/components/home/FreeTrialSection';
import { CursorGlow } from '@/components/about/CursorGlow';
import { cn } from '@/lib/cn';
import { createPageMetadata } from '@/lib/metadata';

export const metadata = createPageMetadata({
  title: 'Book Live Music Gigs',
  description:
    'GigConnection connects musicians, bands, and venues. Browse parties and events, apply to gigs, negotiate deals, and grow your live music career.',
  path: '/',
});

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-[15px] sm:text-base">
      <UnderDevelopmentModal />
      <main className="flex-1">
        {/* Hero */}
        <section
          className="relative flex lg:h-[100vh] lg:max-h-[100vh] flex-col overflow-hidden bg-zinc-950 lg:bg-cover  bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/frontHero.png')" }}
        >
          {/* Dark overlay over hero image */}
          <div className="pointer-events-none absolute inset-0 bg-black/55" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-transparent to-zinc-950" />

          <PublicNavbar />

          <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto">
            <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col items-center justify-center px-4 py-12 text-center sm:px-6 sm:py-16 lg:px-8 lg:py-20">
              <span className="mb-4 inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-400">
                <span className="mr-2 h-1.5 w-1.5 rounded-full bg-indigo-400" />
                The #1 Platform for Live Music
              </span>

              <h1 className="max-w-3xl text-balance text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl lg:text-7xl">
                Book the Perfect{' '}
                <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-fuchsia-400 bg-clip-text text-transparent">
                  Gig
                </span>
                .
                <br />
                Fill Your{' '}
                <span className="bg-gradient-to-r from-fuchsia-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
                  Venue
                </span>
                .
              </h1>

              <p className="mt-6 max-w-xl text-balance text-sm leading-relaxed text-zinc-400 sm:text-base">
                Connect top-tier local talent with premium venues. Streamlined booking, secure payments,
                and zero hassle.
              </p>

              <div className="mt-10 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row sm:gap-4">
                <Link
                  href="/register?role=VENUE"
                  className={cn(
                    'inline-flex w-full min-w-0 items-center justify-center rounded-full bg-zinc-100 px-6 py-3 text-base font-medium text-zinc-900 transition-colors',
                    'hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-zinc-950 sm:min-w-[180px] sm:whitespace-nowrap'
                  )}
                >
                  I&apos;m a Venue Owner
                </Link>
                <Link
                  href="/register?role=MUSICIAN"
                  className={cn(
                    'inline-flex w-full min-w-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/60 px-6 py-3 text-base font-medium text-zinc-100 transition-colors',
                    'hover:border-zinc-500 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-950 sm:min-w-[180px]'
                  )}
                >
                  I&apos;m a Musician
                </Link>
              </div>
              <div className="mt-4 flex w-full justify-center sm:w-auto">
                <Link
                  href="/parties"
                  className={cn(
                    'inline-flex w-full min-w-0 items-center justify-center rounded-full border border-violet-500/40 bg-violet-500/10 px-6 py-3 text-base font-medium text-violet-200 transition-colors',
                    'hover:border-violet-400/50 hover:bg-violet-500/20 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-zinc-950 sm:min-w-[180px] sm:w-auto'
                  )}
                >
                  I&apos;m looking for a party
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Feature cards - For Venues, For Bands, Built-in Promotion */}
        <section className="bg-black px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-400">
                Why GigConnection
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Everything you need to{' '}
                <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                  book live gigs
                </span>
              </h2>
              <p className="mt-3 text-base text-zinc-400 sm:text-lg">
                From discovery to deal — one platform for venues, musicians, and smooth bookings.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              <CursorGlow glow="violet" className="rounded-2xl border-zinc-800/80 bg-black p-6 text-left">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/20 text-violet-400">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white">For Venues</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  Manage your entertainment calendar effortlessly. Find bands that match your vibe and budget.
                </p>
              </CursorGlow>
              <CursorGlow glow="indigo" className="rounded-2xl border-zinc-800/80 bg-black p-6 text-left">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/20 text-violet-400">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white">For Bands</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  Stop cold-calling. Browse available slots at top venues and book gigs instantly.
                </p>
              </CursorGlow>
              <CursorGlow glow="fuchsia" className="rounded-2xl border-zinc-800/80 bg-black p-6 text-left">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/20 text-violet-400">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.978 18.978 0 011.745-2.98 8.75 8.75 0 00-5.113-1.258L15.25 4.28v9.72z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white">Built-in Promotion</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  Finalized gigs appear on our public Parties page and weekly newsletter — helping venues fill the room and musicians
                  reach new fans beyond social media.
                </p>
              </CursorGlow>
            </div>
          </div>
        </section>

        {/* Simple, Transparent Pricing */}
        <section className="relative flex flex-col items-center justify-center overflow-hidden px-4 py-16 sm:py-20">
          {/* Radial gradient: brightest at center, darker toward edges */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse 75% 75% at 50% 50%, rgba(88, 28, 135, 0.5) 0%, rgba(30, 27, 75, 0.25) 35%, rgba(9, 9, 11, 0.98) 70%, rgb(3, 7, 18) 100%)',
            }}
          />
          <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center justify-center">
            <h2 className="text-center text-3xl font-bold text-white sm:text-4xl lg:text-5xl">Simple, Transparent Pricing</h2>
            <p className="mt-3 text-center text-base text-zinc-400 sm:text-lg">Unlock full access to the platform</p>
            <div className="mt-10 grid w-full gap-6 sm:mt-14 sm:gap-8 md:grid-cols-2">
              <CursorGlow glow="indigo" className="rounded-2xl border-zinc-800/80 bg-black/60 p-6 sm:p-8">
                <h3 className="text-xl font-bold text-white">Monthly</h3>
                <p className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-4xl font-bold text-white sm:text-5xl">$9.99</span>
                  <span className="text-base text-zinc-400">/mo</span>
                </p>
                <ul className="mt-8 space-y-4">
                  {['Unlimited booking requests', 'Profile visibility boost', 'Advanced analytics'].map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-base text-white">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/20">
                        <svg className="h-3.5 w-3.5 text-violet-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={cn(
                    'mt-10 inline-flex w-full items-center justify-center rounded-xl border border-violet-500/50 bg-zinc-900 py-3 text-base font-medium text-white transition-colors',
                    'hover:border-violet-400/50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-zinc-950'
                  )}
                >
                  Choose Monthly
                </Link>
              </CursorGlow>
              <CursorGlow glow="violet" clipGlow={false} className="rounded-2xl border-violet-500/40 bg-black/60 p-6 sm:p-8">
                <span className="absolute -top-3 right-4 rounded-full bg-violet-500 px-3 py-1.5 text-sm font-semibold uppercase tracking-wide text-white">
                  Best value
                </span>
                <h3 className="text-xl font-bold text-violet-400">Yearly</h3>
                <p className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-4xl font-bold text-white sm:text-5xl">$99.99</span>
                  <span className="text-base text-zinc-400">/yr</span>
                </p>
                <ul className="mt-8 space-y-4">
                  {['Save ~17% vs monthly plan', 'All features included', 'Featured venue status'].map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-base text-white">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/20">
                        <svg className="h-3.5 w-3.5 text-violet-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={cn(
                    'mt-10 inline-flex w-full items-center justify-center rounded-xl bg-violet-500 py-3 text-base font-medium text-white transition-colors',
                    'hover:bg-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-zinc-950'
                  )}
                >
                  Choose Yearly
                </Link>
              </CursorGlow>
            </div>
          </div>
        </section>

        <NewsletterSection />

        <FreeTrialSection />

        {/* CTA — replaced by FreeTrialSection
        <section className="relative overflow-hidden border-t border-zinc-800/60 bg-zinc-950 py-24 px-4">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-violet-950/20 to-transparent" />
          <div className="relative z-10 mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Ready to get started?</h2>
            <p className="mt-3 text-zinc-400">Join as a Musician or Venue and connect in minutes.</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/register"
                className={cn(
                  'inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-base font-medium text-violet-500 transition-colors',
                  'hover:bg-violet-400/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-950'
                )}
              >
                Create account
              </Link>
              <Link
                href="/events"
                className={cn(
                  'inline-flex items-center justify-center rounded-full border border-zinc-600 px-8 py-3 text-base font-medium text-zinc-300 transition-colors',
                  'hover:border-zinc-500 hover:bg-zinc-800/50 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-950'
                )}
              >
                Browse events
              </Link>
            </div>
          </div>
        </section>
        */}

        <SiteFooter />
      </main>
    </div>
  );
}
