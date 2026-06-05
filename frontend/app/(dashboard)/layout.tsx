import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/metadata';
import { DashboardShell } from './DashboardShell';

export const metadata: Metadata = createPageMetadata({
  title: 'Dashboard',
  noIndex: true,
});

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
