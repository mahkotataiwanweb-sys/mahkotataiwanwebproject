import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const migrationSQL = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name_en VARCHAR(255) NOT NULL,
  name_id VARCHAR(255) NOT NULL,
  name_zh VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  icon VARCHAR(10) DEFAULT '📦',
  description_en TEXT,
  description_id TEXT,
  description_zh TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  name_en VARCHAR(255) NOT NULL,
  name_id VARCHAR(255) NOT NULL,
  name_zh VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description_en TEXT,
  description_id TEXT,
  description_zh TEXT,
  image_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site Content
CREATE TABLE IF NOT EXISTS site_content (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  section VARCHAR(100) NOT NULL,
  key VARCHAR(100) NOT NULL,
  value_en TEXT NOT NULL DEFAULT '',
  value_id TEXT NOT NULL DEFAULT '',
  value_zh TEXT NOT NULL DEFAULT '',
  content_type VARCHAR(50) DEFAULT 'text',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(section, key)
);

-- Company Settings
CREATE TABLE IF NOT EXISTS company_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL DEFAULT 'Mahkota Taiwan',
  tagline_en TEXT DEFAULT '',
  tagline_id TEXT DEFAULT '',
  tagline_zh TEXT DEFAULT '',
  email VARCHAR(255) DEFAULT '',
  phone VARCHAR(50) DEFAULT '',
  warehouse_address TEXT DEFAULT '',
  office_address TEXT DEFAULT '',
  logo_url TEXT,
  tiktok_url TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow public read, authenticated write)
DO $$ BEGIN
  -- Categories policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='categories' AND policyname='categories_public_read') THEN
    CREATE POLICY categories_public_read ON categories FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='categories' AND policyname='categories_service_all') THEN
    CREATE POLICY categories_service_all ON categories FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Products policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='products' AND policyname='products_public_read') THEN
    CREATE POLICY products_public_read ON products FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='products' AND policyname='products_service_all') THEN
    CREATE POLICY products_service_all ON products FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Site content policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='site_content' AND policyname='site_content_public_read') THEN
    CREATE POLICY site_content_public_read ON site_content FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='site_content' AND policyname='site_content_service_all') THEN
    CREATE POLICY site_content_service_all ON site_content FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Company settings policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='company_settings' AND policyname='company_settings_public_read') THEN
    CREATE POLICY company_settings_public_read ON company_settings FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='company_settings' AND policyname='company_settings_service_all') THEN
    CREATE POLICY company_settings_service_all ON company_settings FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS categories_updated_at ON categories;
CREATE TRIGGER categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS products_updated_at ON products;
CREATE TRIGGER products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS site_content_updated_at ON site_content;
CREATE TRIGGER site_content_updated_at BEFORE UPDATE ON site_content FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS company_settings_updated_at ON company_settings;
CREATE TRIGGER company_settings_updated_at BEFORE UPDATE ON company_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Create storage bucket for media (Supabase-specific, will be ignored if not running in Supabase)
-- Storage is handled separately via Supabase client
`;

export async function GET() {
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/\/\/(.+?)\.supabase/)?.[1];
  
  if (!projectRef) {
    return NextResponse.json({ error: 'Could not determine Supabase project ref' }, { status: 500 });
  }

  const dbPassword = process.env.SUPABASE_DB_PASSWORD;
  if (!dbPassword) {
    return NextResponse.json({ error: 'SUPABASE_DB_PASSWORD not set' }, { status: 500 });
  }

  // Try multiple connection methods
  const connectionConfigs = [
    {
      name: 'Direct connection',
      connectionString: \`postgresql://postgres.\${projectRef}:\${dbPassword}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres\`
    },
    {
      name: 'Pooler connection',
      connectionString: \`postgresql://postgres.\${projectRef}:\${dbPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres\`
    },
    {
      name: 'Direct DB host',
      connectionString: \`postgresql://postgres:\${dbPassword}@db.\${projectRef}.supabase.co:5432/postgres\`
    }
  ];

  const results: Record<string, string> = {};

  for (const config of connectionConfigs) {
    const pool = new Pool({
      connectionString: config.connectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 5000,
      max: 1
    });

    try {
      const client = await pool.connect();
      
      try {
        // Run migration
        await client.query(migrationSQL);
        results[config.name] = 'SUCCESS - Tables created!';
        client.release();
        await pool.end();
        
        // Now seed data via the setup endpoint
        const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ? 
          (process.env.VERCEL_URL ? \`https://\${process.env.VERCEL_URL}\` : 'http://localhost:3000') : '';
        
        return NextResponse.json({ 
          status: 'success',
          message: 'Database migration completed successfully!',
          connection: config.name,
          results,
          next: 'Call /api/setup to seed initial data'
        });
      } catch (queryError: unknown) {
        const errMsg = queryError instanceof Error ? queryError.message : String(queryError);
        results[config.name] = \`Query error: \${errMsg}\`;
        client.release();
      }
      
      await pool.end();
    } catch (connError: unknown) {
      const errMsg = connError instanceof Error ? connError.message : String(connError);
      results[config.name] = \`Connection error: \${errMsg}\`;
      try { await pool.end(); } catch { /* ignore */ }
    }
  }

  return NextResponse.json({ 
    status: 'failed',
    message: 'Could not connect to database with any method',
    results,
    fallback: 'Please run the migration SQL manually in Supabase Dashboard > SQL Editor'
  }, { status: 500 });
}
