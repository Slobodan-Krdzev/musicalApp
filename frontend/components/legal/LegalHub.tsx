'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { siteConfig } from '@/lib/site';
import { LEGAL_SECTIONS, legalSectionHref } from '@/lib/legal';
import { SUBSCRIPTION_PLANS } from '@/lib/subscription';
import { PUBLIC_NAVBAR_HEIGHT_PX } from '@/components/PublicNavbar';

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-[var(--legal-sticky-offset,9rem)] border-b border-zinc-800/60 pb-10 last:border-b-0 sm:pb-12 lg:scroll-mt-28">
      <h2 className="text-xl font-bold tracking-tight text-zinc-50 sm:text-2xl lg:text-3xl">{title}</h2>
      <div className="prose prose-invert mt-4 max-w-none space-y-4 text-sm leading-relaxed text-zinc-300 sm:mt-6 sm:text-base [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-zinc-100 sm:[&_h3]:mt-8 sm:[&_h3]:text-lg [&_li]:text-zinc-300 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}

function FlowStep({ step, title, body }: { step: number; title: string; body: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 sm:rounded-2xl sm:p-5">
      <div className="pointer-events-none absolute -bottom-4 -right-2 text-5xl font-bold text-white/[0.04] sm:text-6xl">{step}</div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-400 sm:text-xs">Step {step}</p>
      <h4 className="mt-1 text-sm font-semibold text-zinc-100 sm:text-base">{title}</h4>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{body}</p>
    </div>
  );
}

function scrollToSection(id: string, scrollOffset: number) {
  const el = document.getElementById(id);
  if (el) {
    const top = el.getBoundingClientRect().top + window.scrollY - scrollOffset;
    window.scrollTo({ top, behavior: 'smooth' });
    window.history.replaceState(null, '', legalSectionHref(id));
  }
}

function LegalHero({ compact = false }: { compact?: boolean }) {
  return (
    <div className="mx-auto max-w-3xl text-center lg:max-w-4xl">
      <p className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-zinc-400 sm:text-xs">
        Legal & Trust Center
      </p>
      <h1
        className={cn(
          'mt-3 text-balance font-bold tracking-tight text-white sm:mt-4',
          compact ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl'
        )}
      >
        Transparency for musicians & venues
      </h1>
      <p
        className={cn(
          'mt-2 text-pretty text-zinc-400 sm:mt-3',
          compact ? 'px-1 text-xs leading-snug sm:text-sm' : 'px-1 text-sm sm:mt-4 sm:text-base'
        )}
      >
        Privacy, terms, data handling, subscriptions, and how GigConnection works — all in one place.
      </p>
    </div>
  );
}

export function LegalHub() {
  const [activeId, setActiveId] = useState<string>(LEGAL_SECTIONS[0].id);
  const mobileHeaderRef = useRef<HTMLDivElement>(null);
  const [mobileHeaderHeight, setMobileHeaderHeight] = useState(0);

  const navbarHeight = PUBLIC_NAVBAR_HEIGHT_PX;
  const scrollOffset = navbarHeight + mobileHeaderHeight + 12;

  useEffect(() => {
    const el = mobileHeaderRef.current;
    if (!el) return;

    const update = () => setMobileHeaderHeight(el.offsetHeight);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(el);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--legal-sticky-offset', `${scrollOffset}px`);
    return () => {
      document.documentElement.style.removeProperty('--legal-sticky-offset');
    };
  }, [scrollOffset]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.location.hash) return;
    const id = window.location.hash.replace('#', '');
    if (!LEGAL_SECTIONS.some((s) => s.id === id)) return;
    setActiveId(id);
    if (mobileHeaderHeight > 0 || window.matchMedia('(min-width: 1024px)').matches) {
      requestAnimationFrame(() => scrollToSection(id, scrollOffset));
    }
  }, [mobileHeaderHeight, scrollOffset]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActiveId(visible.target.id);
      },
      {
        rootMargin: mobileHeaderHeight
          ? `-${scrollOffset}px 0px -55% 0px`
          : '-20% 0px -55% 0px',
        threshold: [0, 0.25, 0.5],
      }
    );

    LEGAL_SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [mobileHeaderHeight, scrollOffset]);

  function jumpToSection(id: string) {
    setActiveId(id);
    scrollToSection(id, scrollOffset);
  }

  return (
    <div className="mx-auto max-w-7xl px-3 pb-8 sm:px-6 sm:pb-12 lg:px-8 lg:py-16">
      {/* Mobile: fixed hero + jump menu under the navbar */}
      <div
        ref={mobileHeaderRef}
        className="fixed inset-x-0 top-[var(--public-navbar-height,4rem)] z-40 border-b border-zinc-800/80 bg-zinc-950/95 px-3 py-4 backdrop-blur-md sm:px-6 lg:hidden"
      >
        <LegalHero compact />
        <div className="mx-auto mt-4 max-w-3xl">
          <label htmlFor="legal-section-select" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Jump to section
          </label>
          <select
            id="legal-section-select"
            value={activeId}
            onChange={(e) => jumpToSection(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/30"
          >
            {LEGAL_SECTIONS.map((section) => (
              <option key={section.id} value={section.id}>
                {section.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reserve space so content is not hidden under the fixed mobile header */}
      <div className="lg:hidden" style={{ height: mobileHeaderHeight || undefined }} aria-hidden />

      {/* Desktop: static hero */}
      <div className="hidden lg:block">
        <LegalHero />
      </div>

      <div className="mt-8 lg:mt-12 lg:grid lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
        <nav className="hidden lg:sticky lg:top-[calc(var(--public-navbar-height,4rem)+1.5rem)] lg:block lg:self-start lg:z-10" aria-label="Legal sections">
          <ul className="flex flex-col gap-1">
            {LEGAL_SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={legalSectionHref(section.id)}
                  onClick={(e) => {
                    e.preventDefault();
                    jumpToSection(section.id);
                  }}
                  className={cn(
                    'block rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    activeId === section.id
                      ? 'bg-violet-500/15 text-violet-200 ring-1 ring-violet-500/30'
                      : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-100'
                  )}
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 space-y-10 sm:space-y-12">
          <Section id="privacy" title="Privacy Policy">
            <p>
              GigConnection (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;{siteConfig.name}&rdquo;) respects your privacy. This policy
              explains what we collect, why we collect it, and how we protect it.
            </p>
            <h3>What we collect</h3>
            <ul>
              <li>Account information: email address, password (stored securely hashed), and role (musician or venue).</li>
              <li>Profile information you choose to provide: band/venue name, bio, location, media, genres, contact preferences, and social links.</li>
              <li>Booking activity: events, offerings, applications, quotes, messages related to deals, and finalized gig records.</li>
              <li>Billing metadata for subscriptions (processed by Stripe — we do not store full card numbers).</li>
              <li>Support tickets and newsletter sign-ups if you contact us or subscribe voluntarily.</li>
            </ul>
            <h3>How we use your data</h3>
            <p>
              <strong className="text-zinc-100">We use customer data primarily to connect musicians and venues.</strong> That means
              showing listings, matching applications, enabling negotiations, and — only after both parties agree and finalize a deal —
              sharing the contact details needed to coordinate the gig.
            </p>
            <p>
              We do not sell your personal data. We do not use your profile for unrelated advertising. Limited operational emails
              (verification, security, subscription, deal updates) are sent to keep the service working.
            </p>
            <h3>When your data is visible to others</h3>
            <ul>
              <li>Public profile fields (name, media, genres, location area) may be visible to other users browsing the platform.</li>
              <li>Direct contact details (phone, email, reservation lines) are <strong className="text-zinc-100">not</strong> exposed until a deal is finalized by both sides.</li>
              <li>Finalized gigs may appear in activity summaries to demonstrate real bookings on the platform.</li>
            </ul>
            <h3>Your rights</h3>
            <p>
              You may update your profile, manage your subscription, or delete your account from the dashboard. For other requests
              (access, correction, deletion), contact{' '}
              <a href={`mailto:${siteConfig.contactEmail}`} className="text-violet-400 hover:underline">
                {siteConfig.contactEmail}
              </a>
              .
            </p>
          </Section>

          <Section id="terms" title="Terms of Use">
            <p>By creating an account or using GigConnection, you agree to these terms.</p>
            <h3>Eligibility</h3>
            <p>You must be at least 18 years old and able to enter binding agreements in your jurisdiction.</p>
            <h3>Your responsibilities</h3>
            <ul>
              <li>Provide accurate profile and listing information.</li>
              <li>Use the platform professionally — no spam, fraud, harassment, or misleading quotes.</li>
              <li>Honor agreements reached through finalized deals.</li>
              <li>Keep your login credentials confidential.</li>
            </ul>
            <h3>Platform role</h3>
            <p>
              GigConnection is a connection and booking workflow tool. We are not a party to the live performance contract between
              musician and venue. Payment for the gig itself is arranged between the parties unless otherwise stated in your deal.
            </p>
            <h3>Subscriptions</h3>
            <p>
              Certain features require an active subscription. Fees, renewal, and cancellation are described in the Subscription Plans
              and Payment Management sections below.
            </p>
            <h3>Termination</h3>
            <p>
              We may suspend accounts that violate these terms. You may delete your account at any time. Provisions on data handling
              survive account closure as required by law.
            </p>
          </Section>

          <Section id="data-security" title="Passwords & User Data">
            <p>
              Security is built into how GigConnection stores and uses your information.
            </p>
            <h3>Passwords</h3>
            <ul>
              <li>Passwords are never stored in plain text.</li>
              <li>We use industry-standard one-way hashing before passwords are saved to our database.</li>
              <li>Password reset links are time-limited and single-purpose.</li>
            </ul>
            <h3>Authentication</h3>
            <p>
              After login, secure tokens are issued for your session. Access tokens expire quickly; refresh tokens allow seamless
              re-authentication without storing your password in the browser beyond the login form.
            </p>
            <h3>How your data is used</h3>
            <p>
              We collect profile and activity data solely to operate the marketplace: discovery, applications, deal negotiation,
              finalization, notifications, and subscription access. Sensitive contact information is released only when{' '}
              <strong className="text-zinc-100">both the musician and the venue finalize the deal</strong> — confirming mutual agreement.
            </p>
            <h3>Infrastructure</h3>
            <p>
              Data is stored on secured servers. Transport is encrypted in transit (HTTPS). Access to production systems is restricted
              to authorized operators.
            </p>
          </Section>

          <Section id="how-to-use" title="How to Use GigConnection">
            <p>
              GigConnection connects venues that need live music with musicians looking for gigs. Here is the typical journey from signup
              to a completed booking.
            </p>

            <h3>1. Create your account</h3>
            <p>
              Sign up as a <strong className="text-zinc-100">Musician / Band</strong> or a <strong className="text-zinc-100">Venue</strong>.
              Verify your email, then complete the profile wizard with photos, location, and contact details.
            </p>

            <h3>2. Build your profile</h3>
            <div className="not-prose grid gap-3 sm:grid-cols-2">
              <FlowStep
                step={1}
                title="Musicians"
                body="Add band name, bio, genres, gallery images, and availability offerings other venues can discover."
              />
              <FlowStep
                step={2}
                title="Venues"
                body="Add venue name, capacity, equipment, location, and events you want to fill with live acts."
              />
            </div>

            <h3>3. Discover & apply</h3>
            <ul>
              <li>Venues publish <strong className="text-zinc-100">Events</strong> with date, budget, and requirements.</li>
              <li>Musicians publish <strong className="text-zinc-100">Offerings</strong> with availability and style.</li>
              <li>Either side can apply with a quote. Both parties review applications in the dashboard.</li>
            </ul>

            <h3>4. Deal completion (finalization)</h3>
            <p>When both sides agree on terms, each party confirms finalization in the app:</p>
            <div className="not-prose grid gap-3">
              <FlowStep
                step={1}
                title="Agree on the quote"
                body="Negotiate through the application flow until the fee and gig details are accepted."
              />
              <FlowStep
                step={2}
                title="Both sides finalize"
                body="Each party taps finalize in the deal screen. Only when both confirmations are recorded is the deal marked COMPLETED."
              />
              <FlowStep
                step={3}
                title="Contact details unlocked"
                body="After mutual finalization, direct contact information becomes available so you can coordinate load-in, soundcheck, and payment offline."
              />
              <FlowStep
                step={4}
                title="Play the gig"
                body="The booking appears in your dashboard history and contributes to your activity summary."
              />
            </div>
            <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100/90">
              Until a deal is finalized by <strong>both</strong> parties, private contact details stay hidden. GigConnection only
              displays what each side needs to evaluate a match — not full contact info prematurely.
            </p>
          </Section>

          <Section id="subscriptions" title="Subscription Plans">
            <p>
              An active subscription unlocks creating listings, applying to gigs, and full dashboard access. Choose the plan that fits
              your schedule:
            </p>
            <div className="not-prose mt-4 grid gap-3 sm:mt-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
                <h4 className="text-lg font-semibold text-zinc-100">Free trial</h4>
                <p className="mt-2 text-sm text-zinc-400">
                  New accounts can start a <strong className="text-zinc-200">14-day free trial</strong> to explore the platform before
                  subscribing. No card required to begin the trial.
                </p>
              </div>
              {SUBSCRIPTION_PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={cn(
                    'rounded-2xl border p-5',
                    plan.highlight ? 'border-violet-500/40 bg-violet-500/5' : 'border-zinc-800 bg-zinc-900/50'
                  )}
                >
                  {plan.badge && (
                    <span className="mb-2 inline-block rounded-full bg-violet-500 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-white">
                      {plan.badge}
                    </span>
                  )}
                  <h4 className="text-lg font-semibold text-zinc-100">{plan.name}</h4>
                  <p className="mt-1 text-2xl font-bold text-zinc-50">
                    {plan.price}
                    <span className="text-sm font-normal text-zinc-500">{plan.cadence}</span>
                  </p>
                  <ul className="mt-4 space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-zinc-400">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-zinc-500">
              Manage or cancel your plan anytime from Dashboard → Subscription & Billing.
            </p>
          </Section>

          <Section id="payments" title="Payment Management">
            <p>
              Subscription payments are processed securely through <strong className="text-zinc-100">Stripe</strong>, a PCI-compliant
              payment provider trusted by millions of businesses worldwide.
            </p>
            <ul>
              <li>Card details are entered on Stripe-hosted secure fields — we never see or store your full card number.</li>
              <li>Recurring billing is handled automatically for monthly and yearly plans.</li>
              <li>Invoices and receipts are available in your dashboard billing history.</li>
              <li>You can update payment methods or cancel renewal through the billing portal.</li>
            </ul>
            <div className="not-prose flex flex-col items-start gap-3 rounded-xl border border-sky-500/20 bg-sky-500/5 px-4 py-3 sm:flex-row sm:items-center">
              <svg className="h-7 w-7 shrink-0 text-sky-400 sm:h-8 sm:w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              <p className="text-sm text-sky-100/90">
                Stripe encrypts payment data in transit and at rest. GigConnection only stores Stripe customer and subscription IDs
                needed to manage your account.
              </p>
            </div>
            <p className="text-sm text-zinc-500">
              Gig payments between musicians and venues happen off-platform unless you arrange otherwise during finalization.
            </p>
          </Section>

          <Section id="cookies" title="Cookies & Local Storage">
            <p>
              GigConnection uses minimal browser storage — not third-party advertising trackers.
            </p>
            <h3>What we use</h3>
            <ul>
              <li>
                <strong className="text-zinc-100">Authentication tokens</strong> (local storage): keep you signed in between visits.
              </li>
              <li>
                <strong className="text-zinc-100">Location preference</strong> (local storage, Parties page): remembers whether you
                allowed location for nearby event discovery.
              </li>
              <li>
                <strong className="text-zinc-100">UI preferences</strong>: occasional local flags (e.g. dismissing an announcement modal).
              </li>
            </ul>
            <h3>What we do not use</h3>
            <ul>
              <li>Third-party ad tracking cookies.</li>
              <li>Cross-site behavioral profiling networks.</li>
            </ul>
            <p>
              You can clear site data through your browser settings. Clearing storage will sign you out and reset local preferences.
            </p>
          </Section>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-center sm:rounded-2xl sm:p-6">
            <p className="text-sm text-zinc-300 sm:text-base">Questions about these policies?</p>
            <a
              href={`mailto:${siteConfig.contactEmail}`}
              className="mt-2 inline-block break-all text-sm text-violet-400 transition-colors hover:text-violet-300 sm:text-base"
            >
              {siteConfig.contactEmail}
            </a>
            <p className="mt-4">
              <Link href="/support" className="text-sm text-zinc-500 hover:text-zinc-300">
                Open support →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
