'use client';

import { cn } from '@/lib/utils';

interface Props {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}

export default function AdminCard({ children, className, padded = true }: Props) {
  return (
    <div className={cn('admin-surface', padded && 'p-5 sm:p-6', className)}>
      {children}
    </div>
  );
}

export function AdminPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div className="min-w-0">
        <h1 className="admin-section-title">{title}</h1>
        {subtitle && <p className="admin-section-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}
