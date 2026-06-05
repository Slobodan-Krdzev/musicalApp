import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/metadata';

export const metadata: Metadata = createPageMetadata({
  title: 'Parties & Venues Map',
  description:
    'Discover venues, parties, and live music locations near you. Browse the GigConnection map to find your next gig or event.',
  path: '/parties',
});

export default function PartiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
