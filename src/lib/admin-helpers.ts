import { supabase } from './supabase';

/**
 * Swap sort_order between two rows in a table.
 * Both rows must already have a `sort_order` column.
 */
export async function swapSortOrder<T extends { id: string; sort_order: number }>(
  table: string,
  a: T,
  b: T
) {
  const aOrder = a.sort_order;
  const bOrder = b.sort_order;
  // To avoid unique constraint conflicts (none here, but safe), use a temp value
  await supabase.from(table).update({ sort_order: -1 }).eq('id', a.id);
  await supabase.from(table).update({ sort_order: aOrder }).eq('id', b.id);
  await supabase.from(table).update({ sort_order: bOrder }).eq('id', a.id);
}

export function moveItem<T>(arr: T[], from: number, to: number): T[] {
  if (from === to) return arr;
  const next = arr.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('id-ID', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch {
    return value;
  }
}
