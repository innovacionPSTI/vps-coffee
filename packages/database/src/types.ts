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
          email: string | null
          full_name: string | null
          phone: string | null
          role: 'super_admin' | 'admin' | 'vendedor' | 'gestor_tienda' | 'miembro' | 'customer'
          created_at: string
        }
        Insert: {
          id?: string
          email?: string | null
          full_name?: string | null
          phone?: string | null
          role?: 'super_admin' | 'admin' | 'vendedor' | 'gestor_tienda' | 'miembro' | 'customer'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          phone?: string | null
          role?: 'super_admin' | 'admin' | 'vendedor' | 'gestor_tienda' | 'miembro' | 'customer'
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
          variant_options: Json | null
        }
        Insert: {
          id?: number
          name: string
          slug: string
          description?: string | null
          category_id?: number | null
          images?: ProductImage[]
          active?: boolean
          featured?: boolean
          seo_title?: string | null
          seo_desc?: string | null
          created_at?: string
          variant_options?: Json | null
        }
        Update: {
          id?: number
          name?: string
          slug?: string
          description?: string | null
          category_id?: number | null
          images?: ProductImage[]
          active?: boolean
          featured?: boolean
          seo_title?: string | null
          seo_desc?: string | null
          created_at?: string
          variant_options?: Json | null
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
          weight_kg: number | null
          length_cm: number | null
          width_cm: number | null
          height_cm: number | null
          attributes: Json | null
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
          weight_kg?: number | null
          length_cm?: number | null
          width_cm?: number | null
          height_cm?: number | null
          attributes?: Json | null
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
          weight_kg?: number | null
          length_cm?: number | null
          width_cm?: number | null
          height_cm?: number | null
          attributes?: Json | null
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
          payment_method: 'wompi' | 'mercadopago' | 'tucompra' | null
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
          coupon_code: string | null
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
          shipping_addr: ShippingAddress
          items: OrderItem[]
          subtotal: number
          shipping_cost: number
          discount?: number
          total: number
          status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'exception'
          payment_method?: 'wompi' | 'mercadopago' | 'tucompra' | null
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
          coupon_code?: string | null
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
          shipping_addr?: ShippingAddress
          items?: OrderItem[]
          subtotal?: number
          shipping_cost?: number
          discount?: number
          total?: number
          status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'exception'
          payment_method?: 'wompi' | 'mercadopago' | 'tucompra' | null
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
          coupon_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'orders_customer_id_fkey'
            columns: ['customer_id']
            isOneToOne: false
            referencedRelation: 'customers'
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
          free_shipping_enabled: boolean
          free_shipping_min_amount: number
          skydropx_client_id: string | null
          skydropx_client_secret: string | null
          skydropx_address_from_id: string | null
          skydropx_base_url: string
          origin_name: string | null
          origin_street: string | null
          origin_neighborhood: string | null
          origin_city: string | null
          origin_department: string | null
          origin_postal_code: string | null
          origin_phone: string | null
          origin_email: string | null
          updated_at: string
        }
        Insert: {
          id?: number
          provider?: 'fixed' | 'skydropx'
          fixed_rate?: number
          free_shipping_enabled?: boolean
          free_shipping_min_amount?: number
          skydropx_client_id?: string | null
          skydropx_client_secret?: string | null
          skydropx_address_from_id?: string | null
          skydropx_base_url?: string
          origin_name?: string | null
          origin_street?: string | null
          origin_neighborhood?: string | null
          origin_city?: string | null
          origin_department?: string | null
          origin_postal_code?: string | null
          origin_phone?: string | null
          origin_email?: string | null
          updated_at?: string
        }
        Update: {
          id?: number
          provider?: 'fixed' | 'skydropx'
          fixed_rate?: number
          free_shipping_enabled?: boolean
          free_shipping_min_amount?: number
          skydropx_client_id?: string | null
          skydropx_client_secret?: string | null
          skydropx_address_from_id?: string | null
          skydropx_base_url?: string
          origin_name?: string | null
          origin_street?: string | null
          origin_neighborhood?: string | null
          origin_city?: string | null
          origin_department?: string | null
          origin_postal_code?: string | null
          origin_phone?: string | null
          origin_email?: string | null
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
          resend_api_key: string | null
          resend_from_email: string | null
          terms_content: string | null
          privacy_content: string | null
          instagram_url: string | null
          instagram_enabled: boolean
          facebook_url: string | null
          facebook_enabled: boolean
          tiktok_url: string | null
          tiktok_enabled: boolean
          maintenance_mode: boolean
          analytics_enabled: boolean
          trust_badges: Json
          footer_show_store: boolean
          footer_show_blog: boolean
          footer_show_legal: boolean
          nav_show_cart: boolean
          nav_show_auth: boolean
          email_provider: string
          updated_at: string
        }
        Insert: {
          id?: number
          whatsapp_number?: string | null
          store_name?: string
          store_email?: string | null
          logo_url?: string | null
          resend_api_key?: string | null
          resend_from_email?: string | null
          terms_content?: string | null
          privacy_content?: string | null
          instagram_url?: string | null
          instagram_enabled?: boolean
          facebook_url?: string | null
          facebook_enabled?: boolean
          tiktok_url?: string | null
          tiktok_enabled?: boolean
          maintenance_mode?: boolean
          analytics_enabled?: boolean
          trust_badges?: Json
          footer_show_store?: boolean
          footer_show_blog?: boolean
          footer_show_legal?: boolean
          nav_show_cart?: boolean
          nav_show_auth?: boolean
          email_provider?: string
          updated_at?: string
        }
        Update: {
          id?: number
          whatsapp_number?: string | null
          store_name?: string
          store_email?: string | null
          logo_url?: string | null
          resend_api_key?: string | null
          resend_from_email?: string | null
          terms_content?: string | null
          privacy_content?: string | null
          instagram_url?: string | null
          instagram_enabled?: boolean
          facebook_url?: string | null
          facebook_enabled?: boolean
          tiktok_url?: string | null
          tiktok_enabled?: boolean
          maintenance_mode?: boolean
          analytics_enabled?: boolean
          trust_badges?: Json
          footer_show_store?: boolean
          footer_show_blog?: boolean
          footer_show_legal?: boolean
          nav_show_cart?: boolean
          nav_show_auth?: boolean
          email_provider?: string
          updated_at?: string
        }
        Relationships: []
      }
      nav_items: {
        Row: {
          id: number
          nav_key: string
          label: string
          href: string | null
          page_key: string | null
          enabled: boolean
          order_index: number
          parent_id: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          nav_key?: string
          label: string
          href?: string | null
          page_key?: string | null
          enabled?: boolean
          order_index?: number
          parent_id?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          nav_key?: string
          label?: string
          href?: string | null
          page_key?: string | null
          enabled?: boolean
          order_index?: number
          parent_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'nav_items_page_key_fkey'
            columns: ['page_key']
            referencedRelation: 'pages'
            referencedColumns: ['key']
          }
        ]
      }
      coupons: {
        Row: {
          id: number
          code: string
          type: 'percentage' | 'fixed'
          value: number
          min_order_amount: number
          max_uses: number | null
          used_count: number
          expires_at: string | null
          active: boolean
          created_at: string
        }
        Insert: {
          id?: number
          code: string
          type: 'percentage' | 'fixed'
          value: number
          min_order_amount?: number
          max_uses?: number | null
          used_count?: number
          expires_at?: string | null
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          code?: string
          type?: 'percentage' | 'fixed'
          value?: number
          min_order_amount?: number
          max_uses?: number | null
          used_count?: number
          expires_at?: string | null
          active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      pages: {
        Row: {
          key: string
          label: string
          slug: string
          page_type: string
          enabled: boolean
          show_in_footer: boolean
          meta_title: string | null
          meta_description: string | null
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          key: string
          label: string
          slug: string
          page_type?: string
          enabled?: boolean
          show_in_footer?: boolean
          meta_title?: string | null
          meta_description?: string | null
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          key?: string
          label?: string
          slug?: string
          page_type?: string
          enabled?: boolean
          show_in_footer?: boolean
          meta_title?: string | null
          meta_description?: string | null
          order_index?: number
          updated_at?: string
        }
        Relationships: []
      }
      page_sections: {
        Row: {
          id: number
          section_key: string    // UUID estable para export/import
          page_key: string
          section_type: string
          title: string | null
          subtitle: string | null
          body: string | null
          image_url: string | null
          cta_label: string | null
          cta_url: string | null
          enabled: boolean
          order_index: number
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          section_key?: string
          page_key: string
          section_type?: string
          title?: string | null
          subtitle?: string | null
          body?: string | null
          image_url?: string | null
          cta_label?: string | null
          cta_url?: string | null
          enabled?: boolean
          order_index?: number
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          section_key?: string
          page_key?: string
          section_type?: string
          title?: string | null
          subtitle?: string | null
          body?: string | null
          image_url?: string | null
          cta_label?: string | null
          cta_url?: string | null
          enabled?: boolean
          order_index?: number
          settings?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'page_sections_page_key_fkey'
            columns: ['page_key']
            referencedRelation: 'pages'
            referencedColumns: ['key']
          }
        ]
      }
      section_items: {
        Row: {
          id: number
          section_id: number
          item_type: string
          icon: string | null
          title: string | null
          description: string | null
          question: string | null
          answer: string | null
          image_url: string | null
          image_url_mobile: string | null
          link_url: string | null
          cta_text: string | null
          metadata: Json
          enabled: boolean
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          section_id: number
          item_type?: string
          icon?: string | null
          title?: string | null
          description?: string | null
          question?: string | null
          answer?: string | null
          image_url?: string | null
          image_url_mobile?: string | null
          link_url?: string | null
          cta_text?: string | null
          metadata?: Json
          enabled?: boolean
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          section_id?: number
          item_type?: string
          icon?: string | null
          title?: string | null
          description?: string | null
          question?: string | null
          answer?: string | null
          image_url?: string | null
          image_url_mobile?: string | null
          link_url?: string | null
          cta_text?: string | null
          metadata?: Json
          enabled?: boolean
          order_index?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'section_items_section_id_fkey'
            columns: ['section_id']
            referencedRelation: 'page_sections'
            referencedColumns: ['id']
          }
        ]
      }
      cart_items: {
        Row: {
          id: number
          customer_id: string
          variant_id: number
          product_id: number
          product_name: string
          variant_label: string
          qty: number
          price: number
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: number
          customer_id: string
          variant_id: number
          product_id: number
          product_name: string
          variant_label: string
          qty?: number
          price: number
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          customer_id?: string
          variant_id?: number
          product_id?: number
          product_name?: string
          variant_label?: string
          qty?: number
          price?: number
          image_url?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'cart_items_customer_id_fkey'
            columns: ['customer_id']
            isOneToOne: false
            referencedRelation: 'customers'
            referencedColumns: ['id']
          }
        ]
      }
      payment_config: {
        Row: {
          id: number
          wompi_public_key: string | null
          wompi_private_key: string | null
          wompi_integrity_secret: string | null
          wompi_events_secret: string | null
          wompi_active: boolean
          mercadopago_access_token: string | null
          mercadopago_public_key: string | null
          mercadopago_active: boolean
          tucompra_merchant_id: string | null
          tucompra_secret_key: string | null
          tucompra_sandbox: boolean
          tucompra_active: boolean
          updated_at: string
        }
        Insert: {
          id?: number
          wompi_public_key?: string | null
          wompi_private_key?: string | null
          wompi_integrity_secret?: string | null
          wompi_events_secret?: string | null
          wompi_active?: boolean
          mercadopago_access_token?: string | null
          mercadopago_public_key?: string | null
          mercadopago_active?: boolean
          tucompra_merchant_id?: string | null
          tucompra_secret_key?: string | null
          tucompra_sandbox?: boolean
          tucompra_active?: boolean
          updated_at?: string
        }
        Update: {
          id?: number
          wompi_public_key?: string | null
          wompi_private_key?: string | null
          wompi_integrity_secret?: string | null
          wompi_events_secret?: string | null
          wompi_active?: boolean
          mercadopago_access_token?: string | null
          mercadopago_public_key?: string | null
          mercadopago_active?: boolean
          tucompra_merchant_id?: string | null
          tucompra_secret_key?: string | null
          tucompra_sandbox?: boolean
          tucompra_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      shipping_profiles: {
        Row: {
          id: number
          email: string
          first_name: string | null
          last_name: string | null
          phone: string | null
          address: string | null
          city: string | null
          department: string | null
          postal_code: string | null
          updated_at: string
        }
        Insert: {
          id?: number
          email: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          department?: string | null
          postal_code?: string | null
          updated_at?: string
        }
        Update: {
          id?: number
          email?: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          department?: string | null
          postal_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          id: string
          stack_id: string | null
          email: string
          name: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          stack_id?: string | null
          email: string
          name?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          stack_id?: string | null
          email?: string
          name?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      customer_addresses: {
        Row: {
          id: string
          customer_id: string
          label: string | null
          full_name: string
          phone: string | null
          address: string
          city: string
          department: string | null
          postal_code: string | null
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          label?: string | null
          full_name: string
          phone?: string | null
          address: string
          city: string
          department?: string | null
          postal_code?: string | null
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          label?: string | null
          full_name?: string
          phone?: string | null
          address?: string
          city?: string
          department?: string | null
          postal_code?: string | null
          is_default?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'customer_addresses_customer_id_fkey'
            columns: ['customer_id']
            isOneToOne: false
            referencedRelation: 'customers'
            referencedColumns: ['id']
          }
        ]
      }
      order_items: {
        Row: {
          id: number
          order_id: string | null
          product_id: number
          variant_id: number
          product_name: string
          variant_label: string
          image_url: string | null
          qty: number
          price: number
        }
        Insert: {
          id?: number
          order_id?: string | null
          product_id: number
          variant_id: number
          product_name: string
          variant_label: string
          image_url?: string | null
          qty?: number
          price: number
        }
        Update: {
          id?: number
          order_id?: string | null
          product_id?: number
          variant_id?: number
          product_name?: string
          variant_label?: string
          image_url?: string | null
          qty?: number
          price?: number
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          key: string
          url: string
          bucket: string
          mime_type: string | null
          size_bytes: number | null
          width_px: number | null
          height_px: number | null
          alt_text: string | null
          used_in: Json
          uploaded_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          key: string
          url: string
          bucket?: string
          mime_type?: string | null
          size_bytes?: number | null
          width_px?: number | null
          height_px?: number | null
          alt_text?: string | null
          used_in?: Json
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          key?: string
          url?: string
          bucket?: string
          mime_type?: string | null
          size_bytes?: number | null
          width_px?: number | null
          height_px?: number | null
          alt_text?: string | null
          used_in?: Json
          uploaded_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'media_assets_uploaded_by_fkey'
            columns: ['uploaded_by']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      variant_types: {
        Row: {
          id: number
          name: string
          values: Json          // string[]
          display_type: 'pill' | 'swatch'
          active: boolean
          order_index: number
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          values?: Json
          display_type?: 'pill' | 'swatch'
          active?: boolean
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          values?: Json
          display_type?: 'pill' | 'swatch'
          active?: boolean
          order_index?: number
          created_at?: string
        }
        Relationships: []
      }
      admin_config: {
        Row: {
          id: number
          accent_color: string
          sidebar_color: string
          updated_at: string
        }
        Insert: {
          id?: number
          accent_color?: string
          sidebar_color?: string
          updated_at?: string
        }
        Update: {
          id?: number
          accent_color?: string
          sidebar_color?: string
          updated_at?: string
        }
        Relationships: []
      }
      themes: {
        Row: {
          id: number
          name: string
          is_active: boolean
          is_default: boolean
          color_primary: string
          color_dark: string
          color_cream: string
          color_cream_warm: string
          color_yellow: string
          color_yellow_pale: string
          color_text: string
          font_display: string
          font_body: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          is_active?: boolean
          is_default?: boolean
          color_primary?: string
          color_dark?: string
          color_cream?: string
          color_cream_warm?: string
          color_yellow?: string
          color_yellow_pale?: string
          color_text?: string
          font_display?: string
          font_body?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          is_active?: boolean
          is_default?: boolean
          color_primary?: string
          color_dark?: string
          color_cream?: string
          color_cream_warm?: string
          color_yellow?: string
          color_yellow_pale?: string
          color_text?: string
          font_display?: string
          font_body?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_coupon_usage: {
        Args: { coupon_code: string }
        Returns: undefined
      }
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

export type UserRole = 'super_admin' | 'admin' | 'vendedor' | 'gestor_tienda' | 'miembro' | 'customer'

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
export type Order = Omit<Database['public']['Tables']['orders']['Row'], 'shipping_addr' | 'items'> & {
  shipping_addr: ShippingAddress
  items: OrderItem[]
}
export type BlogPost = Database['public']['Tables']['blog_posts']['Row']
export type NewsletterSubscriber = Database['public']['Tables']['newsletter_subscribers']['Row']
export type StoreConfigRow = Database['public']['Tables']['store_config']['Row']
export type PaymentConfig = Database['public']['Tables']['payment_config']['Row']

export type Customer = Database['public']['Tables']['customers']['Row']
export type CustomerAddress = Database['public']['Tables']['customer_addresses']['Row']

export type ProductWithVariants = Product & {
  variants: ProductVariant[]
  category: Category | null
}

export type OrderWithItems = Order & {
  customer?: Customer | null
}

export type CustomerWithAddresses = Customer & {
  addresses: CustomerAddress[]
}

export type Coupon = Database['public']['Tables']['coupons']['Row']
export type CartItem = Database['public']['Tables']['cart_items']['Row']
export type Page = Database['public']['Tables']['pages']['Row']
export type PageSection = Database['public']['Tables']['page_sections']['Row']
export type SectionItem = Database['public']['Tables']['section_items']['Row']
export type NavItem = Database['public']['Tables']['nav_items']['Row']
export type MediaAsset = Database['public']['Tables']['media_assets']['Row']

/** Tipos válidos de página (page_type) */
export type PageType = 'landing' | 'services' | 'about' | 'faq' | 'home' | 'custom'

/** Tipos válidos de sección (section_type) */
export type SectionType =
  | 'hero'
  | 'text'
  | 'cards'
  | 'faq'
  | 'cta'
  | 'testimonials'
  | 'whatsapp'
  | 'services'
  | 'featured_products'
  | 'best_sellers'
  | 'historia'
  | 'blog_preview'
  | 'newsletter'

/** Página con sus secciones y los ítems de cada sección */
export type PageWithSections = Page & {
  sections: (PageSection & { items: SectionItem[] })[]
}

export type VariantType = Omit<Database['public']['Tables']['variant_types']['Row'], 'values'> & {
  values: string[]
}
