import { PublicNavbar } from '@/components/PublicNavbar';
import { SiteFooter } from '@/components/Layout/SiteFooter';
import { LegalHub } from '@/components/legal/LegalHub';
import { createPageMetadata } from '@/lib/metadata';

export const metadata = createPageMetadata({
  title: 'Legal Information',
  description:
    'Privacy policy, terms of use, data security, subscriptions, Stripe payments, and how GigConnection connects musicians and venues.',
  path: '/legal',
});

export default function LegalPage() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      <PublicNavbar />
      <main className="flex-1">
        <LegalHub />
      </main>
      <SiteFooter />
    </div>
  );
}
