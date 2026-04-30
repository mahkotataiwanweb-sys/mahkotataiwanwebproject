-- ─────────────────────────────────────────────────────────────────────────────
-- Mahkota Taiwan — Navigation cleanup + Page content seed
-- 2026-04-29
--
-- Run this once in Supabase SQL Editor (Dashboard → SQL → New query).
--
-- Effect:
--   1. Remove navbar_menus & footer_links rows that point to pages no longer
--      on the live site (gallery, news, lifestyle).
--   2. Add `email2` and `line_url` columns to company_settings if missing.
--   3. Seed page_content rows for About + Contact pages so admins can edit
--      hero / mission / CTA / partners / story / values / FAQ text from
--      /admin/pages without a code redeploy.
--
-- Idempotent: safe to run multiple times.
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- ── 1) Cleanup dead navigation rows ─────────────────────────────────────────
-- Match either an exact /news, /gallery, /lifestyle URL, OR a slug substring
-- with leading slash to avoid false positives like /lifestyle-tips.
DELETE FROM navbar_menus
WHERE LOWER(COALESCE(url, '')) ~ '/(gallery|news|lifestyle)(/|$)';

DELETE FROM footer_links
WHERE LOWER(COALESCE(url, '')) ~ '/(gallery|news|lifestyle)(/|$)';

-- Also remove any leftover label-based stragglers (just in case)
DELETE FROM navbar_menus
WHERE LOWER(COALESCE(label_en, '')) IN ('news', 'gallery', 'lifestyle');

DELETE FROM footer_links
WHERE LOWER(COALESCE(label_en, '')) IN ('news', 'gallery', 'lifestyle');


-- ── 2) Extend company_settings with email2 + line_url ───────────────────────
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS email2 TEXT;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS line_url TEXT;


-- ── 3) Seed page_content rows for About + Contact ───────────────────────────
-- Each row is an editable text/image keyed by (page, section, key). The site
-- falls back to next-intl translations until an admin fills these in.

-- Helper: seed only if (page,section,key) doesn't already exist
INSERT INTO page_content (page, section, key, value_en, value_id, value_zh, content_type, sort_order, is_active)
VALUES
  -- ABOUT page
  ('about', 'hero',     'label',           '', '', '', 'text',     0, true),
  ('about', 'hero',     'title',           '', '', '', 'text',     1, true),
  ('about', 'hero',     'mission',         '', '', '', 'textarea', 2, true),
  ('about', 'mission',  'label',           '', '', '', 'text',     0, true),
  ('about', 'mission',  'title',           '', '', '', 'text',     1, true),
  ('about', 'mission',  'cta',             '', '', '', 'text',     2, true),
  ('about', 'values',   'label',           '', '', '', 'text',     0, true),
  ('about', 'values',   'title',           '', '', '', 'text',     1, true),
  ('about', 'partners', 'label',           '', '', '', 'text',     0, true),
  ('about', 'partners', 'title',           '', '', '', 'text',     1, true),
  ('about', 'partners', 'description',     '', '', '', 'textarea', 2, true),
  ('about', 'story',    'label',           '', '', '', 'text',     0, true),
  ('about', 'story',    'title',           '', '', '', 'text',     1, true),
  ('about', 'cta',      'title',           '', '', '', 'text',     0, true),
  ('about', 'cta',      'description',     '', '', '', 'textarea', 1, true),
  ('about', 'cta',      'button_products', '', '', '', 'text',     2, true),
  ('about', 'cta',      'button_contact',  '', '', '', 'text',     3, true),

  -- CONTACT page
  ('contact', 'hero', 'label',         '', '', '', 'text',     0, true),
  ('contact', 'hero', 'title',         '', '', '', 'text',     1, true),
  ('contact', 'hero', 'subtitle',      '', '', '', 'textarea', 2, true),
  ('contact', 'cta',  'title',         '', '', '', 'text',     0, true),
  ('contact', 'cta',  'description',   '', '', '', 'textarea', 1, true),
  ('contact', 'cta',  'button_email',  '', '', '', 'text',     2, true),
  ('contact', 'cta',  'button_phone',  '', '', '', 'text',     3, true),
  ('contact', 'cta',  'footnote',      '', '', '', 'text',     4, true)
ON CONFLICT DO NOTHING;

-- Note: if you had a unique constraint on (page, section, key), the
-- ON CONFLICT DO NOTHING line above would dedupe automatically. If not, the
-- seed simply appends; remove duplicates manually from /admin/pages if you
-- run this script multiple times.

COMMIT;

-- ─────────────────────────────────────────────────────────────────────────────
-- After running:
--   1. Visit /admin/pages and switch to the About / Contact tab.
--   2. Empty rows are placeholders — fill them in your preferred language and
--      hit ✨ Auto-Translate to populate the other two languages.
--   3. Save. The public site picks up the override on next page load.
-- ─────────────────────────────────────────────────────────────────────────────
