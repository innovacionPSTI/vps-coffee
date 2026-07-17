-- ============================================================
-- VPS Coffee — Esquema canónico de base de datos
-- Versión: 1.0 (compactado de migraciones 1–20)
-- ============================================================
--
-- Principios de diseño:
--   · Stack Auth como proveedor de identidad externo — auth.users vacía.
--     El enlace entre Stack Auth y Supabase se hace por email/stack_id.
--   · service_role_key en el backend bypasea RLS; el anon_key tiene acceso
--     mínimo (solo lectura pública de catálogo y escritura de newsletter).
--   · Patrón singleton con CHECK (id = 1) para tablas de configuración.
--   · CMS unificado: pages → page_sections → section_items.
--     No existen tablas paralelas de banners, section_settings ni testimonials.
--   · JSONB para datos variables (metadata, settings, attributes, images).
--   · Claves string estables (nav_key, section_key) para export/import.
--
-- Para un despliegue desde cero:
--   1. Ejecutar este archivo en el SQL Editor de Supabase.
--   2. Ejecutar supabase/seeds/01_config.sql   → fila única de store_config.
--   3. Ejecutar supabase/seeds/02_content.sql  → páginas, nav, secciones, items.
-- ============================================================

-- ── Extensiones ──────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- soporte para búsquedas fuzzy futuras

-- ── Función genérica updated_at ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ── ENUM ─────────────────────────────────────────────────────────────────────

CREATE TYPE shipping_provider_type AS ENUM ('fixed', 'skydropx');

-- ═══════════════════════════════════════════════════════════════
-- BLOQUE 1: USUARIOS Y PERFILES
-- ═══════════════════════════════════════════════════════════════

-- ─── PROFILES ─────────────────────────────────────────────────────────────────
-- Usuarios del panel de administración.
-- id: UUID libre — no vinculado a auth.users (usamos Stack Auth).
-- role: 'miembro' por defecto; un super_admin asigna el rol real.
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT        UNIQUE,
  full_name  TEXT,
  phone      TEXT,
  role       TEXT        NOT NULL DEFAULT 'miembro'
                           CHECK (role IN ('super_admin','admin','vendedor',
                                           'gestor_tienda','miembro','customer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles (email);

COMMENT ON TABLE  profiles       IS 'Administradores del panel. Identidad gestionada por Stack Auth; email es la clave de enlace.';
COMMENT ON COLUMN profiles.role  IS 'super_admin: acceso total + usuarios | admin: acceso total | vendedor: productos/pedidos | gestor_tienda: contenido/config | miembro: sin acceso (default).';

-- ─── CUSTOMERS ────────────────────────────────────────────────────────────────
-- Compradores web. Mirror de Stack Auth hacia Supabase.
-- Flujo: registro web → /api/auth/welcome → upsert aquí con stack_id + email.
CREATE TABLE IF NOT EXISTS customers (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  stack_id   TEXT        UNIQUE,                      -- ID en Stack Auth (NULL = guest checkout)
  email      TEXT        UNIQUE NOT NULL,
  name       TEXT,
  phone      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS customers_email_idx    ON customers (email);
CREATE INDEX IF NOT EXISTS customers_stack_id_idx ON customers (stack_id) WHERE stack_id IS NOT NULL;

COMMENT ON TABLE  customers          IS 'Compradores web. Mirror de Stack Auth. Separado de profiles (que es exclusivo del panel admin).';
COMMENT ON COLUMN customers.stack_id IS 'ID en Stack Auth. NULL para compradores invitados (guest checkout).';

-- ═══════════════════════════════════════════════════════════════
-- BLOQUE 2: CATÁLOGO
-- ═══════════════════════════════════════════════════════════════

-- ─── VARIANT TYPES ────────────────────────────────────────────────────────────
-- Plantillas reutilizables de atributo: "Tueste" → ["Claro","Medio","Oscuro"].
-- Se asignan a productos para generar combinaciones desde el admin.
CREATE TABLE IF NOT EXISTS variant_types (
  id           SERIAL      PRIMARY KEY,
  name         TEXT        NOT NULL UNIQUE,
  values       JSONB       NOT NULL DEFAULT '[]',
  display_type TEXT        NOT NULL DEFAULT 'pill'
                             CHECK (display_type IN ('pill', 'swatch')),
  active       BOOLEAN     NOT NULL DEFAULT true,
  order_index  INT         NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS variant_types_order_idx ON variant_types (order_index, id);

COMMENT ON TABLE  variant_types        IS 'Plantillas de atributos de variante. values es un array JSONB de opciones.';
COMMENT ON COLUMN variant_types.values IS 'Ej: ["Claro", "Medio", "Oscuro"]. Se deserializa como string[] en la aplicación.';

-- ─── CATEGORIES ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          SERIAL      PRIMARY KEY,
  name        TEXT        NOT NULL,
  slug        TEXT        UNIQUE NOT NULL,
  description TEXT,
  image_url   TEXT,
  order_index INT         NOT NULL DEFAULT 0,
  active      BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── PRODUCTS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id              SERIAL      PRIMARY KEY,
  name            TEXT        NOT NULL,
  slug            TEXT        UNIQUE NOT NULL,
  description     TEXT,
  category_id     INT         REFERENCES categories(id) ON DELETE SET NULL,
  images          JSONB       NOT NULL DEFAULT '[]',
  active          BOOLEAN     NOT NULL DEFAULT true,
  featured        BOOLEAN     NOT NULL DEFAULT false,
  seo_title       TEXT,
  seo_desc        TEXT,
  -- Lista ordenada de nombres de atributo: ["Tueste","Peso"].
  -- Array vacío = producto simple sin variantes por atributos.
  variant_options JSONB       NOT NULL DEFAULT '[]',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_category_id_idx ON products (category_id) WHERE category_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS products_active_idx       ON products (active, featured);

COMMENT ON COLUMN products.variant_options IS 'Lista ordenada de nombres de atributo. Ej: ["Tueste","Peso"]. Array vacío = usar campos heredados en product_variants.';

-- ─── PRODUCT VARIANTS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_variants (
  id          SERIAL      PRIMARY KEY,
  product_id  INT         NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  -- Campos heredados (retrocompatibilidad con catálogos de café simples)
  roast       TEXT        CHECK (roast IN ('claro','medio','oscuro')),
  weight      TEXT        CHECK (weight IN ('250g','500g','1kg')),
  grind       TEXT        CHECK (grind IN ('grano','media','fina','gruesa')),
  brew_method TEXT        CHECK (brew_method IN ('espresso','filtrado','cold_brew','universal')),
  price       INT         NOT NULL,
  stock       INT         NOT NULL DEFAULT 0,
  sku         TEXT        UNIQUE,
  active      BOOLEAN     NOT NULL DEFAULT true,
  -- Sistema genérico: mapa clave-valor correspondiente a products.variant_options.
  -- Ej: {"Tueste": "Claro", "Peso": "500g"}
  attributes  JSONB       NOT NULL DEFAULT '{}',
  -- Dimensiones físicas para cotización Skydropx
  weight_kg   NUMERIC(8,3),
  length_cm   NUMERIC(8,2),
  width_cm    NUMERIC(8,2),
  height_cm   NUMERIC(8,2)
);

CREATE INDEX IF NOT EXISTS product_variants_product_id_idx ON product_variants (product_id);
CREATE INDEX IF NOT EXISTS product_variants_active_idx     ON product_variants (product_id, active);

COMMENT ON COLUMN product_variants.attributes IS 'Mapa clave-valor que corresponde a products.variant_options. Ej: {"Tueste":"Claro","Peso":"500g"}.';
COMMENT ON COLUMN product_variants.weight_kg  IS 'Peso del producto empacado en kg. Requerido para cotizaciones Skydropx.';

-- ═══════════════════════════════════════════════════════════════
-- BLOQUE 3: COMERCIO
-- ═══════════════════════════════════════════════════════════════

-- ─── COUPONS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coupons (
  id               SERIAL        PRIMARY KEY,
  code             VARCHAR(50)   UNIQUE NOT NULL,
  type             VARCHAR(20)   NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value            DECIMAL(10,2) NOT NULL CHECK (value > 0),
  min_order_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_uses         INTEGER,                      -- NULL = ilimitado
  used_count       INTEGER       NOT NULL DEFAULT 0,
  expires_at       TIMESTAMPTZ,                  -- NULL = nunca expira
  active           BOOLEAN       NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS coupons_code_idx   ON coupons (LOWER(code));
CREATE INDEX IF NOT EXISTS coupons_active_idx ON coupons (active, expires_at);

COMMENT ON TABLE coupons IS 'Cupones de descuento por porcentaje o monto fijo. Validados en el checkout antes de crear la orden.';

-- ─── ORDERS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                    SERIAL      PRIMARY KEY,
  order_number          TEXT        UNIQUE NOT NULL,
  customer_id           UUID        REFERENCES customers(id) ON DELETE SET NULL,
  customer_name         TEXT        NOT NULL,
  customer_email        TEXT        NOT NULL,
  customer_phone        TEXT,
  shipping_addr         JSONB       NOT NULL,          -- snapshot inmutable de la dirección
  items                 JSONB       NOT NULL,
  subtotal              INT         NOT NULL,
  shipping_cost         INT         NOT NULL DEFAULT 0,
  discount              INT         NOT NULL DEFAULT 0,
  coupon_code           TEXT,                          -- trazabilidad del cupón aplicado
  total                 INT         NOT NULL,
  status                TEXT        NOT NULL DEFAULT 'pending'
                                      CHECK (status IN ('pending','processing','shipped',
                                                        'delivered','cancelled','exception')),
  payment_method        TEXT        CHECK (payment_method IN ('wompi','mercadopago')),
  payment_id            TEXT,
  payment_status        TEXT        NOT NULL DEFAULT 'pending'
                                      CHECK (payment_status IN ('pending','approved',
                                                                'rejected','refunded')),
  notes                 TEXT,
  internal_notes        TEXT,                          -- notas internas del equipo (no visibles al cliente)
  -- Skydropx
  skydropx_quotation_id TEXT,
  skydropx_rate_id      TEXT,
  skydropx_shipment_id  TEXT,
  tracking_number       TEXT,
  carrier_name          TEXT,
  label_url             TEXT,
  shipping_cost_final   INT,
  pickup_id             TEXT,
  pickup_date           DATE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_customer_id_idx    ON orders (customer_id)     WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS orders_customer_email_idx ON orders (customer_email);
CREATE INDEX IF NOT EXISTS orders_status_idx         ON orders (status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx     ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS orders_coupon_code_idx    ON orders (coupon_code)     WHERE coupon_code IS NOT NULL;

COMMENT ON COLUMN orders.shipping_addr  IS 'Snapshot inmutable de la dirección al momento del pedido. No se actualiza si el cliente cambia su dirección.';
COMMENT ON COLUMN orders.coupon_code    IS 'Código del cupón aplicado. El monto descontado está en orders.discount.';
COMMENT ON COLUMN orders.internal_notes IS 'Notas internas del equipo de despacho. No visibles al cliente.';

-- ─── CART ITEMS ───────────────────────────────────────────────────────────────
-- Carrito persistente para usuarios autenticados (recuperable entre dispositivos).
CREATE TABLE IF NOT EXISTS cart_items (
  id            SERIAL        PRIMARY KEY,
  customer_id   UUID          NOT NULL REFERENCES customers(id)        ON DELETE CASCADE,
  variant_id    INTEGER       NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  product_id    INTEGER       NOT NULL REFERENCES products(id)         ON DELETE CASCADE,
  product_name  TEXT          NOT NULL,
  variant_label TEXT          NOT NULL,
  qty           INTEGER       NOT NULL DEFAULT 1 CHECK (qty > 0),
  price         DECIMAL(10,2) NOT NULL,
  image_url     TEXT,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
  UNIQUE (customer_id, variant_id)
);

CREATE INDEX IF NOT EXISTS cart_items_customer_idx ON cart_items (customer_id);

COMMENT ON TABLE cart_items IS 'Carrito persistente en BD. Se sincroniza desde el cliente (Zustand) cuando el usuario está logueado.';

-- ─── CUSTOMER ADDRESSES ───────────────────────────────────────────────────────
-- Direcciones guardadas para pre-llenar el checkout.
-- Las órdenes guardan un snapshot independiente en shipping_addr (JSONB).
CREATE TABLE IF NOT EXISTS customer_addresses (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID        NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label       TEXT,                        -- "Casa", "Oficina", etc.
  full_name   TEXT        NOT NULL,        -- nombre del destinatario (puede diferir del cliente)
  phone       TEXT,
  address     TEXT        NOT NULL,
  city        TEXT        NOT NULL,
  department  TEXT,
  postal_code TEXT,
  is_default  BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS customer_addresses_customer_idx ON customer_addresses (customer_id);

COMMENT ON TABLE  customer_addresses            IS 'Direcciones guardadas para pre-llenar el checkout. No se modifican al actualizar una orden.';
COMMENT ON COLUMN customer_addresses.is_default IS 'Solo una dirección por cliente puede ser default. La app controla la unicidad antes del INSERT/UPDATE.';

-- ═══════════════════════════════════════════════════════════════
-- BLOQUE 4: CONFIGURACIÓN (SINGLETONS)
-- ═══════════════════════════════════════════════════════════════

-- ─── SHIPPING CONFIG ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shipping_config (
  id                       SERIAL                NOT NULL DEFAULT 1,
  provider                 shipping_provider_type NOT NULL DEFAULT 'fixed',
  fixed_rate               NUMERIC(12,2)          NOT NULL DEFAULT 8000,
  free_shipping_enabled    BOOLEAN                NOT NULL DEFAULT true,
  free_shipping_min_amount NUMERIC(12,2)          NOT NULL DEFAULT 100000,
  -- Credenciales Skydropx
  skydropx_client_id       TEXT,
  skydropx_client_secret   TEXT,
  skydropx_address_from_id TEXT,
  skydropx_base_url        TEXT                   NOT NULL DEFAULT 'https://api-pro.skydropx.com',
  -- Dirección de origen para cotizaciones y guías
  origin_name              TEXT,
  origin_street            TEXT,
  origin_neighborhood      TEXT,
  origin_city              TEXT,
  origin_department        TEXT,
  origin_postal_code       TEXT,
  origin_phone             TEXT,
  origin_email             TEXT,
  updated_at               TIMESTAMPTZ            NOT NULL DEFAULT now(),
  CONSTRAINT shipping_config_singleton CHECK (id = 1)
);

CREATE UNIQUE INDEX IF NOT EXISTS shipping_config_singleton_idx ON shipping_config ((TRUE));

INSERT INTO shipping_config (id, provider, fixed_rate) VALUES (1, 'fixed', 8000) ON CONFLICT DO NOTHING;

COMMENT ON TABLE  shipping_config                        IS 'Singleton de configuración de envíos. Credenciales Skydropx actualizables desde el admin sin redeploy.';
COMMENT ON COLUMN shipping_config.free_shipping_enabled IS 'Si true, órdenes con subtotal >= free_shipping_min_amount tienen envío gratis.';

-- ─── SHIPPING PROFILES ────────────────────────────────────────────────────────
-- Datos de contacto frecuentes del comprador (keyed por email).
CREATE TABLE IF NOT EXISTS shipping_profiles (
  id          SERIAL      PRIMARY KEY,
  email       TEXT        NOT NULL UNIQUE,
  first_name  TEXT,
  last_name   TEXT,
  phone       TEXT,
  address     TEXT,
  city        TEXT,
  department  TEXT,
  postal_code TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shipping_profiles_email_idx ON shipping_profiles (email);

-- ─── STORE CONFIG ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS store_config (
  id                 INTEGER     PRIMARY KEY DEFAULT 1,
  -- Branding
  store_name         TEXT        NOT NULL DEFAULT 'Mi Tienda',
  store_email        TEXT,
  store_description  TEXT,
  whatsapp_number    TEXT,
  logo_url           TEXT,
  favicon_url        TEXT,
  -- SEO
  seo_keywords       TEXT,
  -- Email transaccional (Resend)
  resend_api_key     TEXT,
  resend_from_email  TEXT,
  -- Redes sociales
  instagram_url      TEXT,
  instagram_enabled  BOOLEAN     NOT NULL DEFAULT true,
  facebook_url       TEXT,
  facebook_enabled   BOOLEAN     NOT NULL DEFAULT true,
  tiktok_url         TEXT,
  tiktok_enabled     BOOLEAN     NOT NULL DEFAULT true,
  -- Toggles operacionales
  maintenance_mode   BOOLEAN     NOT NULL DEFAULT false,
  analytics_enabled  BOOLEAN     NOT NULL DEFAULT false,
  -- Navbar
  nav_show_cart      BOOLEAN     NOT NULL DEFAULT true,
  nav_show_auth      BOOLEAN     NOT NULL DEFAULT true,
  -- Footer
  footer_show_store  BOOLEAN     NOT NULL DEFAULT true,
  footer_show_blog   BOOLEAN     NOT NULL DEFAULT true,
  footer_show_legal  BOOLEAN     NOT NULL DEFAULT true,
  -- Trust badges (array JSONB: [{text: "...", enabled: true}])
  trust_badges       JSONB       NOT NULL DEFAULT '[]',
  -- Contenido legal (Markdown) — deprecated desde migración 18, mantenido para compatibilidad
  terms_content      TEXT,
  privacy_content    TEXT,
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT store_config_singleton CHECK (id = 1)
);

INSERT INTO store_config (id) VALUES (1) ON CONFLICT DO NOTHING;

COMMENT ON TABLE  store_config                IS 'Singleton de configuración de tienda. Contiene credenciales sensibles — acceso solo vía service role.';
COMMENT ON COLUMN store_config.trust_badges   IS 'Badges de confianza en página de producto. Ej: [{"text":"Envío seguro","enabled":true}].';
COMMENT ON COLUMN store_config.terms_content  IS '[Deprecated] Contenido Markdown de /terminos. Ahora se gestiona en page_sections (page_key=terminos).';
COMMENT ON COLUMN store_config.privacy_content IS '[Deprecated] Contenido Markdown de /privacidad. Ahora se gestiona en page_sections (page_key=privacidad).';

-- ─── PAYMENT CONFIG ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_config (
  id                       INTEGER   PRIMARY KEY DEFAULT 1,
  -- Wompi
  wompi_public_key         TEXT,
  wompi_private_key        TEXT,
  wompi_integrity_secret   TEXT,     -- firma de payment links (SHA256)
  wompi_events_secret      TEXT,     -- verificación de webhooks
  wompi_active             BOOLEAN   NOT NULL DEFAULT false,
  -- MercadoPago
  mercadopago_access_token TEXT,
  mercadopago_public_key   TEXT,
  mercadopago_active       BOOLEAN   NOT NULL DEFAULT false,
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT payment_config_singleton CHECK (id = 1)
);

INSERT INTO payment_config (id) VALUES (1) ON CONFLICT DO NOTHING;

COMMENT ON TABLE payment_config IS 'Singleton de credenciales de pasarelas de pago (Wompi, MercadoPago). Acceso exclusivo vía service role.';

-- ─── ADMIN CONFIG ──────────────────────────────────────────────────────────────
-- Apariencia del panel de administración.
-- Completamente independiente de la tabla themes (que controla el sitio web público).
CREATE TABLE IF NOT EXISTS admin_config (
  id              INTEGER     PRIMARY KEY DEFAULT 1,
  accent_color    TEXT        NOT NULL DEFAULT '#4F46E5',
  sidebar_color   TEXT        NOT NULL DEFAULT '#0F172A',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT admin_config_singleton CHECK (id = 1)
);

INSERT INTO admin_config (id) VALUES (1) ON CONFLICT DO NOTHING;

COMMENT ON TABLE  admin_config IS 'Singleton de apariencia del panel admin. Independiente de la tabla themes (web público).';
COMMENT ON COLUMN admin_config.accent_color  IS 'Color hex para botones, nav activo y elementos interactivos del panel.';
COMMENT ON COLUMN admin_config.sidebar_color IS 'Color hex de fondo del sidebar de navegación.';

-- ═══════════════════════════════════════════════════════════════
-- BLOQUE 5: CONTENIDO / CMS
-- ═══════════════════════════════════════════════════════════════
--
-- Modelo unificado: pages → page_sections → section_items
-- No existen banners, section_settings ni testimonials como tablas separadas.
--
-- Tipos de sección (section_type):
--   hero             → carrusel de imágenes, título grande, CTA
--   text             → título + cuerpo (párrafos, Markdown)
--   cards            → grid de tarjetas (section_items de tipo 'card')
--   faq              → acordeón de preguntas (section_items de tipo 'faq')
--   cta              → llamada a acción centrada con botón
--   testimonials     → carrusel de testimonios (section_items de tipo 'testimonial')
--   whatsapp         → botón/formulario de contacto WhatsApp
--   services         → paneles de servicios con imagen (section_items de tipo 'service')
--   featured_products→ grid de productos destacados (query automática)
--   best_sellers     → grid de más vendidos (query automática)
--   historia         → bloque texto + imagen "Nuestra historia"
--   blog_preview     → vista previa del blog (query automática)
--   newsletter       → formulario de suscripción al boletín
--
-- ─── PAGES ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pages (
  key            TEXT        PRIMARY KEY,
  label          TEXT        NOT NULL,
  slug           TEXT        NOT NULL UNIQUE,
  page_type      TEXT        NOT NULL DEFAULT 'custom',
  enabled        BOOLEAN     NOT NULL DEFAULT true,
  show_in_footer BOOLEAN     NOT NULL DEFAULT true,
  -- SEO por página
  meta_title     TEXT,
  meta_description TEXT,
  order_index    INT         NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  pages           IS 'Páginas del sitio. page_type: home | about | services | custom. Cada página tiene secciones ordenadas.';
COMMENT ON COLUMN pages.page_type IS 'home: portada especial | about: nosotros | services: asesorías/maquila | custom: página genérica.';

-- Página home (siempre presente — ancla de todas las secciones del inicio)
INSERT INTO pages (key, label, slug, page_type, enabled, show_in_footer, order_index)
VALUES ('home', 'Inicio', '', 'home', true, false, 0)
ON CONFLICT (key) DO NOTHING;

-- ─── NAV ITEMS ────────────────────────────────────────────────────────────────
-- Soporta estructura plana y grupos con dropdown de 1 nivel.
CREATE TABLE IF NOT EXISTS nav_items (
  id          SERIAL      PRIMARY KEY,
  nav_key     TEXT        NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  label       TEXT        NOT NULL,
  href        TEXT,                        -- NULL = solo encabezado de grupo
  page_key    TEXT        REFERENCES pages(key) ON DELETE SET NULL,
  enabled     BOOLEAN     NOT NULL DEFAULT true,
  order_index INT         NOT NULL DEFAULT 0,
  parent_id   INT         REFERENCES nav_items(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS nav_items_parent_idx ON nav_items (parent_id, order_index);

COMMENT ON TABLE  nav_items          IS 'Ítems del menú de navegación. Soporta grupos (parent_id) y vínculo a páginas CMS (page_key).';
COMMENT ON COLUMN nav_items.nav_key  IS 'Clave string estable para export/import. Generada automáticamente; editable manualmente.';
COMMENT ON COLUMN nav_items.page_key IS 'Vínculo opcional a una página CMS. Si se define, el href de la página tiene precedencia sobre el campo href.';

-- ─── PAGE SECTIONS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS page_sections (
  id           SERIAL      PRIMARY KEY,
  section_key  UUID        NOT NULL DEFAULT gen_random_uuid(),
  page_key     TEXT        NOT NULL REFERENCES pages(key) ON DELETE CASCADE,
  section_type TEXT        NOT NULL DEFAULT 'text'
                             CONSTRAINT page_sections_section_type_check
                             CHECK (section_type IN (
                               'hero','text','cards','faq','cta','testimonials',
                               'whatsapp','services','featured_products','best_sellers',
                               'historia','blog_preview','newsletter'
                             )),
  title        TEXT,
  subtitle     TEXT,
  body         TEXT,
  image_url    TEXT,
  cta_label    TEXT,
  cta_url      TEXT,
  enabled      BOOLEAN     NOT NULL DEFAULT true,
  order_index  INT         NOT NULL DEFAULT 0,
  -- Configuración libre por tipo de sección.
  -- testimonials: {"filter_by_page": true}
  -- whatsapp:     {"message_type": "asesoria"|"maquila"|"general"}
  -- historia:     {"title":"...","subtitle":"...","cta_text":"...","cta_url":"..."}
  settings     JSONB       NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS page_sections_section_key_idx    ON page_sections (section_key);
CREATE INDEX        IF NOT EXISTS page_sections_page_key_idx        ON page_sections (page_key, order_index);
CREATE INDEX        IF NOT EXISTS page_sections_page_enabled_idx    ON page_sections (page_key, enabled, order_index) WHERE enabled = true;
CREATE INDEX        IF NOT EXISTS page_sections_page_type_idx       ON page_sections (page_key, section_type);

COMMENT ON TABLE  page_sections          IS 'Bloques de contenido de una página. section_type define el componente React a renderizar.';
COMMENT ON COLUMN page_sections.settings IS 'Configuración libre por tipo. Ej: historia → {"title":"...","cta_url":"/nosotros"} | whatsapp → {"message_type":"asesoria"}.';
COMMENT ON COLUMN page_sections.section_key IS 'UUID estable para export/import. No cambia entre despliegues.';

-- ─── SECTION ITEMS ────────────────────────────────────────────────────────────
-- Ítems individuales dentro de una sección.
-- item_type: slide (hero), card (cards), faq, service (services), testimonial.
CREATE TABLE IF NOT EXISTS section_items (
  id              SERIAL      PRIMARY KEY,
  section_id      INT         NOT NULL REFERENCES page_sections(id) ON DELETE CASCADE,
  item_type       TEXT        NOT NULL DEFAULT 'card',
  icon            TEXT,
  title           TEXT,
  description     TEXT,
  question        TEXT,
  answer          TEXT,
  image_url       TEXT,
  image_url_mobile TEXT,                   -- variante mobile (hero slides)
  link_url        TEXT,
  cta_text        TEXT,
  enabled         BOOLEAN     NOT NULL DEFAULT true,
  order_index     INT         NOT NULL DEFAULT 0,
  -- Metadatos variables según item_type:
  --   slide/service:  {"bg_color": "#614A2A"}
  --   testimonial:    {"rating": 5, "role": "Cliente frecuente"}
  metadata        JSONB       NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS section_items_section_idx         ON section_items (section_id, order_index);
CREATE INDEX IF NOT EXISTS section_items_section_enabled_idx ON section_items (section_id, enabled, order_index) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS section_items_type_idx            ON section_items (section_id, item_type);

COMMENT ON TABLE  section_items          IS 'Ítems de una sección: slides (hero), tarjetas (cards), preguntas (faq), servicios (services), testimonios (testimonials).';
COMMENT ON COLUMN section_items.metadata IS 'Campos variables por tipo. slide/service: {"bg_color":"#614A2A"} | testimonial: {"rating":5,"role":"Cliente"}.';

-- ─── MEDIA ASSETS ─────────────────────────────────────────────────────────────
-- Inventario centralizado de archivos subidos.
-- used_in permite detectar assets huérfanos para limpieza.
CREATE TABLE IF NOT EXISTS media_assets (
  key         TEXT        PRIMARY KEY,      -- slug legible: 'nosotros-hero-2026'
  url         TEXT        NOT NULL,
  bucket      TEXT        NOT NULL DEFAULT 'public',
  mime_type   TEXT,
  size_bytes  INT,
  width_px    INT,
  height_px   INT,
  alt_text    TEXT,
  -- Referencias: [{"table":"section_items","field":"image_url","id":42}]
  used_in     JSONB       NOT NULL DEFAULT '[]',
  uploaded_by UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS media_assets_bucket_idx     ON media_assets (bucket);
CREATE INDEX IF NOT EXISTS media_assets_mime_idx       ON media_assets (mime_type);
CREATE INDEX IF NOT EXISTS media_assets_used_in_gin_idx ON media_assets USING GIN (used_in);

COMMENT ON TABLE  media_assets         IS 'Inventario de assets subidos. used_in permite detectar archivos huérfanos para limpieza.';
COMMENT ON COLUMN media_assets.used_in IS 'Array JSONB de referencias. Ej: [{"table":"section_items","field":"image_url","id":42}]. Soporte @> con índice GIN.';

-- ═══════════════════════════════════════════════════════════════
-- BLOQUE 6: CONTENIDO DE BLOG Y NEWSLETTER
-- ═══════════════════════════════════════════════════════════════

-- ─── BLOG POSTS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blog_posts (
  id           SERIAL      PRIMARY KEY,
  title        TEXT        NOT NULL,
  slug         TEXT        UNIQUE NOT NULL,
  excerpt      TEXT,
  content      TEXT,
  cover_image  TEXT,
  category     TEXT,
  author_id    UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  published    BOOLEAN     NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  seo_title    TEXT,
  seo_desc     TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS blog_posts_published_idx ON blog_posts (published, published_at DESC) WHERE published = true;
CREATE INDEX IF NOT EXISTS blog_posts_slug_idx      ON blog_posts (slug);

-- ─── NEWSLETTER SUBSCRIBERS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id            SERIAL      PRIMARY KEY,
  email         TEXT        UNIQUE NOT NULL,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  active        BOOLEAN     NOT NULL DEFAULT true
);

-- ═══════════════════════════════════════════════════════════════
-- BLOQUE 7: APARIENCIA
-- ═══════════════════════════════════════════════════════════════

-- ─── THEMES ───────────────────────────────────────────────────────────────────
-- Paleta de colores y tipografía configurable. El tema activo se inyecta
-- como CSS custom properties en el layout del sitio.
CREATE TABLE IF NOT EXISTS themes (
  id               SERIAL      PRIMARY KEY,
  name             TEXT        NOT NULL,
  is_active        BOOLEAN     NOT NULL DEFAULT false,
  is_default       BOOLEAN     NOT NULL DEFAULT false,
  -- Colores (hex)
  color_primary    TEXT        NOT NULL DEFAULT '#614A2A',
  color_dark       TEXT        NOT NULL DEFAULT '#604B30',
  color_cream      TEXT        NOT NULL DEFAULT '#FFF0D1',
  color_cream_warm TEXT        NOT NULL DEFAULT '#FFF1D3',
  color_yellow     TEXT        NOT NULL DEFAULT '#FFF6B8',
  color_yellow_pale TEXT       NOT NULL DEFAULT '#FDF8B9',
  color_text       TEXT        NOT NULL DEFAULT '#2D1A0A',
  -- Fuentes ('cormorant' | 'playfair' | 'dm-sans' | 'inter')
  font_display     TEXT        NOT NULL DEFAULT 'cormorant',
  font_body        TEXT        NOT NULL DEFAULT 'dm-sans',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Solo un tema activo a la vez
CREATE UNIQUE INDEX IF NOT EXISTS themes_active_unique ON themes (is_active) WHERE is_active = true;

COMMENT ON TABLE themes IS 'Temas visuales. El tema activo se inyecta como CSS vars en <head>. Solo un tema puede estar activo.';

-- ═══════════════════════════════════════════════════════════════
-- BLOQUE 8: STORAGE BUCKETS
-- ═══════════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public) VALUES
  ('products', 'products', true),
  ('banners',  'banners',  true),
  ('blog',     'blog',     true),
  ('private',  'private',  false)
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- BLOQUE 9: ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════
--
-- Patrón de seguridad:
--   · service_role_key → bypasea RLS → todo el backend funciona sin restricciones.
--   · anon_key → solo lectura pública de catálogo + suscripción newsletter.
--   · Tablas sensibles (store_config, payment_config, shipping_config, profiles,
--     customers, orders, cart_items, customer_addresses) → sin política anon
--     → acceso denegado por defecto al anon_key.

ALTER TABLE profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers             ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_types         ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories            ENABLE ROW LEVEL SECURITY;
ALTER TABLE products              ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants      ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons               ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders                ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items            ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses    ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_config       ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_config          ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_config        ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE nav_items             ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_sections         ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets          ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE themes                ENABLE ROW LEVEL SECURITY;

-- ── Políticas de lectura pública ─────────────────────────────────────────────
-- Catálogo (anon puede leer productos activos, variantes activas, categorías)
CREATE POLICY "categories_public_read"       ON categories        FOR SELECT USING (true);
CREATE POLICY "products_public_read"         ON products          FOR SELECT USING (active = true);
CREATE POLICY "product_variants_public_read" ON product_variants  FOR SELECT USING (active = true);
CREATE POLICY "variant_types_public_read"    ON variant_types     FOR SELECT USING (active = true);

-- Blog (solo posts publicados)
CREATE POLICY "blog_posts_public_read"       ON blog_posts        FOR SELECT USING (published = true);

-- CMS (el frontend web lee secciones y páginas)
CREATE POLICY "pages_public_read"            ON pages             FOR SELECT USING (enabled = true);
CREATE POLICY "nav_items_public_read"        ON nav_items         FOR SELECT USING (enabled = true);
CREATE POLICY "page_sections_public_read"    ON page_sections     FOR SELECT USING (enabled = true);
CREATE POLICY "section_items_public_read"    ON section_items     FOR SELECT USING (enabled = true);
CREATE POLICY "media_assets_public_read"     ON media_assets      FOR SELECT USING (true);

-- Temas (el layout del sitio lee el tema activo)
CREATE POLICY "themes_public_read"           ON themes            FOR SELECT USING (true);

-- Shipping (el checkout lee la tarifa antes de hacer login)
CREATE POLICY "shipping_config_public_read"  ON shipping_config   FOR SELECT USING (true);

-- Newsletter (cualquiera puede suscribirse)
CREATE POLICY "newsletter_public_subscribe"  ON newsletter_subscribers FOR INSERT WITH CHECK (true);

-- ── Escritura Skydropx config (service role only implícito, pero explicitamos) ─
CREATE POLICY "service_role_shipping_write" ON shipping_config
  FOR UPDATE TO service_role USING (true) WITH CHECK (true);

-- ── Políticas de escritura service_role para tablas sensibles ────────────────
CREATE POLICY "service_role_all_payment_config" ON payment_config
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════
-- BLOQUE 10: TRIGGERS
-- ═══════════════════════════════════════════════════════════════

-- Triggers updated_at (usando la función genérica set_updated_at)

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER nav_items_updated_at
  BEFORE UPDATE ON nav_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER page_sections_updated_at
  BEFORE UPDATE ON page_sections
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER section_items_updated_at
  BEFORE UPDATE ON section_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER media_assets_updated_at
  BEFORE UPDATE ON media_assets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER themes_updated_at
  BEFORE UPDATE ON themes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER pages_updated_at
  BEFORE UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER store_config_updated_at
  BEFORE UPDATE ON store_config
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
