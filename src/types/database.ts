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
      hero_slides: {
        Row: HeroSlide;
        Insert: HeroSlideInsert;
        Update: HeroSlideUpdate;
        Relationships: [];
      };
      articles: {
        Row: Article;
        Insert: ArticleInsert;
        Update: ArticleUpdate;
        Relationships: [];
      };
      store_partners: {
        Row: StorePartner;
        Insert: StorePartnerInsert;
        Update: StorePartnerUpdate;
        Relationships: [];
      };
      video_showcases: {
        Row: VideoShowcase;
        Insert: VideoShowcaseInsert;
        Update: VideoShowcaseUpdate;
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
  detail_image_url?: string | null;
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
  detail_image_url?: string | null;
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
  detail_image_url?: string | null;
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

export interface HeroSlide {
  id: string;
  title_en: string;
  title_id: string;
  title_zh: string;
  subtitle_en: string;
  subtitle_id: string;
  subtitle_zh: string;
  image_url: string | null;
  media_type: 'image' | 'video' | 'gif';
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HeroSlideInsert {
  id?: string;
  title_en: string;
  title_id: string;
  title_zh: string;
  subtitle_en: string;
  subtitle_id: string;
  subtitle_zh: string;
  image_url?: string | null;
  media_type?: 'image' | 'video' | 'gif';
  link_url?: string | null;
  sort_order?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface HeroSlideUpdate {
  id?: string;
  title_en?: string;
  title_id?: string;
  title_zh?: string;
  subtitle_en?: string;
  subtitle_id?: string;
  subtitle_zh?: string;
  image_url?: string | null;
  media_type?: 'image' | 'video' | 'gif';
  link_url?: string | null;
  sort_order?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Article {
  id: string;
  type: 'event' | 'news' | 'lifestyle' | 'recipe';
  title_en: string;
  title_id: string;
  title_zh: string;
  slug: string;
  excerpt_en: string;
  excerpt_id: string;
  excerpt_zh: string;
  content_en: string;
  content_id: string;
  content_zh: string;
  description_en: string | null;
  description_id: string | null;
  description_zh: string | null;
  image_url: string | null;
  slider_section: string | null;
  gallery_images: string[] | null;
  published_at: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ArticleInsert {
  id?: string;
  type: 'event' | 'news' | 'lifestyle' | 'recipe';
  title_en: string;
  title_id: string;
  title_zh: string;
  slug: string;
  excerpt_en: string;
  excerpt_id: string;
  excerpt_zh: string;
  content_en: string;
  content_id: string;
  content_zh: string;
  description_en?: string | null;
  description_id?: string | null;
  description_zh?: string | null;
  image_url?: string | null;
  slider_section?: string | null;
  gallery_images?: string[] | null;
  published_at?: string;
  is_active?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ArticleUpdate {
  id?: string;
  type?: 'event' | 'news' | 'lifestyle' | 'recipe';
  title_en?: string;
  title_id?: string;
  title_zh?: string;
  slug?: string;
  excerpt_en?: string;
  excerpt_id?: string;
  excerpt_zh?: string;
  content_en?: string;
  content_id?: string;
  content_zh?: string;
  description_en?: string | null;
  description_id?: string | null;
  description_zh?: string | null;
  image_url?: string | null;
  slider_section?: string | null;
  gallery_images?: string[] | null;
  published_at?: string;
  is_active?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface StorePartner {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StorePartnerInsert {
  id?: string;
  name: string;
  logo_url?: string | null;
  website_url?: string | null;
  sort_order?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface StorePartnerUpdate {
  id?: string;
  name?: string;
  logo_url?: string | null;
  website_url?: string | null;
  sort_order?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface NavMenuItem {
  id: string;
  parent_id: string | null;
  label_en: string;
  label_id: string;
  label_zh: string;
  url: string;
  sort_order: number;
  is_active: boolean;
}

export interface FooterLink {
  id: string;
  section: string;
  label_en: string;
  label_id: string;
  label_zh: string;
  url: string;
  sort_order: number;
  is_active: boolean;
}

export interface GalleryImage {
  id: string;
  image_url: string;
  description_en: string | null;
  description_id: string | null;
  description_zh: string | null;
  event_name: string;
  event_date: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GalleryImageInsert {
  id?: string;
  image_url: string;
  description_en?: string | null;
  description_id?: string | null;
  description_zh?: string | null;
  event_name: string;
  event_date: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface GalleryImageUpdate {
  id?: string;
  image_url?: string;
  description_en?: string | null;
  description_id?: string | null;
  description_zh?: string | null;
  event_name?: string;
  event_date?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface VideoShowcase {
  id: string;
  title_en: string;
  title_id: string;
  title_zh: string;
  description_en: string | null;
  description_id: string | null;
  description_zh: string | null;
  video_category: 'youtube' | 'shorts' | 'tiktok' | 'reels';
  video_url: string;
  thumbnail_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VideoShowcaseInsert {
  id?: string;
  title_en: string;
  title_id: string;
  title_zh: string;
  description_en?: string | null;
  description_id?: string | null;
  description_zh?: string | null;
  video_category: 'youtube' | 'shorts' | 'tiktok' | 'reels';
  video_url: string;
  thumbnail_url?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export interface VideoShowcaseUpdate {
  id?: string;
  title_en?: string;
  title_id?: string;
  title_zh?: string;
  description_en?: string | null;
  description_id?: string | null;
  description_zh?: string | null;
  video_category?: 'youtube' | 'shorts' | 'tiktok' | 'reels';
  video_url?: string;
  thumbnail_url?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

// Store Locations
export interface StoreLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  district: string | null;
  contact: string | null;
  lat: number;
  lng: number;
  store_type: 'supermarket' | 'minimarket' | 'toko' | 'retail' | 'online';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
