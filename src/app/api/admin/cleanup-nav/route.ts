import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

/**
 * One-shot DB cleanup: delete `navbar_menus` and `footer_links` rows whose
 * URL points to a page that no longer exists on the live site:
 *
 *   /gallery, /news, /lifestyle, /moments, /journal
 *
 * Idempotent — running multiple times is a no-op once the dead rows are gone.
 *
 * Returns the rows that were removed so the admin UI can show what changed.
 */

const DEAD_PATTERNS = ['/gallery', '/news', '/lifestyle', '/moments', '/journal'];
const DEAD_LABELS = ['gallery', 'news', 'lifestyle', 'moments', 'journal'];

async function purge(table: 'navbar_menus' | 'footer_links') {
  const admin = createAdminClient();

  // Pull rows first so we can return what was deleted (and decide which to drop)
  const { data: rows, error } = await admin.from(table).select('*');
  if (error) throw new Error(`${table} read: ${error.message}`);

  const dead = (rows || []).filter((r: { url?: string | null; label_en?: string | null }) => {
    const url = (r.url || '').toLowerCase();
    const label = (r.label_en || '').toLowerCase();
    if (DEAD_PATTERNS.some((p) => url.includes(p))) return true;
    if (DEAD_LABELS.includes(label)) return true;
    return false;
  });

  if (dead.length === 0) return { removed: [] as Array<{ id: string; url?: string | null; label_en?: string | null }>, count: 0 };

  const ids = dead.map((r: { id: string }) => r.id);
  const { error: delErr } = await admin.from(table).delete().in('id', ids);
  if (delErr) throw new Error(`${table} delete: ${delErr.message}`);

  return { removed: dead, count: dead.length };
}

export async function POST() {
  try {
    const navbar = await purge('navbar_menus');
    const footer = await purge('footer_links');
    return NextResponse.json({
      ok: true,
      navbar_deleted: navbar.count,
      footer_deleted: footer.count,
      removed: { navbar: navbar.removed, footer: footer.removed },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Cleanup failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
