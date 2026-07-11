// Auto-generado con: pnpm db:generate
// Regenerar después de modificar el schema de Supabase
// Formato compatible con @supabase/supabase-js ^2.43.0

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          role: 'super_admin' | 'admin' | 'editor' | 'customer'
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          phone?: string | null
          role?: 'super_admin' | 'admin' | 'editor' | 'customer'
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          phone?: string | null
          role?: 'super_admin' | 'admin' | 'editor' | 'customer'
          created_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: number
          name: string
          slug: string
          description: string | null
          image_url: string | null
          order_index: number
          active: boolean
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          slug: string
          description?: string | null
          image_url?: string | null
          order_index?: number
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          slug?: string
          description?: string | null
          image_url?: string | null
          order_index?: number
          active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          id: number
          name: string
          slug: string
          description: string | null
          category_id: number | null
          images: Json
          active: boolean
          featured: boolean
          seo_title: string | null
          seo_desc: string | null
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          slug: string
          description?: string | null
          category_id?: number | null
          images?: Json
          active?: boolean
          featured?: boolean
          seo_title?: string | null
          seo_desc?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          slug?: string
          description?: string | null
          category_id?: number | null
          images?: Json
          active?: boolean
          featured?: boolean
          seo_title?: string | null
          seo_desc?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'products_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          }
        ]
      }
      product_variants: {
        Row: {
          id: number
          product_id: number
          roast: 'claro' | 'medio' | 'oscuro' | null
          weight: '250g' | '500g' | '1kg' | null
          grind: 'grano' | 'media' | 'fina' | 'gruesa' | null
          brew_method: 'espresso' | 'filtrado' | 'cold_brew' | 'universal' | null
          price: number
          stock: number
          sku: string | null
          active: boolean
        }
        Insert: {
          id?: number
          product_id: number
          roast?: 'claro' | 'medio' | 'oscuro' | null
          weight?: '250g' | '500g' | '1kg' | null
          grind?: 'grano' | 'media' | 'fina' | 'gruesa' | null
          brew_method?: 'espresso' | 'filtrado' | 'cold_brew' | 'universal' | null
          price: number
          stock?: number
          sku?: string | null
          active?: boolean
        }
        Update: {
          id?: number
          product_id?: number
          roast?: 'claro' | 'medio' | 'oscuro' | null
          weight?: '250g' | '500g' | '1kg' | null
          grind?: 'grano' | 'media' | 'fina' | 'gruesa' | null
          brew_method?: 'espresso' | 'filtrado' | 'cold_brew' | 'universal' | null
          price?: number
          stock?: number
          sku?: string | null
          active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'product_variants_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          }
        ]
      }
      banners: {
        Row: {
          id: number
          section: string
          title: string | null
          subtitle: string | null
          cta_text: string | null
          cta_url: string | null
          image_url: string | null
          image_url_mobile: string | null
          bg_color: string | null
          order_index: number
          active: boolean
          created_at: string
        }
        Insert: {
          id?: number
          section: string
          title?: string | null
          subtitle?: string | null
          cta_text?: string | null
          cta_url?: string | null
          image_url?: string | null
          image_url_mobile?: string | null
          bg_color?: string | null
          order_index?: number
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          section?: string
          title?: string | null
          subtitle?: string | null
          cta_text?: string | null
          cta_url?: string | null
          image_url?: string | null
          image_url_mobile?: string | null
          bg_color?: string | null
          order_index?: number
          active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: number
          order_number: string
          customer_id: string | null
          customer_name: string
          customer_email: string
          customer_phone: string | null
          shipping_addr: Json
          items: Json
          subtotal: number
          shipping_cost: number
          discount: number
          total: number
          status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'exception'
          payment_method: 'wompi' | 'mercadopago' | null
          payment_id: string | null
          payment_status: 'pending' | 'approved' | 'rejected' | 'refunded'
          notes: string | null
          skydropx_quotation_id: string | null
          skydropx_rate_id: string | null
          skydropx_shipment_id: string | null
          tracking_number: string | null
          carrier_name: string | null
          label_url: string | null
          shipping_cost_final: number | null
          pickup_id: string | null
          pickup_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          order_number: string
          customer_id?: string | null
          customer_name: string
          customer_email: string
          customer_phone?: string | null
          shipping_addr: Json
          items: Json
          subtotal: number
          shipping_cost: number
          discount?: number
          total: number
          status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'exception'
          payment_method?: 'wompi' | 'mercadopago' | null
          payment_id?: string | null
          payment_status?: 'pending' | 'approved' | 'rejected' | 'refunded'
          notes?: string | null
          skydropx_quotation_id?: string | null
          skydropx_rate_id?: string | null
          skydropx_shipment_id?: string | null
          tracking_number?: string | null
          carrier_name?: string | null
          label_url?: string | null
          shipping_cost_final?: number | null
          pickup_id?: string | null
          pickup_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          order_number?: string
          customer_id?: string | null
          customer_name?: string
          customer_email?: string
          customer_phone?: string | null
          shipping_addr?: Json
          items?: Json
          subtotal?: number
          shipping_cost?: number
          discount?: number
          total?: number
          status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'exception'
          payment_method?: 'wompi' | 'mercadopago' | null
          payment_id?: string | null
          payment_status?: 'pending' | 'approved' | 'rejected' | 'refunded'
          notes?: string | null
          skydropx_quotation_id?: string | null
          skydropx_rate_id?: string | null
          skydropx_shipment_id?: string | null
          tracking_number?: string | null
          carrier_name?: string | null
          label_url?: string | null
          shipping_cost_final?: number | null
          pickup_id?: string | null
          pickup_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'orders_customer_id_fkey'
            columns: ['customer_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      blog_posts: {
        Row: {
          id: number
          title: string
          slug: string
          excerpt: string | null
          content: string | null
          cover_image: string | null
          category: string | null
          author_id: string | null
          published: boolean
          published_at: string | null
          seo_title: string | null
          seo_desc: string | null
          created_at: string
        }
        Insert: {
          id?: number
          title: string
          slug: string
          excerpt?: string | null
          content?: string | null
          cover_image?: string | null
          category?: string | null
          author_id?: string | null
          published?: boolean
          published_at?: string | null
          seo_title?: string | null
          seo_desc?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          title?: string
          slug?: string
          excerpt?: string | null
          content?: string | null
          cover_image?: string | null
          category?: string | null
          author_id?: string | null
          published?: boolean
          published_at?: string | null
          seo_title?: string | null
          seo_desc?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'blog_posts_author_id_fkey'
            columns: ['author_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      newsletter_subscribers: {
        Row: {
          id: number
          email: string
          subscribed_at: string
          active: boolean
        }
        Insert: {
          id?: number
          email: string
          subscribed_at?: string
          active?: boolean
        }
        Update: {
          id?: number
          email?: string
          subscribed_at?: string
          active?: boolean
        }
        Relationships: []
      }
      shipping_config: {
        Row: {
          id: number
          provider: 'fixed' | 'skydropx'
          fixed_rate: number
          skydropx_client_id: string | null
          skydropx_client_secret: string | null
          skydropx_address_from_id: string | null
          skydropx_base_url: string
          updated_at: string
        }
        Insert: {
          id?: number
          provider?: 'fixed' | 'skydropx'
          fixed_rate?: number
          skydropx_client_id?: string | null
          skydropx_client_secret?: string | null
          skydropx_address_from_id?: string | null
          skydropx_base_url?: string
          updated_at?: string
        }
        Update: {
          id?: number
          provider?: 'fixed' | 'skydropx'
          fixed_rate?: number
          skydropx_client_id?: string | null
          skydropx_client_secret?: string | null
          skydropx_address_from_id?: string | null
          skydropx_base_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      store_config: {
        Row: {
          id: number
          whatsapp_number: string | null
          store_name: string
          store_email: string | null
          logo_url: string | null
          updated_at: string
        }
        Insert: {
          id?: number
          whatsapp_number?: string | null
          store_name?: string
          store_email?: string | null
          logo_url?: string | null
          updated_at?: string
        }
        Update: {
          id?: number
          whatsapp_number?: string | null
          store_name?: string
          store_email?: string | null
          logo_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      order_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'exception'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ─── Domain Types ──────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'exception'

export type ShippingProviderType = 'fixed' | 'skydropx'

export type UserRole = 'super_admin' | 'admin' | 'editor' | 'customer'

export interface ProductImage {
  url: string
  alt: string
  order: number
}

export interface ShippingAddress {
  address: string
  city: string
  department: string
  postal_code?: string
  reference?: string
}

export interface OrderItem {
  variant_id: number
  product_name: string
  variant_label: string
  qty: number
  price: number
}

// ─── Convenience aliases ───────────────────────────────────────────────────────

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Product = Omit<Database['public']['Tables']['products']['Row'], 'images'> & {
  images: ProductImage[]
}
export type ProductVariant = Database['public']['Tables']['product_variants']['Row']
export type Banner = Database['public']['Tables']['banners']['Row']
export type Order = Omit<Database['public']['Tables']['orders']['Row'], 'shipping_addr' | 'items'> & {
  shipping_addr: ShippingAddress
  items: OrderItem[]
}
export type BlogPost = Database['public']['Tables']['blog_posts']['Row']
export type NewsletterSubscriber = Database['public']['Tables']['newsletter_subscribers']['Row']
export type StoreConfigRow = Database['public']['Tables']['store_config']['Row']

export type ProductWithVariants = Product & {
  variants: ProductVariant[]
  category: Category | null
}

export type OrderWithItems = Order & {
  profile?: Profile | null
}
