import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { buildPageMetadata, articleJsonLd, SITE_URL, pickLocaleString } from '@/lib/seo';

type RouteParams = { locale: string; slug: string };

async function fetchRecipe(slug: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data } = await supabase
    .from('articles')
    .select('slug,type,title_en,title_id,title_zh,excerpt_en,excerpt_id,excerpt_zh,description_en,description_id,description_zh,image_url,published_at,updated_at')
    .eq('slug', slug)
    .eq('type', 'recipe')
    .eq('is_active', true)
    .single();
  return data;
}

export async function generateMetadata({ params }: { params: Promise<RouteParams> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const recipe = await fetchRecipe(slug);
  if (!recipe) {
    return buildPageMetadata({ path: `/recipes/${slug}`, locale });
  }
  const title = pickLocaleString(
    { id: recipe.title_id, en: recipe.title_en, 'zh-TW': recipe.title_zh },
    locale,
  );
  const description = pickLocaleString(
    {
      id: recipe.description_id || recipe.excerpt_id,
      en: recipe.description_en || recipe.excerpt_en,
      'zh-TW': recipe.description_zh || recipe.excerpt_zh,
    },
    locale,
  );
  return buildPageMetadata({
    path: `/recipes/${slug}`,
    locale,
    title,
    description,
    image: recipe.image_url,
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
  const recipe = await fetchRecipe(slug);

  const jsonLd = recipe
    ? articleJsonLd({
        title:
          pickLocaleString(
            { id: recipe.title_id, en: recipe.title_en, 'zh-TW': recipe.title_zh },
            locale,
          ) || '',
        description: pickLocaleString(
          {
            id: recipe.description_id || recipe.excerpt_id,
            en: recipe.description_en || recipe.excerpt_en,
            'zh-TW': recipe.description_zh || recipe.excerpt_zh,
          },
          locale,
        ),
        image: recipe.image_url || null,
        url: `${SITE_URL}/${locale}/recipes/${slug}`,
        publishedAt: recipe.published_at,
        updatedAt: recipe.updated_at,
        type: 'recipe',
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
