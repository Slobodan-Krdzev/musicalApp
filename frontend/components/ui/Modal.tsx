'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  position?: 'top' | 'center';
};

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
  contentClassName,
  position = 'top',
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handle);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handle);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const content = (
    <div
      className={cn(
        'fixed inset-0 z-[9999] flex justify-center overflow-y-auto px-3 py-6 sm:p-6',
        position === 'center' ? 'items-center' : 'items-start sm:pt-[5vh]'
      )}
    >
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal
        aria-labelledby={title ? 'modal-title' : undefined}
        className={cn(
          'relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/95 shadow-xl backdrop-blur',
          'flex flex-col max-h-[calc(100dvh-3rem)] overflow-hidden',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-800/80 px-4 py-3 sm:px-5 sm:py-4">
            <h2 id="modal-title" className="truncate text-base font-semibold text-zinc-100 sm:text-lg">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="-mr-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-zinc-100"
              aria-label="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}
        <div className={cn('flex-1 overflow-y-auto p-4 sm:p-5', contentClassName)}>{children}</div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
