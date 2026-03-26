export interface Database {
  public: {
    Tables: {
      categories: {
        Row: Category;
        Insert: CategoryInsert;
        Update: CategoryUpdate;
        Relationships: [];
      };
      products: {
        Row: Product;
        Insert: ProductInsert;
        Update: ProductUpdate;
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };
      site_content: {
        Row: SiteContent;
        Insert: SiteContentInsert;
        Update: SiteContentUpdate;
        Relationships: [];
      };
      company_settings: {
        Row: CompanySettings;
        Insert: CompanySettingsInsert;
        Update: CompanySettingsUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
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
  id?: string;
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
  created_at?: string;
  updated_at?: string;
}

export interface CategoryUpdate {
  id?: string;
  name_en?: string;
  name_id?: string;
  name_zh?: string;
  slug?: string;
  icon?: string;
  description_en?: string | null;
  description_id?: string | null;
  description_zh?: string | null;
  image_url?: string | null;
  sort_order?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

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
}

export interface ProductInsert {
  id?: string;
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
  created_at?: string;
  updated_at?: string;
}

export interface ProductUpdate {
  id?: string;
  category_id?: string;
  name_en?: string;
  name_id?: string;
  name_zh?: string;
  slug?: string;
  description_en?: string | null;
  description_id?: string | null;
  description_zh?: string | null;
  image_url?: string | null;
  is_featured?: boolean;
  is_active?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SiteContent {
  id: string;
  section: string;
  key: string;
  value_en: string;
  value_id: string;
  value_zh: string;
  content_type: string;
  created_at: string;
  updated_at: string;
}

export interface SiteContentInsert {
  id?: string;
  section: string;
  key: string;
  value_en: string;
  value_id: string;
  value_zh: string;
  content_type?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SiteContentUpdate {
  id?: string;
  section?: string;
  key?: string;
  value_en?: string;
  value_id?: string;
  value_zh?: string;
  content_type?: string;
  created_at?: string;
  updated_at?: string;
}

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
  id?: string;
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
  created_at?: string;
  updated_at?: string;
}

export interface CompanySettingsUpdate {
  id?: string;
  company_name?: string;
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
  created_at?: string;
  updated_at?: string;
}
