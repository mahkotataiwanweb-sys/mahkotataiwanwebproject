'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
};

export default function AdminModal({ open, onClose, title, description, children, footer, size = 'md' }: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className={cn('admin-modal', sizeMap[size])} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-[var(--color-admin-border)] dark:border-[var(--color-admin-border-dark)]">
          <div className="min-w-0 flex-1">
            <h2 className="font-heading text-lg font-bold text-[var(--color-admin-ink)] dark:text-[var(--color-admin-ink-dark)] tracking-tight">{title}</h2>
            {description && <p className="text-xs text-[var(--color-admin-muted)] dark:text-[var(--color-admin-muted-dark)] mt-1">{description}</p>}
          </div>
          <button onClick={onClose} className="admin-btn-icon" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 max-h-[calc(100vh-14rem)] overflow-y-auto">
          {children}
        </div>

        {footer && (
          <div className="px-6 py-4 border-t border-[var(--color-admin-border)] dark:border-[var(--color-admin-border-dark)] bg-[var(--color-admin-surface-2)] dark:bg-[var(--color-admin-surface-2-dark)] rounded-b-2xl flex flex-wrap items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
