import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import enMessages from '../../../../../messages/en.json';
import idMessages from '../../../../../messages/id.json';
import zhMessages from '../../../../../messages/zh-TW.json';

/**
 * Import every key from `messages/*.json` into the `page_content` table so
 * editors can override any text from `/admin/pages` without a code change.
 *
 * Idempotent — only adds rows that don't already exist for the same
 * `(page, section, key)` triple. Existing admin-edited values are left
 * untouched.
 *
 * The mapping mirrors the lookup convention of the `useEditableT` hook:
 *
 *   next-intl path                 →  (page, section, key)
 *   "about.title"                  →  ("about", "_", "title")
 *   "about.values.qualityFirst.title" → ("about", "values", "qualityFirst.title")
 *
 * Top-level namespace is mapped to the page slug used by `useEditableT`
 * (e.g. `whereToBuy` → `where-to-buy`, `discover` → `home`, `nav` → `navbar`,
 * `activity` → `activities`).
 */

// next-intl namespace → page_content.page slug
const NAMESPACE_TO_PAGE: Record<string, string> = {
  nav: 'navbar',
  hero: 'hero',
  about: 'about',
  products: 'products',
  recipes: 'recipes',
  events: 'events',
  activity: 'activities',
  discover: 'home',
  videoShowcase: 'home',
  whereToBuy: 'where-to-buy',
  contact: 'contact',
  footer: 'footer',
  articles: 'articles',
  store: 'where-to-buy',
  aboutPage: 'about',
  articlesPage: 'articles',
  whereToByPage: 'where-to-buy',
  contactPage: 'contact',
};

interface FlatEntry {
  page: string;
  section: string;
  key: string;
  value_en: string;
  value_id: string;
  value_zh: string;
  content_type: string;
}

function flatten(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') {
      out[path] = v;
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flatten(v as Record<string, unknown>, path));
    }
  }
  return out;
}

function buildEntries(): FlatEntry[] {
  const en = flatten(enMessages as unknown as Record<string, unknown>);
  const id = flatten(idMessages as unknown as Record<string, unknown>);
  const zh = flatten(zhMessages as unknown as Record<string, unknown>);

  const entries: FlatEntry[] = [];
  for (const [path, valueEn] of Object.entries(en)) {
    const dot = path.indexOf('.');
    if (dot === -1) continue; // skip stray scalar
    const namespace = path.slice(0, dot);
    const inner = path.slice(dot + 1);

    const page = NAMESPACE_TO_PAGE[namespace] || namespace;

    // Skip 'admin' and 'common' namespaces — internal CMS strings
    if (namespace === 'admin' || namespace === 'common') continue;

    const innerDot = inner.indexOf('.');
    let section: string;
    let key: string;
    if (innerDot === -1) {
      section = '_';
      key = inner;
    } else {
      section = inner.slice(0, innerDot);
      key = inner.slice(innerDot + 1);
    }

    entries.push({
      page,
      section,
      key,
      value_en: valueEn || '',
      value_id: id[path] || '',
      value_zh: zh[path] || '',
      content_type: valueEn.length > 100 ? 'textarea' : 'text',
    });
  }
  return entries;
}

export async function POST() {
  try {
    const admin = createAdminClient();
    const entries = buildEntries();

    // Fetch existing rows once and de-dupe by (page, section, key)
    const { data: existing, error: existingErr } = await admin
      .from('page_content')
      .select('page, section, key');
    if (existingErr) throw new Error(existingErr.message);

    const seen = new Set<string>(
      (existing || []).map((r: { page: string; section: string; key: string }) =>
        `${r.page}|${r.section}|${r.key}`
      )
    );

    const toInsert = entries
      .filter((e) => !seen.has(`${e.page}|${e.section}|${e.key}`))
      .map((e, i) => ({
        page: e.page,
        section: e.section,
        key: e.key,
        value_en: e.value_en,
        value_id: e.value_id,
        value_zh: e.value_zh,
        content_type: e.content_type,
        sort_order: i,
        is_active: true,
      }));

    let inserted = 0;
    // Insert in chunks to avoid request-size limits
    const CHUNK = 200;
    for (let i = 0; i < toInsert.length; i += CHUNK) {
      const slice = toInsert.slice(i, i + CHUNK);
      const { error } = await admin.from('page_content').insert(slice);
      if (error) throw new Error(error.message);
      inserted += slice.length;
    }

    return NextResponse.json({
      ok: true,
      total: entries.length,
      alreadyExisted: entries.length - toInsert.length,
      inserted,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Sync failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  // Quick preview of what will be synced (no writes)
  const entries = buildEntries();
  const byPage: Record<string, number> = {};
  for (const e of entries) byPage[e.page] = (byPage[e.page] || 0) + 1;
  return NextResponse.json({ totalKeys: entries.length, byPage });
}
