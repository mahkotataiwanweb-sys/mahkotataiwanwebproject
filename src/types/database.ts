export interface Database {
  public: {
    Tables: {
      categories: {
        Row: Category;
        Insert: CategoryInsert;
        Update: CategoryUpdate;
      };
      products: {
        Row: Product;
        Insert: ProductInsert;
        Update: ProductUpdate;
      };
      site_content: {
        Row: SiteContent;
        Insert: SiteContentInsert;
        Update: SiteContentUpdate;
      };
      company_settings: {
        Row: CompanySettings;
        Insert: CompanySettingsInsert;
        Update: CompanySettingsUpdate;
      };
    };
  };
}

export interface Category {
  id: string;
  name_en: string;
  name_id: string;
  name_zh: string;
  slug: string;
  icon: string;
  description_en: string | null;
  description_id: string | null;
  description_zh: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryInsert {
  name_en: string;
  name_id: string;
  name_zh: string;
  slug: string;
  icon?: string;
  description_en?: string | null;
  description_id?: string | null;
  description_zh?: string | null;
  image_url?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export interface CategoryUpdate extends Partial<CategoryInsert> {}

export interface Product {
  id: string;
  category_id: string;
  name_en: string;
  name_id: string;
  name_zh: string;
  slug: string;
  description_en: string | null;
  description_id: string | null;
  description_zh: string | null;
  image_url: string | null;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface ProductInsert {
  category_id: string;
  name_en: string;
  name_id: string;
  name_zh: string;
  slug: string;
  description_en?: string | null;
  description_id?: string | null;
  description_zh?: string | null;
  image_url?: string | null;
  is_featured?: boolean;
  is_active?: boolean;
  sort_order?: number;
}

export interface ProductUpdate extends Partial<ProductInsert> {}

export interface SiteContent {
  id: string;
  section: string;
  key: string;
  value_en: string;
  value_id: string;
  value_zh: string;
  content_type: 'text' | 'textarea' | 'richtext' | 'image' | 'number';
  created_at: string;
  updated_at: string;
}

export interface SiteContentInsert {
  section: string;
  key: string;
  value_en: string;
  value_id: string;
  value_zh: string;
  content_type?: 'text' | 'textarea' | 'richtext' | 'image' | 'number';
}

export interface SiteContentUpdate extends Partial<SiteContentInsert> {}

export interface CompanySettings {
  id: string;
  company_name: string;
  tagline_en: string;
  tagline_id: string;
  tagline_zh: string;
  email: string;
  phone: string;
  warehouse_address: string;
  office_address: string;
  logo_url: string | null;
  tiktok_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanySettingsInsert {
  company_name: string;
  tagline_en?: string;
  tagline_id?: string;
  tagline_zh?: string;
  email?: string;
  phone?: string;
  warehouse_address?: string;
  office_address?: string;
  logo_url?: string | null;
  tiktok_url?: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
}

export interface CompanySettingsUpdate extends Partial<CompanySettingsInsert> {}
