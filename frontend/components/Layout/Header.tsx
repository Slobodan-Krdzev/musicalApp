'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

export function Header() {
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg text-violet-400">
          GigMatch
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/events"
            className={`text-sm font-medium ${pathname === '/events' ? 'text-violet-400' : 'text-zinc-400 hover:text-zinc-100'}`}
          >
            Events
          </Link>
          {!isLoading && (
            <>
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className={`text-sm font-medium ${pathname === '/dashboard' ? 'text-violet-400' : 'text-zinc-400 hover:text-zinc-100'}`}
                  >
                    Dashboard
                  </Link>
                  {user.role === 'SUPERADMIN' && (
                    <Link
                      href="/admin"
                      className={`text-sm font-medium ${pathname === '/admin' ? 'text-violet-400' : 'text-zinc-400 hover:text-zinc-100'}`}
                    >
                      Admin
                    </Link>
                  )}
                  <span className="text-zinc-500 text-sm">{user.email}</span>
                  <Button variant="ghost" size="sm" onClick={logout}>
                    Log out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm">Log in</Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm">Sign up</Button>
                  </Link>
                </>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
