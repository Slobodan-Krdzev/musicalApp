import { Header } from '@/components/Layout/Header';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center px-3 py-8 sm:p-6">{children}</main>
    </div>
  );
}
