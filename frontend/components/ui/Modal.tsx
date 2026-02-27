'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/cn';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
};

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handle);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handle);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal
        aria-labelledby={title ? 'modal-title' : undefined}
        className={cn(
          'relative w-full max-w-md rounded-xl bg-zinc-900 border border-zinc-800 shadow-xl',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-zinc-800">
            <h2 id="modal-title" className="text-lg font-semibold text-zinc-100">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-100 rounded p-1"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
