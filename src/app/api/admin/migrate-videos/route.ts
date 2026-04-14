import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Use service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * POST /api/admin/migrate-videos
 *
 * This endpoint performs database migration for video_showcases table:
 * - Deletes old video data
 * - Removes video_type column
 * - Adds video_category column with enum constraint
 */
export async function POST(request: NextRequest) {
  try {
    // Security: Check for admin token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_SECRET_KEY}`) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    console.log('🔄 Starting database migration for video_showcases...');

    // Step 1: Delete all existing video records
    console.log('Step 1: Deleting old video data...');
    const { error: deleteError } = await supabaseAdmin
      .from('video_showcases')
      .delete()
      .neq('id', null);

    if (deleteError && deleteError.code !== 'PGRST116') {
      console.warn('Delete warning:', deleteError);
    } else {
      console.log('✅ Old data deleted');
    }

    // Since Supabase REST API doesn't support raw SQL execution,
    // we return the SQL that needs to be executed manually
    const sql = `
-- 1. Delete all old data (backup first if needed!)
DELETE FROM video_showcases WHERE true;

-- 2. Drop old video_type column
ALTER TABLE video_showcases
DROP COLUMN IF EXISTS video_type CASCADE;

-- 3. Add new video_category column with constraint
ALTER TABLE video_showcases
ADD COLUMN video_category TEXT NOT NULL DEFAULT 'youtube';

-- 4. Add check constraint for 4 categories
ALTER TABLE video_showcases
ADD CONSTRAINT check_video_category
CHECK (video_category IN ('youtube', 'shorts', 'tiktok', 'reels'));

-- 5. Verify table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'video_showcases'
ORDER BY ordinal_position;
    `.trim();

    console.log('✅ Migration prepared');

    return NextResponse.json({
      success: true,
      message: 'Migration SQL generated. Execute in Supabase Dashboard SQL Editor.',
      sql: sql,
      instructions: [
        '1. Go to https://app.supabase.com',
        '2. Select project: bqlntkvkjhgoipelrvti',
        '3. Click "SQL Editor" in left sidebar',
        '4. Click "+ New query"',
        '5. Copy & paste the SQL above',
        '6. Click "Run"',
        '7. Verify: Table should show video_category column',
      ],
    });
  } catch (error) {
    console.error('❌ Migration error:', error);
    return NextResponse.json(
      {
        error: 'Migration failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
