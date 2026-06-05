import { Header } from '@/components/Layout/Header';
import { createPageMetadata } from '@/lib/metadata';

export const metadata = createPageMetadata({
  title: 'Account',
  description: 'Sign in or create your GigConnection account to book gigs and connect with musicians or venues.',
  noIndex: true,
});

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center px-3 py-8 sm:p-6">{children}</main>
    </div>
  );
}
