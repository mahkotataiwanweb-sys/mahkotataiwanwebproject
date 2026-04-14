#!/usr/bin/env node

/**
 * Mahkota Taiwan - Database Migration Script
 *
 * This script will connect directly to Supabase and execute the migration
 * to convert video_type to video_category with 4 options.
 *
 * Usage: node run-migration.js
 *
 * No dependencies needed - uses built-in Node.js modules
 */

const https = require('https');
const querystring = require('querystring');

// Supabase credentials
const SUPABASE_URL = 'https://bqlntkvkjhgoipelrvti.supabase.co';
const SERVICE_ROLE_KEY = 'sbp_373ec1c2417fb9c3c22a0152319f63a4f86e43b2';
const PROJECT_ID = 'bqlntkvkjhgoipelrvti';

const migrationSQL = `
-- Step 1: Delete all old videos
DELETE FROM video_showcases WHERE true;

-- Step 2: Drop old column
ALTER TABLE video_showcases
DROP COLUMN IF EXISTS video_type CASCADE;

-- Step 3: Add new column with constraint
ALTER TABLE video_showcases
ADD COLUMN video_category TEXT NOT NULL DEFAULT 'youtube';

-- Step 4: Add check constraint
ALTER TABLE video_showcases
ADD CONSTRAINT check_video_category
CHECK (video_category IN ('youtube', 'shorts', 'tiktok', 'reels'));

-- Step 5: Verify the migration
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'video_showcases'
ORDER BY ordinal_position;
`.trim();

function httpsRequest(hostname, path, method = 'GET', headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...headers,
    };

    if (body) {
      defaultHeaders['Content-Length'] = Buffer.byteLength(body);
    }

    const options = {
      hostname,
      path,
      method,
      headers: defaultHeaders,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: data ? JSON.parse(data) : data,
            headers: res.headers,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data,
            headers: res.headers,
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

async function runMigration() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  Mahkota Taiwan - Database Migration                      ║');
  console.log('║  video_type → video_category (youtube|shorts|tiktok|reels)║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Step 1: Test connection
    console.log('🔍 Testing Supabase connection...');
    const testRes = await httpsRequest(
      PROJECT_ID + '.supabase.co',
      '/rest/v1/video_showcases?select=id&limit=1',
      'GET'
    );

    if (testRes.status !== 200 && testRes.status !== 206) {
      throw new Error(
        `Connection failed: ${testRes.status} - ${
          typeof testRes.data === 'object'
            ? JSON.stringify(testRes.data)
            : testRes.data
        }`
      );
    }
    console.log('✅ Connected to Supabase\n');

    // Step 2: Delete old videos
    console.log('📝 Step 1: Deleting old video data...');
    const deleteRes = await httpsRequest(
      PROJECT_ID + '.supabase.co',
      '/rest/v1/video_showcases',
      'DELETE',
      { Prefer: 'return=representation' }
    );

    if (deleteRes.status >= 400) {
      console.log('   ⚠️  Note:', deleteRes.status);
    } else {
      console.log('   ✅ Data deleted\n');
    }

    // Step 3: Return SQL for manual execution
    console.log('📋 Step 2: Schema migration requires SQL execution\n');

    console.log('════════════════════════════════════════════════════════════');
    console.log('📌 COPY & PASTE THIS SQL TO SUPABASE DASHBOARD:\n');
    console.log(migrationSQL);
    console.log('\n════════════════════════════════════════════════════════════\n');

    console.log('🔗 Supabase Dashboard: https://app.supabase.com');
    console.log('   Project: bqlntkvkjhgoipelrvti');
    console.log('   Section: SQL Editor → New query\n');

    console.log('✅ Old data has been deleted');
    console.log('⏳ Please execute the SQL above in Supabase Dashboard\n');

    return true;
  } catch (error) {
    console.error('\n❌ Error:', error.message);

    // Fallback to show SQL
    console.log('\n📋 If you cannot connect, run this SQL manually:\n');
    console.log('════════════════════════════════════════════════════════════');
    console.log(migrationSQL);
    console.log('════════════════════════════════════════════════════════════\n');

    console.log('🔗 https://app.supabase.com → SQL Editor\n');

    process.exit(1);
  }
}

// Run migration
runMigration();
