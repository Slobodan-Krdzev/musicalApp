'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/Layout/Header';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isProfileWizard = pathname === '/profile';

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        {!isProfileWizard && <Header />}
        <main className={`flex-1 ${isProfileWizard ? '' : 'container mx-auto px-4 py-8'}`}>
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
