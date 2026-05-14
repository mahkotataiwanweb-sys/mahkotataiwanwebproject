import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const match = supabaseUrl.match(/\/\/(.+?)\.supabase/);
  const projectRef = match ? match[1] : '';
  const dbPassword = process.env.SUPABASE_DB_PASSWORD;
  if (!projectRef || !dbPassword) {
    return NextResponse.json({ error: 'Missing config' }, { status: 500 });
  }
  const configs = [
    { name: 'Pooler SE Asia', cs: 'postgresql://postgres.' + projectRef + ':' + dbPassword + '@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres' },
    { name: 'Pooler US East', cs: 'postgresql://postgres.' + projectRef + ':' + dbPassword + '@aws-0-us-east-1.pooler.supabase.com:6543/postgres' },
    { name: 'Direct', cs: 'postgresql://postgres:' + dbPassword + '@db.' + projectRef + '.supabase.co:5432/postgres' },
  ];
  for (const c of configs) {
    const pool = new Pool({ connectionString: c.cs, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000, max: 1 });
    try {
      const client = await pool.connect();
      await client.query('ALTER TABLE public.hero_slides ADD COLUMN IF NOT EXISTS image_url_mobile TEXT;');
      client.release();
      await pool.end();
      return NextResponse.json({ status: 'success', connection: c.name });
    } catch (e) {
      try { await pool.end(); } catch {}
    }
  }
  return NextResponse.json({ error: 'All connections failed' }, { status: 500 });
}
