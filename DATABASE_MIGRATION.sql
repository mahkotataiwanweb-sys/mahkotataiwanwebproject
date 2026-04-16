-- ═══════════════════════════════════════════════════════════════════════════════
-- SUPABASE DATABASE MIGRATION: video_showcases TABLE
-- ═══════════════════════════════════════════════════════════════════════════════
-- Purpose: Migrate from video_type (youtube|upload) to video_category (youtube|shorts|tiktok|reels)
-- Date: 2026-04-14
-- ═══════════════════════════════════════════════════════════════════════════════

-- Step 1: Delete all old video data (clean slate for new schema)
-- ⚠️  WARNING: This will delete all existing videos!
DELETE FROM video_showcases WHERE true;

-- Step 2: Drop the old video_type column
ALTER TABLE video_showcases
DROP COLUMN IF EXISTS video_type CASCADE;

-- Step 3: Add new video_category column with 4 categories
ALTER TABLE video_showcases
ADD COLUMN video_category TEXT NOT NULL DEFAULT 'youtube';

-- Step 4: Add constraint to enforce only 4 valid categories
ALTER TABLE video_showcases
ADD CONSTRAINT check_video_category
CHECK (video_category IN ('youtube', 'shorts', 'tiktok', 'reels'));

-- Step 5: Verify the table structure (run this to confirm migration successful)
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'video_showcases'
ORDER BY ordinal_position;

-- ═══════════════════════════════════════════════════════════════════════════════
-- SUCCESS INDICATOR:
-- If you see these columns in the result:
-- - id (uuid)
-- - title_en, title_id, title_zh (text)
-- - description_en, description_id, description_zh (text)
-- - video_category (text) ← NEW COLUMN
-- - video_url (text)
-- - thumbnail_url (text)
-- - sort_order (bigint)
-- - is_active (boolean)
-- - created_at, updated_at (timestamp)
-- Then migration is SUCCESSFUL! ✅
-- ═══════════════════════════════════════════════════════════════════════════════
