import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

/**
 * Idempotently insert the canonical Mahkota Taiwan navbar structure into
 * `navbar_menus`. Existing rows with matching URLs are NOT touched, so an
 * admin who customised a label keeps their edit; only genuinely missing
 * entries are added.
 *
 * Canonical structure (matches the live site):
 *   Home                → /
 *   Products            → /products            (parent dropdown)
 *     Our Collection    → /products
 *     Recipes           → /recipes
 *   Events              → /events
 *   Activity            → /activity
 *   About               → /about
 *   Contact             → /contact
 *   Where to Buy        → /where-to-buy
 *
 * Useful when the DB was seeded for an older site layout (Lifestyle, News,
 * Gallery, Moments, Journal) and never updated.
 */

interface CanonicalChild {
  url: string;
  label_en: string;
  label_id: string;
  label_zh: string;
}

interface CanonicalItem extends CanonicalChild {
  children?: CanonicalChild[];
}

const CANONICAL: CanonicalItem[] = [
  { url: '/',             label_en: 'Home',         label_id: 'Beranda',      label_zh: '首頁' },
  {
    url: '/products',     label_en: 'Products',     label_id: 'Produk',       label_zh: '產品',
    children: [
      { url: '/products', label_en: 'Our Collection', label_id: 'Koleksi Kami', label_zh: '我們的系列' },
      { url: '/recipes',  label_en: 'Recipes',        label_id: 'Resep',        label_zh: '食譜' },
    ],
  },
  { url: '/events',        label_en: 'Events',       label_id: 'Acara',        label_zh: '活動' },
  { url: '/activity',      label_en: 'Activity',     label_id: 'Aktivitas',    label_zh: '動態' },
  { url: '/about',         label_en: 'About',        label_id: 'Tentang',      label_zh: '關於我們' },
  { url: '/contact',       label_en: 'Contact',      label_id: 'Kontak',       label_zh: '聯絡' },
  { url: '/where-to-buy',  label_en: 'Where to Buy', label_id: 'Lokasi Toko',  label_zh: '購買地點' },
];

interface DbRow {
  id: string;
  parent_id: string | null;
  url: string;
  label_en: string;
}

export async function POST() {
  try {
    const admin = createAdminClient();

    const { data: existingRaw, error: readErr } = await admin
      .from('navbar_menus')
      .select('id, parent_id, url, label_en');
    if (readErr) throw new Error(readErr.message);
    const existing = (existingRaw || []) as DbRow[];

    // Match by exact URL + parent (top-level rows have parent_id null)
    const findRow = (url: string, parentId: string | null = null) =>
      existing.find(
        (r) =>
          r.url === url &&
          (parentId === null ? r.parent_id === null : r.parent_id === parentId)
      );

    const inserted: { url: string; label: string; parent: string | null }[] = [];

    let topOrder = 0;
    for (const item of CANONICAL) {
      let parentRow = findRow(item.url, null);
      if (!parentRow) {
        const { data, error } = await admin
          .from('navbar_menus')
          .insert({
            parent_id: null,
            label_en: item.label_en,
            label_id: item.label_id,
            label_zh: item.label_zh,
            url: item.url,
            sort_order: topOrder,
            is_active: true,
          })
          .select('id, parent_id, url, label_en')
          .single();
        if (error) throw new Error(`insert ${item.label_en}: ${error.message}`);
        parentRow = data as DbRow;
        existing.push(parentRow);
        inserted.push({ url: item.url, label: item.label_en, parent: null });
      }
      topOrder += 1;

      if (item.children?.length) {
        let childOrder = 0;
        for (const child of item.children) {
          if (!findRow(child.url, parentRow.id)) {
            const { error } = await admin.from('navbar_menus').insert({
              parent_id: parentRow.id,
              label_en: child.label_en,
              label_id: child.label_id,
              label_zh: child.label_zh,
              url: child.url,
              sort_order: childOrder,
              is_active: true,
            });
            if (error) throw new Error(`insert child ${child.label_en}: ${error.message}`);
            inserted.push({ url: child.url, label: child.label_en, parent: parentRow.label_en });
          }
          childOrder += 1;
        }
      }
    }

    return NextResponse.json({
      ok: true,
      inserted_count: inserted.length,
      inserted,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Seed failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
