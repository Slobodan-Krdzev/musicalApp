'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/Layout/Header';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isProfileWizard = pathname === '/profile';

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        {!isProfileWizard && <Header />}
        <main
          className={
            isProfileWizard
              ? 'flex-1'
              : 'mx-auto w-full max-w-7xl flex-1 px-3 py-6 sm:px-4 sm:py-8 lg:px-8'
          }
        >
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
