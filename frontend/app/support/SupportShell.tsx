'use client';

import { Header } from '@/components/Layout/Header';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export function SupportShell({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute superAdminAllowed>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto w-full max-w-3xl flex-1 px-3 py-6 sm:px-4 sm:py-8 lg:px-8">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
