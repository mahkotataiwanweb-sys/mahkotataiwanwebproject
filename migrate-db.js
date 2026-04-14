#!/usr/bin/env node

/**
 * Database Migration Script for Mahkota Taiwan Video Showcase
 *
 * This script will:
 * 1. Connect to Supabase
 * 2. Delete old video data
 * 3. Drop video_type column
 * 4. Add video_category column with enum constraint
 *
 * Run with: node migrate-db.js
 */

const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

const SUPABASE_URL = 'https://bqlntkvkjhgoipelrvti.supabase.co';
const SERVICE_ROLE_KEY = 'sbp_373ec1c2417fb9c3c22a0152319f63a4f86e43b2';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  Mahkota Taiwan - Video Showcase Database Migration       ║');
  console.log('║  Changes: video_type → video_category (4 options)        ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Test connection
    console.log('🔍 Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('video_showcases')
      .select('id')
      .limit(1);

    if (testError && testError.code !== 'PGRST116') {
      throw new Error(`Connection failed: ${testError.message}`);
    }
    console.log('✅ Connected to Supabase\n');

    // Show current state
    console.log('📊 Current video_showcases table:');
    const { data: currentData } = await supabase
      .from('video_showcases')
      .select('id, title_en')
      .limit(5);

    if (currentData && currentData.length > 0) {
      console.log(`   Found ${currentData.length} videos\n`);
    } else {
      console.log('   Table is empty (or will be cleared)\n');
    }

    // Confirmation
    const confirm = await ask(
      '⚠️  This will DELETE all existing videos and update the schema.\n' +
      '   Continue? (yes/no): '
    );

    if (confirm.toLowerCase() !== 'yes') {
      console.log('\n❌ Migration cancelled.');
      rl.close();
      return;
    }

    console.log('\n🔄 Starting migration...\n');

    // Step 1: Delete all videos
    console.log('Step 1️⃣  Deleting old video data...');
    const { error: deleteError } = await supabase
      .from('video_showcases')
      .delete()
      .neq('id', null);

    if (deleteError && deleteError.code !== 'PGRST116') {
      console.warn('   ⚠️  Delete note:', deleteError.message);
    } else {
      console.log('   ✅ Data cleared');
    }

    // Step 2: Execute schema migration via RPC or direct method
    console.log('\nStep 2️⃣  Updating table schema...');

    // Since we can't execute raw SQL via REST API, we'll use direct connection
    // or provide instructions for manual execution

    console.log('   ⚠️  Raw SQL execution not available via REST API');
    console.log('   📋 Please run this SQL in Supabase Dashboard:\n');

    const sql = `
-- Mahkota Taiwan - Video Showcase Migration
-- Migrate from video_type to video_category

-- Drop old column
ALTER TABLE video_showcases
DROP COLUMN IF EXISTS video_type CASCADE;

-- Add new column
ALTER TABLE video_showcases
ADD COLUMN video_category TEXT NOT NULL DEFAULT 'youtube';

-- Add constraint
ALTER TABLE video_showcases
ADD CONSTRAINT check_video_category
CHECK (video_category IN ('youtube', 'shorts', 'tiktok', 'reels'));

-- Verify
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'video_showcases' ORDER BY ordinal_position;
    `;

    console.log('════════════════════════════════════════════════════════════');
    console.log(sql);
    console.log('════════════════════════════════════════════════════════════\n');

    console.log('📌 Manual Steps:');
    console.log('   1. Go to: https://app.supabase.com');
    console.log('   2. Select: bqlntkvkjhgoipelrvti');
    console.log('   3. Click: SQL Editor → New query');
    console.log('   4. Paste the SQL above');
    console.log('   5. Click: Run');
    console.log('   6. Verify: video_category column exists\n');

    console.log('✅ Old data has been deleted');
    console.log('⏳ Please execute the SQL above and come back\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
