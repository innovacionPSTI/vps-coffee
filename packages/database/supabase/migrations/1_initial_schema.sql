-- ============================================================
-- VPS Coffee — Schema inicial de Supabase / PostgreSQL
-- Compatible con Stack Auth (proveedor de identidad externo).
-- auth.users permanece vacía — NO usar auth.uid() en políticas RLS.
--
-- Incluye todas las columnas de extensión (imagen mobile en banners,
-- coupon_code en orders, variant_options en products, attributes y
-- dimensiones físicas en product_variants) para evitar ALTER TABLE
-- en migraciones posteriores.
-- ============================================================

-- Habilitar extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── PROFILES ─────────────────────────────────────────────────────────────────
-- Usuarios del panel de administración.
-- id: UUID libre generado por gen_random_uuid() — NO vinculado a auth.users.
-- email: clave de enlace con Stack Auth (Stack Auth no usa auth.users).
-- role: 'miembro' por defecto (sin acceso). Un admin asigna el rol real.
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE,
  full_name     TEXT,
  phone         TEXT,
  role          TEXT NOT NULL DEFAULT 'miembro'
                  CHECK (role IN ('super_admin','admin','vendedor','gestor_tienda','miembro','customer')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles (email);

COMMENT ON COLUMN profiles.email IS
  'Email del usuario en Stack Auth. Clave de enlace entre Stack Auth y Supabase.';
COMMENT ON COLUMN profiles.role IS
  'super_admin: acceso total + usuarios. admin: acceso total. '
  'vendedor: productos/pedidos/clientes. gestor_tienda: banners/blog/config. '
  'miembro: sin acceso (default al crear). customer: usuario web (no aplica al admin).';

-- ─── CATEGORIES ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  description   TEXT,
  image_url     TEXT,
  order_index   INT DEFAULT 0,
  active        BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PRODUCTS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id               SERIAL PRIMARY KEY,
  name             TEXT NOT NULL,
  slug             TEXT UNIQUE NOT NULL,
  description      TEXT,
  category_id      INT REFERENCES categories(id) ON DELETE SET NULL,
  images           JSONB DEFAULT '[]',
  active           BOOLEAN DEFAULT TRUE,
  featured         BOOLEAN DEFAULT FALSE,
  seo_title        TEXT,
  seo_desc         TEXT,
  -- Sistema de variantes genérico: lista ordenada de nombres de atributo.
  -- Ej: ["Tueste", "Peso"] — array vacío = usar campos heredados roast/weight/grind
  variant_options  JSONB DEFAULT '[]',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN products.variant_options IS
  'Lista ordenada de nombres de atributo para las variantes del producto. '
  'Ej: ["Tueste", "Peso"]. Array vacío = usar campos heredados roast/weight/grind.';

-- ─── PRODUCT VARIANTS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_variants (
  id            SERIAL PRIMARY KEY,
  product_id    INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  -- Campos heredados (retrocompatibilidad)
  roast         TEXT CHECK (roast IN ('claro','medio','oscuro')),
  weight        TEXT CHECK (weight IN ('250g','500g','1kg')),
  grind         TEXT CHECK (grind IN ('grano','media','fina','gruesa')),
  brew_method   TEXT CHECK (brew_method IN ('espresso','filtrado','cold_brew','universal')),
  price         INT NOT NULL,
  stock         INT DEFAULT 0,
  sku           TEXT UNIQUE,
  active        BOOLEAN DEFAULT TRUE,
  -- Sistema de variantes genérico: mapa clave-valor correspondiente a variant_options
  -- Ej: {"Tueste": "Claro", "Peso": "500g"}
  attributes    JSONB DEFAULT '{}',
  -- Dimensiones físicas para cotización de envíos con Skydropx
  weight_kg     NUMERIC(8,3),   -- Peso real en kg (ej: 0.350 para 350 g)
  length_cm     NUMERIC(8,2),   -- Largo del paquete empacado en cm
  width_cm      NUMERIC(8,2),   -- Ancho del paquete empacado en cm
  height_cm     NUMERIC(8,2)    -- Alto del paquete empacado en cm
);

COMMENT ON COLUMN product_variants.attributes IS
  'Mapa clave-valor que corresponde a products.variant_options. '
  'Ej: {"Tueste": "Claro", "Peso": "500g"}. Cae en campos heredados cuando está vacío.';
COMMENT ON COLUMN product_variants.weight_kg IS
  'Peso real del producto empacado en kilogramos. Se usa para cotizar envíos con Skydropx.';
COMMENT ON COLUMN product_variants.length_cm IS
  'Largo del paquete empacado (cm). Si es NULL se usan rangos de peso por defecto.';

-- ─── BANNERS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS banners (
  id               SERIAL PRIMARY KEY,
  section          TEXT NOT NULL,
  title            TEXT,
  subtitle         TEXT,
  cta_text         TEXT,
  cta_url          TEXT,
  image_url        TEXT,         -- Imagen desktop — 1920×600 px recomendado
  image_url_mobile TEXT,         -- Imagen mobile — 750×1000 px recomendado (opcional)
  bg_color         TEXT DEFAULT '#614A2A',
  order_index      INT DEFAULT 0,
  active           BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN banners.image_url        IS 'Imagen para escritorio — 1920×600 px recomendado';
COMMENT ON COLUMN banners.image_url_mobile IS 'Imagen para móvil — 750×1000 px recomendado (opcional)';

-- ─── ORDERS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                      SERIAL PRIMARY KEY,
  order_number            TEXT UNIQUE NOT NULL,
  customer_id             UUID,   -- FK añadida en migración 5 (customers aún no existe)
  customer_name           TEXT NOT NULL,
  customer_email          TEXT NOT NULL,
  customer_phone          TEXT,
  shipping_addr           JSONB NOT NULL,
  items                   JSONB NOT NULL,
  subtotal                INT NOT NULL,
  shipping_cost           INT DEFAULT 0,
  discount                INT DEFAULT 0,
  coupon_code             TEXT,   -- Código del cupón aplicado (trazabilidad)
  total                   INT NOT NULL,
  status                  TEXT DEFAULT 'pending'
                            CHECK (status IN ('pending','processing','shipped','delivered','cancelled','exception')),
  payment_method          TEXT CHECK (payment_method IN ('wompi','mercadopago')),
  payment_id              TEXT,
  payment_status          TEXT DEFAULT 'pending'
                            CHECK (payment_status IN ('pending','approved','rejected','refunded')),
  notes                   TEXT,
  -- Skydropx
  skydropx_quotation_id   TEXT,
  skydropx_rate_id        TEXT,
  skydropx_shipment_id    TEXT,
  tracking_number         TEXT,
  carrier_name            TEXT,
  label_url               TEXT,
  shipping_cost_final     INT,
  pickup_id               TEXT,
  pickup_date             DATE,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN orders.coupon_code IS
  'Código del cupón aplicado al pedido. NULL si no se usó cupón. '
  'El monto descontado está en orders.discount; este campo permite trazabilidad.';

-- ─── BLOG POSTS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blog_posts (
  id            SERIAL PRIMARY KEY,
  title         TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  excerpt       TEXT,
  content       TEXT,
  cover_image   TEXT,
  category      TEXT,
  author_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  published     BOOLEAN DEFAULT FALSE,
  published_at  TIMESTAMPTZ,
  seo_title     TEXT,
  seo_desc      TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── NEWSLETTER ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id            SERIAL PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  active        BOOLEAN DEFAULT TRUE
);

-- ─── STORAGE BUCKETS ──────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('products', 'products', true),
  ('banners',  'banners',  true),
  ('blog',     'blog',     true),
  ('private',  'private',  false)
ON CONFLICT (id) DO NOTHING;

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────
-- El service role key (SUPABASE_SERVICE_ROLE_KEY) bypasea RLS → todo el backend
-- funciona sin restricciones. El anon key solo puede hacer lo que definen
-- las políticas de abajo. Tablas sin política = acceso denegado al anon key.
ALTER TABLE profiles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories             ENABLE ROW LEVEL SECURITY;
ALTER TABLE products               ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants       ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners                ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Catálogo público (lectura sin credenciales)
CREATE POLICY "categories_public_read"        ON categories        FOR SELECT USING (true);
CREATE POLICY "products_public_read"          ON products          FOR SELECT USING (active = true);
CREATE POLICY "product_variants_public_read"  ON product_variants  FOR SELECT USING (active = true);
CREATE POLICY "banners_public_read"           ON banners           FOR SELECT USING (active = true);
CREATE POLICY "blog_posts_public_read"        ON blog_posts        FOR SELECT USING (published = true);
CREATE POLICY "newsletter_public_subscribe"   ON newsletter_subscribers FOR INSERT WITH CHECK (true);

-- profiles y orders: sin política de anon → acceso denegado al anon key.
-- El backend los accede siempre con service role.

-- ─── SEED DATA ────────────────────────────────────────────────────────────────
INSERT INTO categories (name, slug, description, order_index) VALUES
  ('Café Claro', 'cafe-claro', 'Tueste claro, notas frutales y florales, ideal para filtrado', 1),
  ('Café Medio', 'cafe-medio', 'Tueste medio balanceado, versátil para cualquier método', 2),
  ('Café Oscuro', 'cafe-oscuro', 'Tueste oscuro, cuerpo intenso, ideal para espresso y cold brew', 3)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO banners (section, title, subtitle, cta_text, cta_url, bg_color, order_index) VALUES
  ('hero', 'Café de Especialidad Colombiano', 'Trazabilidad completa desde el origen hasta tu taza', 'Comprar ahora', '/tienda', '#614A2A', 1),
  ('hero', 'Maquila & Tueste Artesanal', 'Tu café verde, nuestro tueste de especialidad a tu medida', 'Cotizar', '/maquila', '#604B30', 2)
ON CONFLICT DO NOTHING;
