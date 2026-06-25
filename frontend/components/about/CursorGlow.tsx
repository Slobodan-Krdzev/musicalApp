'use client';

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/cn';

type GlowTone = 'violet' | 'indigo' | 'fuchsia' | 'sky' | 'blue' | 'purple' | 'pink';

const GLOW_COLORS: Record<GlowTone, string> = {
  violet: 'rgba(139, 92, 246, 0.28)',
  indigo: 'rgba(99, 102, 241, 0.26)',
  fuchsia: 'rgba(217, 70, 239, 0.26)',
  sky: 'rgba(56, 189, 248, 0.22)',
  blue: 'rgba(59, 130, 246, 0.24)',
  purple: 'rgba(168, 85, 247, 0.26)',
  pink: 'rgba(236, 72, 153, 0.22)',
};

const BORDER_ACTIVE: Record<GlowTone, string> = {
  violet: 'border-violet-500/35 shadow-[0_0_24px_-6px_rgba(139,92,246,0.45)]',
  indigo: 'border-indigo-500/35 shadow-[0_0_24px_-6px_rgba(99,102,241,0.45)]',
  fuchsia: 'border-fuchsia-500/35 shadow-[0_0_24px_-6px_rgba(217,70,239,0.45)]',
  sky: 'border-sky-500/30 shadow-[0_0_24px_-6px_rgba(56,189,248,0.35)]',
  blue: 'border-blue-500/30 shadow-[0_0_24px_-6px_rgba(59,130,246,0.35)]',
  purple: 'border-purple-500/35 shadow-[0_0_24px_-6px_rgba(168,85,247,0.4)]',
  pink: 'border-pink-500/30 shadow-[0_0_24px_-6px_rgba(236,72,153,0.35)]',
};

type CursorGlowProps<T extends ElementType = 'div'> = {
  children: ReactNode;
  className?: string;
  revealClassName?: string;
  glow?: GlowTone;
  as?: T;
  /** Set false when content extends outside the card (e.g. badges). */
  clipGlow?: boolean;
  /** Softer glow without card border highlight — for navbars. */
  subtle?: boolean;
  glowRadius?: number;
};

export function CursorGlow<T extends ElementType = 'div'>({
  children,
  className,
  revealClassName,
  glow = 'violet',
  as,
  clipGlow = true,
  subtle = false,
  glowRadius = 380,
}: CursorGlowProps<T>) {
  const Tag = as || 'div';
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  function handleMove(e: MouseEvent) {
    if (reducedMotion) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    setPosition({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }

  const glowX = reducedMotion ? 50 : position.x;
  const glowY = reducedMotion ? 40 : position.y;

  const style = {
    '--glow-x': `${glowX}%`,
    '--glow-y': `${glowY}%`,
    '--glow-color': subtle ? GLOW_COLORS[glow].replace(/[\d.]+\)$/, '0.16)') : GLOW_COLORS[glow],
  } as CSSProperties;

  return (
    <Tag
      ref={ref}
      className={cn(
        'group/glow relative transition-[border-color,box-shadow] duration-300',
        !subtle && 'border',
        clipGlow ? 'overflow-hidden' : 'overflow-visible',
        active && !subtle && BORDER_ACTIVE[glow],
        revealClassName,
        className
      )}
      style={style}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => {
        setActive(false);
        setPosition({ x: 50, y: 50 });
      }}
      onMouseMove={handleMove}
    >
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0 z-0 transition-opacity duration-500 ease-out',
          active ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          background: `radial-gradient(${glowRadius}px circle at var(--glow-x) var(--glow-y), var(--glow-color), transparent 65%)`,
        }}
      />
      <div className="relative z-[1]">{children}</div>
    </Tag>
  );
}
