'use client';

import { ChevronUp, ChevronDown } from 'lucide-react';

interface Props {
  onUp?: () => void;
  onDown?: () => void;
  disabledUp?: boolean;
  disabledDown?: boolean;
  value?: number;
}

export default function SortControl({ onUp, onDown, disabledUp, disabledDown, value }: Props) {
  return (
    <div className="inline-flex items-center gap-0.5">
      <button
        type="button"
        onClick={onUp}
        disabled={disabledUp}
        title="Move up"
        className="admin-btn-icon disabled:opacity-30 disabled:pointer-events-none"
      >
        <ChevronUp className="w-4 h-4" />
      </button>
      {typeof value === 'number' && (
        <span className="text-xs tabular-nums text-[var(--color-admin-muted)] dark:text-[var(--color-admin-muted-dark)] w-5 text-center">
          {value}
        </span>
      )}
      <button
        type="button"
        onClick={onDown}
        disabled={disabledDown}
        title="Move down"
        className="admin-btn-icon disabled:opacity-30 disabled:pointer-events-none"
      >
        <ChevronDown className="w-4 h-4" />
      </button>
    </div>
  );
}
