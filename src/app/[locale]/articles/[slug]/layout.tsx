import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { buildPageMetadata, articleJsonLd, SITE_URL, pickLocaleString } from '@/lib/seo';

type RouteParams = { locale: string; slug: string };

async function fetchArticle(slug: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data } = await supabase
    .from('articles')
    .select('slug,type,title_en,title_id,title_zh,excerpt_en,excerpt_id,excerpt_zh,description_en,description_id,description_zh,image_url,published_at,updated_at')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();
  return data;
}

export async function generateMetadata({ params }: { params: Promise<RouteParams> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = await fetchArticle(slug);
  if (!article) {
    return buildPageMetadata({ path: `/articles/${slug}`, locale });
  }
  const title = pickLocaleString(
    { id: article.title_id, en: article.title_en, 'zh-TW': article.title_zh },
    locale,
  );
  const description = pickLocaleString(
    {
      id: article.description_id || article.excerpt_id,
      en: article.description_en || article.excerpt_en,
      'zh-TW': article.description_zh || article.excerpt_zh,
    },
    locale,
  );
  return buildPageMetadata({
    path: `/articles/${slug}`,
    locale,
    title,
    description,
    image: article.image_url,
    ogType: 'article',
  });
}

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<RouteParams>;
}) {
  const { locale, slug } = await params;
  const article = await fetchArticle(slug);

  const jsonLd = article
    ? articleJsonLd({
        title:
          pickLocaleString(
            { id: article.title_id, en: article.title_en, 'zh-TW': article.title_zh },
            locale,
          ) || '',
        description: pickLocaleString(
          {
            id: article.description_id || article.excerpt_id,
            en: article.description_en || article.excerpt_en,
            'zh-TW': article.description_zh || article.excerpt_zh,
          },
          locale,
        ),
        image: article.image_url || null,
        url: `${SITE_URL}/${locale}/articles/${slug}`,
        publishedAt: article.published_at,
        updatedAt: article.updated_at,
        type: article.type,
      })
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
