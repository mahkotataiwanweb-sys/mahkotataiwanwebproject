'use client';

import { cn } from '@/lib/utils';

interface ColumnDef<T> {
  key: string;
  label: string;
  render?: (row: T, index: number) => React.ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center';
  width?: string;
}

interface Props<T extends { id: string | number }> {
  columns: ColumnDef<T>[];
  data: T[];
  emptyState?: React.ReactNode;
  loading?: boolean;
  loadingRowsCount?: number;
  rowKey?: (row: T) => string;
}

export default function AdminTable<T extends { id: string | number }>({
  columns,
  data,
  emptyState,
  loading,
  loadingRowsCount = 6,
  rowKey,
}: Props<T>) {
  return (
    <div className="admin-surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="admin-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  style={{ width: c.width }}
                  className={cn(c.align === 'right' && 'text-right', c.align === 'center' && 'text-center', c.className)}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: loadingRowsCount }).map((_, i) => (
                <tr key={`sk-${i}`}>
                  {columns.map((c) => (
                    <td key={c.key} className={cn(c.align === 'right' && 'text-right', c.align === 'center' && 'text-center')}>
                      <div className="admin-skeleton h-4 w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="!p-0 !border-b-0">
                  {emptyState || (
                    <div className="py-14 text-center text-sm text-[var(--color-admin-muted)] dark:text-[var(--color-admin-muted-dark)]">
                      No records yet.
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={rowKey ? rowKey(row) : String(row.id)}>
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn(c.align === 'right' && 'text-right', c.align === 'center' && 'text-center', c.className)}
                    >
                      {c.render ? c.render(row, i) : String((row as Record<string, unknown>)[c.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export type { ColumnDef };
