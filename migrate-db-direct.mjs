#!/usr/bin/env node

/**
 * Direct Postgres Migration for Mahkota Taiwan
 * Uses direct database connection to execute schema migration
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Supabase credentials
const DB_HOST = 'db.bqlntkvkjhgoipelrvti.supabase.co';
const DB_USER = 'postgres';
const DB_PASSWORD = 'MahkotaTaiwan168';
const DB_NAME = 'postgres';
const DB_PORT = '5432';

// Build connection string
const CONNECTION_STRING = `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

const MIGRATION_SQL = `
-- 1. Delete all old data
DELETE FROM video_showcases WHERE true;

-- 2. Drop old column
ALTER TABLE video_showcases
DROP COLUMN IF EXISTS video_type CASCADE;

-- 3. Add new column
ALTER TABLE video_showcases
ADD COLUMN video_category TEXT NOT NULL DEFAULT 'youtube';

-- 4. Add constraint
ALTER TABLE video_showcases
ADD CONSTRAINT check_video_category
CHECK (video_category IN ('youtube', 'shorts', 'tiktok', 'reels'));

-- 5. Verify
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'video_showcases' ORDER BY ordinal_position;
`;

async function migrate() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  Direct Database Migration - Mahkota Taiwan              ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    console.log('🔄 Connecting to Supabase PostgreSQL...');
    console.log(`   Host: ${DB_HOST}`);
    console.log(`   Database: ${DB_NAME}\n`);

    // Write SQL to temp file
    const tmpFile = '/tmp/mahkota-migration.sql';
    const fs = await import('fs').then(m => m.promises);
    await fs.writeFile(tmpFile, MIGRATION_SQL);

    // Execute via psql
    console.log('⏳ Executing migration SQL...\n');

    const command = `PGPASSWORD="${DB_PASSWORD}" psql -h ${DB_HOST} -U ${DB_USER} -d ${DB_NAME} -p ${DB_PORT} -f ${tmpFile}`;

    const { stdout, stderr } = await execAsync(command);

    if (stdout) {
      console.log('📊 Migration Result:\n');
      console.log(stdout);
    }

    if (stderr && !stderr.includes('WARNING')) {
      console.error('⚠️  Warnings/Errors:\n', stderr);
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. CMS form is ready at: /admin/video-showcase');
    console.log('   2. Frontend component is ready');
    console.log('   3. Start adding videos with 4 categories: YouTube, Shorts, TikTok, Reels');

  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error.message);

    if (error.message.includes('psql')) {
      console.log('\n💡 psql not found. Please install PostgreSQL client tools.');
      console.log('   Or run the SQL manually in Supabase Dashboard.');
    }

    process.exit(1);
  }
}

migrate();
