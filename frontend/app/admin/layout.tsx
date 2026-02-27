import { Header } from '@/components/Layout/Header';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requireRole="SUPERADMIN">
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
