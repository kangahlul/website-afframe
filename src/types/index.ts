export interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
}

export interface SiteSettings {
  brand_name: string;
  tagline: string;
  brand_description: string;
  whatsapp_number: string;
  whatsapp_url: string;
  instagram_handle: string;
  instagram_url: string;
  email: string;
  address: string;
  primary_color: string;
  bg_color: string;
  accent_color: string;
  heading_font: string;
  body_font: string;
  logo_primary: string;
  logo_light: string;
  logo_dark: string;
  logo_monogram: string;
  favicon_url: string;
  og_image: string;
  seo_title: string;
  seo_description: string;
  footer_copyright: string;
  [key: string]: string;
}

export interface MediaAsset {
  id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  width?: number;
  height?: number;
  category: string;
  url: string;
  alt_text: string;
  description: string;
  created_at: string;
}

export interface WebsiteSection {
  id: number;
  section_key: string;
  title: string;
  subtitle: string;
  description: string;
  cta_primary_text: string;
  cta_primary_url: string;
  cta_secondary_text: string;
  cta_secondary_url: string;
  background_media_url: string;
  background_type: 'image' | 'video' | 'none';
  overlay_opacity: number;
  focal_point: string;
  text_alignment: 'left' | 'center' | 'right';
  theme: 'dark' | 'light' | 'gold';
  is_visible: number;
  sort_order: number;
  updated_at: string;
}

export interface PortfolioCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  cover_image_url: string;
  thumbnail_url: string;
  is_visible: number;
  sort_order: number;
  project_count?: number;
}

export interface PortfolioImage {
  id?: number;
  image_url: string;
  caption?: string;
  alt_text?: string;
  sort_order?: number;
}

export interface PortfolioVideo {
  id?: number;
  project_id?: number;
  title?: string;
  video_url: string;
  orientation?: 'portrait' | 'landscape' | 'square';
  sort_order?: number;
  created_at?: string;
}

export interface PortfolioProject {
  id: number;
  category_id?: number | null;
  category_name?: string;
  category_slug?: string;
  title: string;
  slug: string;
  short_description: string;
  full_description: string;
  client_name: string;
  project_date: string;
  location: string;
  cover_image_url: string;
  featured_video_url: string;
  media_type?: 'photo' | 'video';
  orientation?: 'portrait' | 'landscape' | 'square';
  is_featured: number;
  is_published: number;
  sort_order: number;
  seo_title: string;
  seo_description: string;
  images?: PortfolioImage[];
  videos?: PortfolioVideo[];
  created_at: string;
  updated_at: string;
}

export interface ServicePackage {
  id: number;
  service_id: number;
  category_name: string;
  package_name: string;
  regular_price: number;
  promotional_price: number;
  is_price_hidden: number;
  is_quotation_based: number;
  duration: string;
  deliverables: string[];
  inclusions: string[];
  is_featured: number;
  is_published: number;
  sort_order: number;
}

export interface Service {
  id: number;
  name: string;
  slug: string;
  short_description: string;
  icon_name: string;
  cover_image_url: string;
  is_visible: number;
  sort_order: number;
  packages: ServicePackage[];
}

export interface InquiryNote {
  id: number;
  inquiry_id: number;
  author_name: string;
  note: string;
  created_at: string;
}

export interface Inquiry {
  id: number;
  inquiry_code: string;
  client_id?: number;
  full_name: string;
  whatsapp_number: string;
  email: string;
  instagram_handle: string;
  company: string;
  service_id?: number;
  package_id?: number;
  service_name: string;
  package_name: string;
  event_date: string;
  event_time: string;
  location: string;
  budget_range: string;
  additional_notes: string;
  agreed_terms: number;
  status: 'new' | 'contacted' | 'quoted' | 'confirmed' | 'completed' | 'cancelled';
  notes?: InquiryNote[];
  created_at: string;
  updated_at: string;
}

export interface FaqItem {
  id: number;
  question: string;
  answer: string;
  category: string;
  is_published: number;
  sort_order: number;
}

export interface TermsContent {
  id: number;
  title: string;
  clause_number: number;
  clause_text: string;
  is_published: number;
  sort_order: number;
}

export interface BenefitItem {
  id: number;
  title: string;
  description: string;
  icon_name: string;
  image_url: string;
  is_visible: number;
  sort_order: number;
}

export interface ServiceArea {
  id: number;
  name: string;
  description: string;
  image_url: string;
  is_primary: number;
  is_visible: number;
  sort_order: number;
}

export interface NavigationItem {
  id: number;
  label: string;
  url: string;
  target: string;
  location: 'header' | 'footer';
  is_visible: number;
  sort_order: number;
}

export interface DynamicPage {
  id: number;
  title: string;
  slug: string;
  description: string;
  content_json: string;
  seo_title: string;
  seo_description: string;
  og_image_url: string;
  is_published: number;
  sort_order: number;
}

export interface Client {
  id: number;
  client_code: string;
  full_name: string;
  phone_whatsapp: string;
  email?: string;
  instagram_handle?: string;
  company_brand?: string;
  client_type: 'personal' | 'couple_wedding' | 'corporate' | 'student_graduation' | 'community_event';
  address_city?: string;
  status: 'lead' | 'active' | 'completed' | 'vip';
  total_spend: number;
  notes?: string;
  booking_count?: number;
  bookings?: Inquiry[];
  created_at: string;
  updated_at: string;
}

export interface ClientStats {
  totalClients: number;
  leadCount: number;
  activeCount: number;
  vipCount: number;
  completedCount: number;
  totalSpendSum: number;
}
