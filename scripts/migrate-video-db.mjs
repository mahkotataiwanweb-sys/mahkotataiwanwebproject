import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bqlntkvkjhgoipelrvti.supabase.co';
const serviceRoleKey = 'sbp_373ec1c2417fb9c3c22a0152319f63a4f86e43b2';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function migrate() {
  console.log('🔄 Starting Supabase database migration...\n');

  try {
    // Step 1: Delete all old video data
    console.log('📝 Step 1: Deleting old video data...');
    const { error: deleteError } = await supabase
      .from('video_showcases')
      .delete()
      .neq('id', null);

    if (deleteError && deleteError.code !== 'PGRST116') {
      console.log('Delete result:', deleteError);
    }
    console.log('✅ Old data cleared\n');

    // Since Supabase REST API doesn't support raw SQL execution,
    // we provide the SQL for manual execution
    
    console.log('⚠️  To complete the migration, please run this SQL in Supabase Dashboard:\n');

    const sql = `-- Delete all old data
DELETE FROM video_showcases;

-- Drop old column
ALTER TABLE video_showcases 
DROP COLUMN IF EXISTS video_type CASCADE;

-- Add new column with constraint
ALTER TABLE video_showcases
ADD COLUMN video_category TEXT NOT NULL DEFAULT 'youtube';

-- Add check constraint
ALTER TABLE video_showcases
ADD CONSTRAINT check_video_category CHECK (video_category IN ('youtube', 'shorts', 'tiktok', 'reels'));

-- Verify table structure
SELECT column_name, data_type, is_nullable FROM information_schema.columns 
WHERE table_name = 'video_showcases' ORDER BY ordinal_position;`;

    console.log('════════════════════════════════════════════════════════════');
    console.log(sql);
    console.log('════════════════════════════════════════════════════════════\n');

    console.log('📋 Steps:');
    console.log('1. Go to: https://app.supabase.com');
    console.log('2. Select your project (bqlntkvkjhgoipelrvti)');
    console.log('3. Click "SQL Editor" in sidebar');
    console.log('4. Click "New query"');
    console.log('5. Copy & paste the SQL above');
    console.log('6. Click "Run"');
    console.log('7. Done! ✅\n');

  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

migrate();
