'use client';

import { Inbox } from 'lucide-react';

interface Props {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export default function EmptyState({ title = 'No data yet', description, icon, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[var(--color-admin-surface-2)] dark:bg-[var(--color-admin-surface-2-dark)] flex items-center justify-center text-[var(--color-admin-muted)] dark:text-[var(--color-admin-muted-dark)] mb-4">
        {icon || <Inbox className="w-6 h-6" />}
      </div>
      <h3 className="font-heading text-base font-semibold text-[var(--color-admin-ink)] dark:text-[var(--color-admin-ink-dark)]">{title}</h3>
      {description && <p className="text-sm text-[var(--color-admin-muted)] dark:text-[var(--color-admin-muted-dark)] mt-1.5 max-w-md">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function LoadingRows({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-4">
              <div className="admin-skeleton h-4 w-full max-w-[180px]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
