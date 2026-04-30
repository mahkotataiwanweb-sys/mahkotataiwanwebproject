import { createClient } from '@supabase/supabase-js';
import { cache } from 'react';

/**
 * Fetch all `page_content` rows for a given page slug, on the server, with
 * React `cache()` so multiple components rendering the same page reuse the
 * same Supabase round-trip per request.
 *
 * Used by public pages (About, Contact, etc.) so the CMS at /admin/pages can
 * edit the visible text and images without a code change.
 */
export interface PageContentRow {
  id: string;
  page: string;
  section: string;
  key: string;
  value_en: string;
  value_id: string;
  value_zh: string;
  content_type: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export const fetchPageContent = cache(async (page: string): Promise<PageContentRow[]> => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  const sb = createClient(url, key);
  const { data, error } = await sb
    .from('page_content')
    .select('*')
    .eq('page', page)
    .eq('is_active', true)
    .order('section')
    .order('sort_order');
  if (error || !data) return [];
  return data as PageContentRow[];
});

/**
 * Convert a list of rows into a nested lookup: section → key → row.
 * Use the returned `pick(section, key, locale, fallback?)` to read text.
 */
export function buildPageContentLookup(rows: PageContentRow[]) {
  const map = new Map<string, Map<string, PageContentRow>>();
  for (const r of rows) {
    if (!map.has(r.section)) map.set(r.section, new Map());
    map.get(r.section)!.set(r.key, r);
  }
  return {
    get(section: string, key: string): PageContentRow | undefined {
      return map.get(section)?.get(key);
    },
    pick(section: string, key: string, locale: string, fallback?: string): string {
      const row = map.get(section)?.get(key);
      if (!row) return fallback ?? '';
      const lang = locale === 'zh-TW' ? 'zh' : locale === 'id' ? 'id' : 'en';
      const value = (row[`value_${lang}` as 'value_en'] || row.value_en || '').trim();
      return value || fallback || '';
    },
    image(section: string, key: string, fallback?: string): string {
      return map.get(section)?.get(key)?.image_url || fallback || '';
    },
    /** All rows for a section, ordered by sort_order. */
    section(section: string): PageContentRow[] {
      const inner = map.get(section);
      if (!inner) return [];
      return Array.from(inner.values()).sort((a, b) => a.sort_order - b.sort_order);
    },
  };
}

export type PageContentLookup = ReturnType<typeof buildPageContentLookup>;

/** Convenience: fetch + build lookup in one call. */
export async function getPageContent(page: string): Promise<PageContentLookup> {
  const rows = await fetchPageContent(page);
  return buildPageContentLookup(rows);
}
