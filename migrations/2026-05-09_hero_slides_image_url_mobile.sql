-- ─────────────────────────────────────────────────────────────────────────────
-- Mahkota Taiwan — Hero slides: add mobile (3:4) image column
-- 2026-05-09
--
-- Run this once in Supabase SQL Editor.
--
-- Adds `image_url_mobile` to hero_slides so CMS admins can upload a separate
-- 3:4 portrait image for phones. The frontend renders this on small viewports
-- and falls back to `image_url` (desktop 10:5) when the mobile column is null.
--
-- Idempotent: safe to run multiple times.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE hero_slides ADD COLUMN IF NOT EXISTS image_url_mobile TEXT;
