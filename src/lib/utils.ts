import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getLocalizedField(
  item: any,
  field: string,
  locale: string
): string {
  const key = locale === 'zh-TW' ? `${field}_zh` : `${field}_${locale}`;
  return (item[key] as string) || (item[`${field}_en`] as string) || '';
}
