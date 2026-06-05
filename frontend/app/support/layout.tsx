import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/metadata';
import { SupportShell } from './SupportShell';

export const metadata: Metadata = createPageMetadata({
  title: 'Support',
  description: 'Contact GigConnection support or track your help tickets.',
  path: '/support',
  noIndex: true,
});

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return <SupportShell>{children}</SupportShell>;
}
