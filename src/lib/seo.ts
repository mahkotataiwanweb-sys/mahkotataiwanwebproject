/**
 * Centralised SEO helpers — single source of truth for canonical URLs,
 * hreflang alternates, OpenGraph + Twitter cards, and JSON-LD blocks.
 *
 * Every page-level `layout.tsx` calls `buildPageMetadata` so a content
 * editor never has to touch <head>. The strings here are bilingual by
 * default (id / en / zh-TW) and fall back to Indonesian when a locale
 * is missing.
 */

import type { Metadata } from 'next';

export const SITE_URL = 'https://mahkotatw.com';
export const SITE_BRAND = 'Mahkota Taiwan';
export const LOCALES = ['id', 'en', 'zh-TW'] as const;
export type AppLocale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = 'id';

/** OG image — purpose-built 1200×630 PNG with dark navy gradient, crown
    logo and brand strapline. Lives in /public so it ships as a stable
    URL the social platforms can cache. */
export const DEFAULT_OG_IMAGE = '/og-image.png';

type LocaleString = Partial<Record<AppLocale, string>>;

interface PageCopy {
  title: LocaleString;
  description: LocaleString;
}

/* ------------------------------------------------------------------ */
/*  Per-page copy registry                                              */
/*                                                                      */
/*  Add a new entry whenever a new route ships. Keep titles ≤ 60 chars  */
/*  and descriptions 120-160 chars for healthy SERP previews.           */
/* ------------------------------------------------------------------ */
const PAGE_COPY: Record<string, PageCopy> = {
  '/': {
    title: {
      id: 'Mahkota Taiwan — Cita Rasa Indonesia di Taiwan',
      en: 'Mahkota Taiwan — Authentic Indonesian Food in Taiwan',
      'zh-TW': 'Mahkota Taiwan — 印尼正宗風味，在台灣',
    },
    description: {
      id: 'Distributor produk makanan Indonesia di Taiwan. 300+ toko mitra, bersertifikat halal, melayani diaspora Indonesia & pasar Taiwan sejak 2021.',
      en: 'Indonesian food distributor in Taiwan. 300+ partner stores, halal certified, serving the Indonesian diaspora and Taiwanese market since 2021.',
      'zh-TW': 'Mahkota Taiwan 是台灣最大的印尼食品分銷商，300+ 合作商店，清真認證，服務印尼社群與台灣市場。',
    },
  },
  '/about': {
    title: {
      id: 'Tentang Kami — Mahkota Taiwan',
      en: 'About Us — Mahkota Taiwan',
      'zh-TW': '關於我們 — Mahkota Taiwan',
    },
    description: {
      id: 'Mahkota Taiwan menjembatani budaya Indonesia dan kehidupan sehari-hari Taiwan lewat lebih dari 26 lini produk makanan halal.',
      en: 'Mahkota Taiwan bridges Indonesian culture and Taiwanese daily life through 26+ lines of halal-certified food products.',
      'zh-TW': 'Mahkota Taiwan 透過 26 種以上的清真認證食品，串連印尼文化與台灣日常生活。',
    },
  },
  '/products': {
    title: {
      id: 'Koleksi Produk — Mahkota Taiwan',
      en: 'Our Collection — Mahkota Taiwan',
      'zh-TW': '產品系列 — Mahkota Taiwan',
    },
    description: {
      id: 'Jelajahi koleksi makanan instan, bumbu, snack, dan minuman Indonesia. Semua bersertifikat halal dan didistribusikan di seluruh Taiwan.',
      en: 'Browse our Indonesian instant food, spices, snacks, and beverages. All halal-certified and distributed across Taiwan.',
      'zh-TW': '瀏覽 Mahkota Taiwan 的印尼即食食品、香料、零食與飲品 — 全部通過清真認證，全台配送。',
    },
  },
  '/recipes': {
    title: {
      id: 'Resep — Mahkota Taiwan',
      en: 'Recipes — Mahkota Taiwan',
      'zh-TW': '食譜 — Mahkota Taiwan',
    },
    description: {
      id: 'Inspirasi resep masakan Indonesia menggunakan produk Mahkota Taiwan — cepat, lezat, dan otentik.',
      en: 'Indonesian recipe inspiration using Mahkota Taiwan products — quick, delicious, and authentic.',
      'zh-TW': '使用 Mahkota Taiwan 產品的印尼食譜靈感 — 簡單、美味、正宗。',
    },
  },
  '/events': {
    title: {
      id: 'Acara — Mahkota Taiwan',
      en: 'Events — Mahkota Taiwan',
      'zh-TW': '活動 — Mahkota Taiwan',
    },
    description: {
      id: 'Acara budaya, festival, dan kegiatan komunitas Mahkota Taiwan di seluruh pulau.',
      en: 'Cultural events, festivals, and community activities by Mahkota Taiwan across the island.',
      'zh-TW': 'Mahkota Taiwan 在全台舉辦的文化活動、節慶與社群聚會。',
    },
  },
  '/activity': {
    title: {
      id: 'Aktivitas Komunitas — Mahkota Taiwan',
      en: 'Community Activity — Mahkota Taiwan',
      'zh-TW': '社群活動 — Mahkota Taiwan',
    },
    description: {
      id: 'Lihat bagaimana komunitas Indonesia menikmati produk Mahkota Taiwan dalam keseharian mereka.',
      en: 'See how the Indonesian community enjoys Mahkota Taiwan products in their everyday life.',
      'zh-TW': '看看印尼社群如何在日常生活中享受 Mahkota Taiwan 的產品。',
    },
  },
  '/contact': {
    title: {
      id: 'Kontak — Mahkota Taiwan',
      en: 'Contact — Mahkota Taiwan',
      'zh-TW': '聯絡我們 — Mahkota Taiwan',
    },
    description: {
      id: 'Hubungi Mahkota Taiwan untuk kerjasama distribusi, kemitraan toko, atau permintaan produk halal Indonesia.',
      en: 'Reach Mahkota Taiwan for distribution partnerships, retailer onboarding, or Indonesian halal product inquiries.',
      'zh-TW': '聯繫 Mahkota Taiwan，洽談分銷合作、商店加盟，或印尼清真產品詢問。',
    },
  },
  '/where-to-buy': {
    title: {
      id: 'Di Mana Membeli — Mahkota Taiwan',
      en: 'Where to Buy — Mahkota Taiwan',
      'zh-TW': '銷售據點 — Mahkota Taiwan',
    },
    description: {
      id: '300+ toko mitra di seluruh Taiwan yang menjual produk Mahkota Taiwan. Temukan toko terdekat dari Anda.',
      en: 'Find the nearest of 300+ partner stores across Taiwan that stock Mahkota Taiwan products.',
      'zh-TW': '全台 300+ 合作商店銷售 Mahkota Taiwan 產品。找到離您最近的據點。',
    },
  },
};

/* ------------------------------------------------------------------ */
/*  URL helpers                                                         */
/* ------------------------------------------------------------------ */

export function pickLocaleString(s: LocaleString | undefined, locale: string): string | undefined {
  if (!s) return undefined;
  return (s[locale as AppLocale] ?? s[DEFAULT_LOCALE]) || undefined;
}

export function buildUrl(locale: string, path = '/'): string {
  const safePath = path.startsWith('/') ? path : `/${path}`;
  return safePath === '/' ? `${SITE_URL}/${locale}` : `${SITE_URL}/${locale}${safePath}`;
}

export function buildLanguageAlternates(path = '/'): Record<string, string> {
  const alt: Record<string, string> = {};
  for (const l of LOCALES) {
    alt[l === 'zh-TW' ? 'zh-Hant' : l] = buildUrl(l, path);
  }
  alt['x-default'] = buildUrl(DEFAULT_LOCALE, path);
  return alt;
}

/* ------------------------------------------------------------------ */
/*  Metadata builder                                                    */
/* ------------------------------------------------------------------ */

export interface BuildMetadataInput {
  /** Route path relative to locale, e.g. '/products', '/articles/abc'. */
  path: string;
  locale: string;
  /** Override the title from PAGE_COPY (e.g. for slug pages). */
  title?: string;
  /** Override the description from PAGE_COPY. */
  description?: string;
  /** Override the OG image (e.g. article cover image absolute URL). */
  image?: string | null;
  /** OG type, defaults to 'website'. Articles use 'article'. */
  ogType?: 'website' | 'article';
}

export function buildPageMetadata(input: BuildMetadataInput): Metadata {
  const { path, locale, ogType = 'website' } = input;
  const safeLocale = (LOCALES as readonly string[]).includes(locale) ? locale : DEFAULT_LOCALE;

  // Normalise path so '/products/' matches '/products' in PAGE_COPY.
  const lookupPath = path === '' ? '/' : path.replace(/\/$/, '') || '/';
  const copy = PAGE_COPY[lookupPath];

  const title = input.title || pickLocaleString(copy?.title, safeLocale) || SITE_BRAND;
  const description =
    input.description ||
    pickLocaleString(copy?.description, safeLocale) ||
    pickLocaleString(PAGE_COPY['/']?.description, safeLocale)!;

  const canonical = buildUrl(safeLocale, lookupPath);
  const languages = buildLanguageAlternates(lookupPath);
  const image = input.image || DEFAULT_OG_IMAGE;
  const absoluteImage = image.startsWith('http') ? image : `${SITE_URL}${image}`;

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_BRAND,
      type: ogType,
      locale: safeLocale.replace('-', '_'),
      images: [{ url: absoluteImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [absoluteImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
    },
  };
}

/* ------------------------------------------------------------------ */
/*  JSON-LD builders                                                    */
/* ------------------------------------------------------------------ */

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_BRAND,
    alternateName: ['Mahkota TW', 'Mahkota'],
    url: SITE_URL,
    logo: `${SITE_URL}/images/logo.png`,
    foundingDate: '2021',
    description:
      "Indonesia's leading food distributor in Taiwan — 300+ partner stores across the island, halal certified.",
    sameAs: [
      'https://www.facebook.com/share/1DhYShuL19/?mibextid=wwXIfr',
      'https://www.instagram.com/mahkotatw',
      'https://www.tiktok.com/@mahkotataiwan',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+886-2-26099118',
      email: 'mahkotataiwan@gmail.com',
      contactType: 'customer service',
      areaServed: 'TW',
      availableLanguage: ['Indonesian', 'English', 'Chinese'],
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'No. 83, Liyuan 2nd Street, Linkou District',
      addressLocality: 'New Taipei City',
      addressCountry: 'TW',
    },
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

interface ArticleLike {
  title: string;
  description?: string | null;
  image?: string | null;
  url: string;
  publishedAt?: string | null;
  updatedAt?: string | null;
  type?: string | null;
}

export function articleJsonLd(article: ArticleLike) {
  return {
    '@context': 'https://schema.org',
    '@type': article.type === 'recipe' ? 'Recipe' : 'Article',
    headline: article.title,
    description: article.description || undefined,
    image: article.image ? [article.image] : undefined,
    datePublished: article.publishedAt || undefined,
    dateModified: article.updatedAt || article.publishedAt || undefined,
    author: { '@type': 'Organization', name: SITE_BRAND },
    publisher: {
      '@type': 'Organization',
      name: SITE_BRAND,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/images/logo.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': article.url },
  };
}

export function productJsonLd(p: {
  name: string;
  description?: string | null;
  image?: string | null;
  category?: string | null;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.description || undefined,
    image: p.image ? [p.image] : undefined,
    category: p.category || undefined,
    brand: { '@type': 'Brand', name: SITE_BRAND },
    url: p.url,
  };
}
