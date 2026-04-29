'use client';

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const AdminInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function AdminInput({ className, ...rest }, ref) {
    return <input ref={ref} className={cn('admin-input', className)} {...rest} />;
  }
);

export const AdminTextarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function AdminTextarea({ className, rows = 3, ...rest }, ref) {
    return <textarea ref={ref} rows={rows} className={cn('admin-input', className)} {...rest} />;
  }
);

export const AdminSelect = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function AdminSelect({ className, children, ...rest }, ref) {
    return (
      <select ref={ref} className={cn('admin-input', className)} {...rest}>
        {children}
      </select>
    );
  }
);

export function AdminLabel({ children, required, className }: { children: React.ReactNode; required?: boolean; className?: string }) {
  return (
    <label className={cn('admin-label', className)}>
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}
