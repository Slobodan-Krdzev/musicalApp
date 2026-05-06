'use client';

import { cn } from '@/lib/cn';

/** SVG path `d` values (24×24 viewBox), aligned with dashboard LinksPanel icons */
const PLATFORM: Record<
  string,
  { label: string; iconClass: string; path: string }
> = {
  instagram: {
    label: 'Instagram',
    iconClass: 'text-pink-400',
    path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z',
  },
  facebook: {
    label: 'Facebook',
    iconClass: 'text-blue-400',
    path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  },
  youtube: {
    label: 'YouTube',
    iconClass: 'text-red-400',
    path: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  },
  spotify: {
    label: 'Spotify',
    iconClass: 'text-green-400',
    path: 'M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z',
  },
};

function metaForKey(key: string) {
  const lower = key.toLowerCase();
  const known = PLATFORM[lower];
  if (known) return { ...known, kind: 'brand' as const };
  const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim() || 'Link';
  return {
    label,
    iconClass: 'text-zinc-400',
    path: '',
    kind: 'generic' as const,
  };
}

export function SocialLinksChips({
  links,
  className,
}: {
  links?: Record<string, string | undefined | null> | null;
  className?: string;
}) {
  const entries = Object.entries(links ?? {}).filter(([, v]) => typeof v === 'string' && v.trim().length > 0) as [
    string,
    string,
  ][];
  if (entries.length === 0) return null;

  return (
    <div className={cn('space-y-1', className)}>
      <span className="text-xs text-zinc-500">Social links</span>
      <div className="flex flex-wrap gap-2">
        {entries.map(([key, href]) => {
          const meta = metaForKey(key);
          return (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'inline-flex items-center gap-2 rounded-lg border border-zinc-700/80 bg-zinc-800/60 px-2.5 py-1.5 text-xs font-medium text-zinc-200 transition-colors',
                'hover:border-zinc-600 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-violet-500/40'
              )}
            >
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-zinc-900/80">
                {meta.kind === 'generic' ? (
                  <svg
                    className={cn('h-4 w-4', meta.iconClass)}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
                    />
                  </svg>
                ) : (
                  <svg className={cn('h-4 w-4', meta.iconClass)} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d={meta.path} />
                  </svg>
                )}
              </span>
              <span className="max-w-[10rem] truncate">{meta.label}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
