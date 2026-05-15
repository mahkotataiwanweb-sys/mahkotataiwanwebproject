import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { LOCALES, SITE_URL, buildLanguageAlternates } from '@/lib/seo';

const STATIC_PATHS = [
  '/',
  '/about',
  '/contact',
  '/products',
  '/recipes',
  '/events',
  '/activity',
  '/where-to-buy',
];

export const revalidate = 3600; // re-generate hourly

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  const now = new Date();

  /* Static routes ------------------------------------------------- */
  for (const path of STATIC_PATHS) {
    for (const locale of LOCALES) {
      const url = path === '/' ? `${SITE_URL}/${locale}` : `${SITE_URL}/${locale}${path}`;
      entries.push({
        url,
        lastModified: now,
        changeFrequency: path === '/' ? 'weekly' : 'monthly',
        priority: path === '/' ? 1.0 : 0.7,
        alternates: { languages: buildLanguageAlternates(path) },
      });
    }
  }

  /* Dynamic routes (Supabase) ------------------------------------- */
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
    const { data: articles } = await supabase
      .from('articles')
      .select('slug,type,updated_at')
      .eq('is_active', true);

    if (articles) {
      for (const a of articles) {
        const route = a.type === 'recipe' ? 'recipes' : 'articles';
        for (const locale of LOCALES) {
          const path = `/${route}/${a.slug}`;
          entries.push({
            url: `${SITE_URL}/${locale}${path}`,
            lastModified: a.updated_at ? new Date(a.updated_at) : now,
            changeFrequency: 'monthly',
            priority: 0.6,
            alternates: { languages: buildLanguageAlternates(path) },
          });
        }
      }
    }
  }

  return entries;
}
