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
};

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!open || !mounted) return null;

  const content = (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center p-4 pt-[5vh] overflow-y-auto">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal
        aria-labelledby={title ? 'modal-title' : undefined}
        className={cn(
          'relative w-full max-w-md rounded-xl bg-zinc-900 border border-zinc-800 shadow-xl mb-8',
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
        <div className="p-4 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
