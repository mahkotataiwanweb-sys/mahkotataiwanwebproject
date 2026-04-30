'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { supabase } from '@/lib/supabase';
import { buildPageContentLookup, type PageContentRow, type PageContentLookup } from '@/lib/page-content';

/**
 * Client-side hook that loads `page_content` rows for a page slug from Supabase
 * once on mount and exposes the same `pick()` / `image()` helpers as the server
 * helper. Falls back transparently when a row is missing or still loading.
 *
 * Use in client components on /about, /contact, etc. so the CMS at /admin/pages
 * can edit the visible text without a code redeploy.
 */
export function usePageContent(page: string): {
  loading: boolean;
  /** Pick text for the current locale, with a fallback string. */
  text: (section: string, key: string, fallback?: string) => string;
  /** Get an image URL stored on a row, with optional fallback. */
  image: (section: string, key: string, fallback?: string) => string;
  /** Underlying lookup (for advanced uses, e.g. iterating a section). */
  lookup: PageContentLookup;
} {
  const locale = useLocale();
  const [rows, setRows] = useState<PageContentRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('page_content')
        .select('*')
        .eq('page', page)
        .eq('is_active', true)
        .order('section')
        .order('sort_order');
      if (cancelled) return;
      if (error || !data) setRows([]);
      else setRows(data as PageContentRow[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [page]);

  const lookup = useMemo(() => buildPageContentLookup(rows ?? []), [rows]);

  return {
    loading: rows === null,
    text: (section, key, fallback) => lookup.pick(section, key, locale, fallback),
    image: (section, key, fallback) => lookup.image(section, key, fallback),
    lookup,
  };
}
