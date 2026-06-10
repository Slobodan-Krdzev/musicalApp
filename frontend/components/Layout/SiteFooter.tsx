import Link from 'next/link';
import { BRAND, BrandMark } from '@/components/Layout/BrandMark';
import { siteConfig } from '@/lib/site';
import { LEGAL_HUB_PATH, LEGAL_SECTIONS, legalSectionHref } from '@/lib/legal';

const exploreLinks = [
  { href: '/parties', label: 'Parties' },
  { href: '/about', label: 'About Us' },
  { href: '/events', label: 'Events' },
  { href: '/support', label: 'Support' },
];

const accountLinks = [
  { href: '/login', label: 'Log in' },
  { href: '/register', label: 'Sign up' },
  { href: '/dashboard', label: 'Dashboard' },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-zinc-800/80 bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <div className="grid gap-8 sm:grid-cols-2 sm:gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="sm:col-span-2 lg:col-span-4">
            <Link
              href="/"
              className="inline-flex max-w-full items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              <BrandMark className="h-10 w-10 shrink-0 sm:h-11 sm:w-11" />
              <div className="min-w-0 flex flex-col leading-tight">
                <span className="truncate text-base font-bold tracking-tight text-zinc-50 sm:text-lg">{BRAND.name}</span>
                <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 sm:text-xs">
                  Live music bookings
                </span>
              </div>
            </Link>
            <p className="mt-4 max-w-sm text-pretty text-sm leading-relaxed text-zinc-400">{BRAND.subtitle}</p>
            <p className="mt-4 text-sm text-zinc-500">
              Support:{' '}
              <a
                href={`mailto:${siteConfig.contactEmail}`}
                className="break-all text-violet-400 transition-colors hover:text-violet-300"
              >
                {siteConfig.contactEmail}
              </a>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:col-span-2 sm:grid-cols-2 lg:col-span-4 lg:gap-8">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Explore</h3>
              <ul className="mt-3 space-y-2 sm:mt-4 sm:space-y-2.5">
                {exploreLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-zinc-400 transition-colors hover:text-zinc-100">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Account</h3>
              <ul className="mt-3 space-y-2 sm:mt-4 sm:space-y-2.5">
                {accountLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-zinc-400 transition-colors hover:text-zinc-100">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="sm:col-span-2 lg:col-span-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Legal & Trust</h3>
            <ul className="mt-3 grid grid-cols-1 gap-2 min-[480px]:grid-cols-2 sm:mt-4 sm:gap-2.5">
              <li className="min-[480px]:col-span-2">
                <Link href={LEGAL_HUB_PATH} className="text-sm font-medium text-violet-400 transition-colors hover:text-violet-300">
                  Legal information hub
                </Link>
              </li>
              {LEGAL_SECTIONS.map((section) => (
                <li key={section.id}>
                  <Link href={legalSectionHref(section.id)} className="text-sm text-zinc-400 transition-colors hover:text-zinc-100">
                    {section.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-zinc-800/80 pt-6 text-center sm:mt-12 sm:flex-row sm:items-start sm:justify-between sm:pt-8 sm:text-left">
          <p className="text-sm text-zinc-500">
            © {year} {siteConfig.name}. Built for live music.
          </p>
          <p className="max-w-xl text-pretty text-xs leading-relaxed text-zinc-600 sm:text-right">
            Customer data is used only to connect musicians and venues. Contact details are shared after both sides finalize a deal.
          </p>
        </div>
      </div>
    </footer>
  );
}
