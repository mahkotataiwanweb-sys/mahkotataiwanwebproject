import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

const MIGRATION_SQL = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name_en VARCHAR(255) NOT NULL,
  name_id VARCHAR(255) NOT NULL,
  name_zh VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  icon VARCHAR(50) DEFAULT '📦',
  description_en TEXT,
  description_id TEXT,
  description_zh TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
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

-- Site content table
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

-- Company settings table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_site_content_section ON site_content(section);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow public read, service role write)
CREATE POLICY "Allow public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow service write categories" ON categories FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Allow service write products" ON products FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read site_content" ON site_content FOR SELECT USING (true);
CREATE POLICY "Allow service write site_content" ON site_content FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read company_settings" ON company_settings FOR SELECT USING (true);
CREATE POLICY "Allow service write company_settings" ON company_settings FOR ALL USING (true) WITH CHECK (true);

-- Create storage bucket for media
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true) ON CONFLICT (id) DO NOTHING;

-- Storage policy
CREATE POLICY "Allow public read media" ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "Allow service upload media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media');
CREATE POLICY "Allow service delete media" ON storage.objects FOR DELETE USING (bucket_id = 'media');

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS categories_updated_at ON categories;
CREATE TRIGGER categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS products_updated_at ON products;
CREATE TRIGGER products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS site_content_updated_at ON site_content;
CREATE TRIGGER site_content_updated_at BEFORE UPDATE ON site_content FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS company_settings_updated_at ON company_settings;
CREATE TRIGGER company_settings_updated_at BEFORE UPDATE ON company_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
`;

// Seed data
const categoriesSeed = [
  { name_en: 'Abon Sapi', name_id: 'Abon Sapi', name_zh: '牛肉鬆', slug: 'abon-sapi', icon: '🥩', sort_order: 1, description_en: 'Premium shredded beef floss', description_id: 'Abon sapi premium', description_zh: '優質牛肉鬆' },
  { name_en: 'Bakso & Pentol', name_id: 'Bakso & Pentol', name_zh: '肉丸', slug: 'bakso-pentol', icon: '🍡', sort_order: 2, description_en: 'Indonesian meatballs', description_id: 'Bakso dan pentol khas Indonesia', description_zh: '印尼肉丸' },
  { name_en: 'Cita Rasa Indonesia', name_id: 'Cita Rasa Indonesia', name_zh: '印尼風味', slug: 'cita-rasa-indonesia', icon: '🍜', sort_order: 3, description_en: 'Authentic Indonesian flavors', description_id: 'Cita rasa asli Indonesia', description_zh: '正宗印尼風味' },
  { name_en: 'Nasi Rempah Instant', name_id: 'Nasi Rempah Instant', name_zh: '即食香料飯', slug: 'nasi-rempah-instant', icon: '🍚', sort_order: 4, description_en: 'Instant spiced rice', description_id: 'Nasi rempah instan siap saji', description_zh: '即食香料飯' },
  { name_en: 'Snack', name_id: 'Snack', name_zh: '零食', slug: 'snack', icon: '🍘', sort_order: 5, description_en: 'Crispy Indonesian snacks', description_id: 'Snack renyah khas Indonesia', description_zh: '印尼脆片零食' },
];

const productsSeed = [
  // Abon Sapi
  { name_en: 'Original', name_id: 'Original', name_zh: '原味', slug: 'abon-original', cat_slug: 'abon-sapi', sort_order: 1 },
  { name_en: 'Bawang Goreng', name_id: 'Bawang Goreng', name_zh: '炸蒜味', slug: 'abon-bawang-goreng', cat_slug: 'abon-sapi', sort_order: 2 },
  { name_en: 'Rumput Laut Wijen', name_id: 'Rumput Laut Wijen', name_zh: '海苔芝麻', slug: 'abon-rumput-laut-wijen', cat_slug: 'abon-sapi', sort_order: 3 },
  // Bakso & Pentol
  { name_en: 'Bakso Biasa', name_id: 'Bakso Biasa', name_zh: '普通肉丸', slug: 'bakso-biasa', cat_slug: 'bakso-pentol', sort_order: 1 },
  { name_en: 'Bakso Urat', name_id: 'Bakso Urat', name_zh: '筋肉丸', slug: 'bakso-urat', cat_slug: 'bakso-pentol', sort_order: 2 },
  { name_en: 'Bakso Iga', name_id: 'Bakso Iga', name_zh: '排骨肉丸', slug: 'bakso-iga', cat_slug: 'bakso-pentol', sort_order: 3 },
  { name_en: 'Bakso Mercon', name_id: 'Bakso Mercon', name_zh: '辣味肉丸', slug: 'bakso-mercon', cat_slug: 'bakso-pentol', sort_order: 4 },
  { name_en: 'Bakso Beranak', name_id: 'Bakso Beranak', name_zh: '包心肉丸', slug: 'bakso-beranak', cat_slug: 'bakso-pentol', sort_order: 5 },
  { name_en: 'Pentol Bakso', name_id: 'Pentol Bakso', name_zh: '小肉丸', slug: 'pentol-bakso', cat_slug: 'bakso-pentol', sort_order: 6 },
  { name_en: 'Pentol Mercon', name_id: 'Pentol Mercon', name_zh: '辣小肉丸', slug: 'pentol-mercon', cat_slug: 'bakso-pentol', sort_order: 7 },
  // Cita Rasa Indonesia
  { name_en: 'Baso Aci', name_id: 'Baso Aci', name_zh: '木薯丸', slug: 'baso-aci', cat_slug: 'cita-rasa-indonesia', sort_order: 1 },
  { name_en: 'Baso Cabe Ijo', name_id: 'Baso Cabe Ijo', name_zh: '青辣椒丸', slug: 'baso-cabe-ijo', cat_slug: 'cita-rasa-indonesia', sort_order: 2 },
  { name_en: 'Cilok', name_id: 'Cilok', name_zh: '印尼丸子', slug: 'cilok', cat_slug: 'cita-rasa-indonesia', sort_order: 3 },
  { name_en: 'Cireng Rujak', name_id: 'Cireng Rujak', name_zh: '炸木薯餅', slug: 'cireng-rujak', cat_slug: 'cita-rasa-indonesia', sort_order: 4 },
  { name_en: 'Cuanki Soto', name_id: 'Cuanki Soto', name_zh: '索多丸子湯', slug: 'cuanki-soto', cat_slug: 'cita-rasa-indonesia', sort_order: 5 },
  { name_en: 'Korean Spicy Cheese', name_id: 'Korean Spicy Cheese', name_zh: '韓式辣起司', slug: 'korean-spicy-cheese', cat_slug: 'cita-rasa-indonesia', sort_order: 6 },
  { name_en: 'Sambal Petis Instant', name_id: 'Sambal Petis Instant', name_zh: '即食蝦醬辣椒', slug: 'sambal-petis-instant', cat_slug: 'cita-rasa-indonesia', sort_order: 7 },
  { name_en: 'Seblak', name_id: 'Seblak', name_zh: '印尼辣小吃', slug: 'seblak', cat_slug: 'cita-rasa-indonesia', sort_order: 8 },
  // Nasi Rempah Instant
  { name_en: 'Nasi Biryani', name_id: 'Nasi Biryani', name_zh: '印度香飯', slug: 'nasi-biryani', cat_slug: 'nasi-rempah-instant', sort_order: 1 },
  { name_en: 'Nasi Kebuli', name_id: 'Nasi Kebuli', name_zh: '中東香飯', slug: 'nasi-kebuli', cat_slug: 'nasi-rempah-instant', sort_order: 2 },
  // Snack
  { name_en: 'Basreng', name_id: 'Basreng', name_zh: '炸魚丸片', slug: 'basreng', cat_slug: 'snack', sort_order: 1 },
  { name_en: 'Cimol', name_id: 'Cimol', name_zh: '炸木薯球', slug: 'cimol', cat_slug: 'snack', sort_order: 2 },
  { name_en: 'Keripik Singkong Kriwil', name_id: 'Keripik Singkong Kriwil', name_zh: '螺旋木薯片', slug: 'keripik-singkong-kriwil', cat_slug: 'snack', sort_order: 3 },
  { name_en: 'Keripik Original', name_id: 'Keripik Original', name_zh: '原味薯片', slug: 'keripik-original', cat_slug: 'snack', sort_order: 4 },
  { name_en: 'Keripik Pedas', name_id: 'Keripik Pedas', name_zh: '辣味薯片', slug: 'keripik-pedas', cat_slug: 'snack', sort_order: 5 },
  { name_en: 'Keripik Sambal Matah', name_id: 'Keripik Sambal Matah', name_zh: '生辣椒醬薯片', slug: 'keripik-sambal-matah', cat_slug: 'snack', sort_order: 6 },
];

const siteContentSeed = [
  { section: 'hero', key: 'tagline', value_en: 'Rasa Indonesia, Hadir di Taiwan', value_id: 'Rasa Indonesia, Hadir di Taiwan', value_zh: '印尼美味，在台灣', content_type: 'text' },
  { section: 'hero', key: 'subtitle', value_en: 'Authentic Indonesian ready-to-eat food, delivered with love to the Indonesian community in Taiwan.', value_id: 'Makanan siap saji Indonesia otentik, dihadirkan dengan cinta untuk komunitas Indonesia di Taiwan.', value_zh: '正宗印尼即食美食，用心送達在台灣的印尼社區。', content_type: 'textarea' },
  { section: 'about', key: 'title', value_en: 'About Mahkota Taiwan', value_id: 'Tentang Mahkota Taiwan', value_zh: '關於皇冠台灣', content_type: 'text' },
  { section: 'about', key: 'description', value_en: 'Mahkota Taiwan is an Indonesian food brand based in Taiwan, focused on the production and distribution of ready-to-eat Indonesian specialties for Indonesians living abroad, especially in Taiwan. Established in 2021, Mahkota Taiwan is committed to delivering authentic Indonesian flavors that are practical, affordable, and easy to enjoy anytime.', value_id: 'Mahkota Taiwan adalah brand makanan Indonesia yang berbasis di Taiwan, fokus pada produksi dan distribusi makanan khas Indonesia siap saji untuk masyarakat Indonesia yang tinggal di luar negeri, terutama di Taiwan. Didirikan pada tahun 2021, Mahkota Taiwan berkomitmen menghadirkan cita rasa Indonesia yang autentik, praktis, terjangkau, dan mudah dinikmati kapan saja.', value_zh: '皇冠台灣是一個總部位於台灣的印尼食品品牌，專注於為居住在海外、尤其是台灣的印尼人生產和分銷即食印尼特色美食。皇冠台灣成立於2021年，致力於提供正宗、實惠、方便的印尼美味。', content_type: 'richtext' },
  { section: 'products', key: 'title', value_en: 'Our Products', value_id: 'Produk Kami', value_zh: '我們的產品', content_type: 'text' },
  { section: 'products', key: 'subtitle', value_en: 'Discover our wide range of authentic Indonesian food products, carefully crafted for the best taste experience.', value_id: 'Temukan berbagai produk makanan Indonesia otentik kami, dibuat dengan cermat untuk pengalaman rasa terbaik.', value_zh: '探索我們豐富的正宗印尼食品系列，精心製作帶來最佳味覺體驗。', content_type: 'textarea' },
  { section: 'contact', key: 'title', value_en: 'Get In Touch', value_id: 'Hubungi Kami', value_zh: '聯繫我們', content_type: 'text' },
  { section: 'contact', key: 'subtitle', value_en: 'Have questions or want to partner with us? We\'d love to hear from you.', value_id: 'Punya pertanyaan atau ingin bermitra dengan kami? Kami senang mendengar dari Anda.', value_zh: '有問題或想與我們合作？我們期待您的來信。', content_type: 'textarea' },
];

const companySettingsSeed = {
  company_name: 'Mahkota Taiwan',
  tagline_en: 'Rasa Indonesia, Hadir di Taiwan',
  tagline_id: 'Rasa Indonesia, Hadir di Taiwan',
  tagline_zh: '印尼美味，在台灣',
  email: 'info@mahkotataiwan.com',
  phone: '0226099118',
  warehouse_address: 'No. 53, Lane 216, Nanshi 4th Street, Linkou District, New Taipei City (新北市林口區南勢四街216巷53號)',
  office_address: 'No. 83, Liyuan 2nd Street, Linkou District, New Taipei City (244新北市林口區麗園二街83號)',
  tiktok_url: 'https://www.tiktok.com/@mahkotataiwan',
  facebook_url: 'https://www.facebook.com/share/1DhYShuL19/?mibextid=wwXIfr',
  instagram_url: 'https://www.instagram.com/mahkotatw',
};

export async function GET() {
  const supabase = createAdminClient();
  const results: Record<string, string> = {};

  // Step 1: Check if tables exist
  const { error: checkError } = await supabase.from('categories').select('id').limit(1);

  if (checkError && checkError.message.includes('does not exist')) {
    // Tables don't exist — return migration SQL
    return NextResponse.json({
      status: 'tables_not_found',
      message: 'Database tables have not been created yet. Please run the following SQL in your Supabase Dashboard → SQL Editor:',
      sql: MIGRATION_SQL,
      next_step: 'After running the SQL, visit this endpoint again to seed the data.',
    });
  }

  // Step 2: Seed categories
  const { data: existingCats } = await supabase.from('categories').select('id').limit(1);
  if (!existingCats || existingCats.length === 0) {
    const { error } = await supabase.from('categories').insert(categoriesSeed as any);
    results.categories = error ? `Error: ${error.message}` : `Seeded ${categoriesSeed.length} categories`;
  } else {
    results.categories = 'Already has data, skipped';
  }

  // Step 3: Seed products (need category IDs)
  const { data: existingProds } = await supabase.from('products').select('id').limit(1);
  if (!existingProds || existingProds.length === 0) {
    const { data: cats } = await supabase.from('categories').select('id, slug');
    if (cats) {
      const catMap = new Map(cats.map(c => [c.slug, c.id]));
      const productsData = productsSeed.map(({ cat_slug, ...p }) => ({
        ...p,
        category_id: catMap.get(cat_slug) || null,
        description_en: `Delicious ${p.name_en}`,
        description_id: `${p.name_id} yang lezat`,
        description_zh: `美味的${p.name_zh}`,
      }));
      const { error } = await supabase.from('products').insert(productsData as any);
      results.products = error ? `Error: ${error.message}` : `Seeded ${productsData.length} products`;
    }
  } else {
    results.products = 'Already has data, skipped';
  }

  // Step 4: Seed site content
  const { data: existingContent } = await supabase.from('site_content').select('id').limit(1);
  if (!existingContent || existingContent.length === 0) {
    const { error } = await supabase.from('site_content').insert(siteContentSeed as any);
    results.site_content = error ? `Error: ${error.message}` : `Seeded ${siteContentSeed.length} content blocks`;
  } else {
    results.site_content = 'Already has data, skipped';
  }

  // Step 5: Seed company settings
  const { data: existingSettings } = await supabase.from('company_settings').select('id').limit(1);
  if (!existingSettings || existingSettings.length === 0) {
    const { error } = await supabase.from('company_settings').insert(companySettingsSeed as any);
    results.company_settings = error ? `Error: ${error.message}` : 'Seeded company settings';
  } else {
    results.company_settings = 'Already has data, skipped';
  }

  return NextResponse.json({
    status: 'complete',
    message: 'Database setup complete!',
    results,
  });
}
