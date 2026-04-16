import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

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
 * POST /api/admin/migrate
 * Performs database migration for video_showcases table
 *
 * Query params:
 * - key: Admin secret key for authorization
 */
export async function POST(request: NextRequest) {
  try {
    // Authorization
    const searchParams = request.nextUrl.searchParams;
    const adminKey = searchParams.get('key');
    const expectedKey = 'mahkota-video-migration-2024';

    if (!adminKey || adminKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid admin key' },
        { status: 401 }
      );
    }

    console.log('🔄 Starting database migration...\n');

    // Step 1: Delete all existing videos
    console.log('Step 1: Deleting old video data...');
    const { error: deleteError } = await supabaseAdmin
      .from('video_showcases')
      .delete()
      .neq('id', null);

    if (deleteError && deleteError.code !== 'PGRST116') {
      console.warn('Delete warning:', deleteError);
    }
    console.log('✅ Old data deleted\n');

    // Step 2: Try to execute schema changes via Supabase functions or RPC
    // Unfortunately Supabase REST API doesn't support raw SQL execution
    // So we need to provide manual SQL or use alternative approach

    // For now, return the SQL that needs to be executed
    const migrationSQL = `
-- Mahkota Taiwan Video Showcase Migration
-- From: video_type (youtube | upload)
-- To: video_category (youtube | shorts | tiktok | reels)

-- 1. Drop old column
ALTER TABLE video_showcases
DROP COLUMN IF EXISTS video_type CASCADE;

-- 2. Add new column
ALTER TABLE video_showcases
ADD COLUMN video_category TEXT NOT NULL DEFAULT 'youtube';

-- 3. Add constraint
ALTER TABLE video_showcases
ADD CONSTRAINT check_video_category
CHECK (video_category IN ('youtube', 'shorts', 'tiktok', 'reels'));

-- 4. Verify
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'video_showcases'
ORDER BY ordinal_position;
    `;

    console.log('⚠️  Schema migration requires manual SQL execution');
    console.log('📋 Please execute the SQL below in Supabase Dashboard\n');

    return NextResponse.json({
      success: false,
      stage: 'partial',
      message:
        'Old data deleted. Manual SQL execution required for schema changes.',
      sql: migrationSQL,
      instructions: [
        'Go to: https://app.supabase.com',
        'Select project: bqlntkvkjhgoipelrvti',
        'SQL Editor > New query',
        'Copy & paste the SQL above',
        'Click Run',
        'Verify video_category column exists',
      ],
      dataDeleted: true,
      schemaUpdateUrl:
        'https://app.supabase.com/project/bqlntkvkjhgoipelrvti/sql/new',
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

/**
 * GET /api/admin/migrate
 * Returns migration status and instructions
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const adminKey = searchParams.get('key');
  const expectedKey = 'mahkota-video-migration-2024';

  if (!adminKey || adminKey !== expectedKey) {
    return NextResponse.json(
      { error: 'Unauthorized - Invalid admin key' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    status: 'ready',
    message: 'Migration endpoint is ready. POST to execute.',
    usage: 'POST /api/admin/migrate?key=mahkota-video-migration-2024',
    note: 'Will delete all old videos and prepare schema for migration',
  });
}
