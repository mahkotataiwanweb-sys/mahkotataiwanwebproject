'use client';

import { cn } from '@/lib/utils';

interface Props {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export default function AdminToggle({ checked, onChange, label, disabled, size = 'md' }: Props) {
  const sizeStyle = size === 'sm' ? { width: '2rem', height: '1.125rem' } : undefined;
  return (
    <label className={cn('inline-flex items-center gap-2.5 select-none', disabled && 'opacity-50')}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn('admin-toggle', checked && 'is-on')}
        style={sizeStyle}
      />
      {label && <span className="text-sm text-[var(--color-admin-ink-2)] dark:text-[var(--color-admin-ink-2-dark)]">{label}</span>}
    </label>
  );
}
