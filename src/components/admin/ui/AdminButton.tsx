'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'accent' | 'success' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

const sizeMap: Record<Size, string> = {
  sm: 'text-xs px-3 py-1.5',
  md: '',
  lg: 'text-sm px-5 py-3',
};

const variantMap: Record<Variant, string> = {
  primary: 'admin-btn-primary',
  accent: 'admin-btn-accent',
  success: 'admin-btn-success',
  danger: 'admin-btn-danger',
  ghost: 'admin-btn-ghost',
};

const AdminButton = forwardRef<HTMLButtonElement, Props>(function AdminButton(
  { variant = 'primary', size = 'md', loading, disabled, iconLeft, iconRight, className, children, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn('admin-btn', variantMap[variant], sizeMap[size], className)}
      {...rest}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : iconLeft}
      {children}
      {iconRight}
    </button>
  );
});

export default AdminButton;
