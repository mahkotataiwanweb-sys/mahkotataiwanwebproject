'use client';

import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  active: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

export default function StatusPill({ active, onClick, size = 'md' }: Props) {
  const Icon = active ? Eye : EyeOff;
  const className = cn(
    'admin-pill cursor-pointer transition-colors',
    active ? 'admin-pill-success' : 'admin-pill-danger',
    size === 'sm' && 'text-[10px] py-0.5 px-2'
  );
  return (
    <button type="button" onClick={onClick} className={className}>
      <Icon className="w-3 h-3" />
      {active ? 'Active' : 'Inactive'}
    </button>
  );
}
