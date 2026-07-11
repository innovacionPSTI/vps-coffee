-- ============================================================
-- VPS Coffee — Schema inicial de Supabase / PostgreSQL
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- Habilitar extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── PROFILES ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT,
  phone         TEXT,
  role          TEXT DEFAULT 'customer'
                  CHECK (role IN ('super_admin','admin','editor','customer')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

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
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  description   TEXT,
  category_id   INT REFERENCES categories(id) ON DELETE SET NULL,
  images        JSONB DEFAULT '[]',
  active        BOOLEAN DEFAULT TRUE,
  featured      BOOLEAN DEFAULT FALSE,
  seo_title     TEXT,
  seo_desc      TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PRODUCT VARIANTS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_variants (
  id            SERIAL PRIMARY KEY,
  product_id    INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  roast         TEXT CHECK (roast IN ('claro','medio','oscuro')),
  weight        TEXT CHECK (weight IN ('250g','500g','1kg')),
  grind         TEXT CHECK (grind IN ('grano','media','fina','gruesa')),
  brew_method   TEXT CHECK (brew_method IN ('espresso','filtrado','cold_brew','universal')),
  price         INT NOT NULL,
  stock         INT DEFAULT 0,
  sku           TEXT UNIQUE,
  active        BOOLEAN DEFAULT TRUE
);

-- ─── BANNERS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS banners (
  id            SERIAL PRIMARY KEY,
  section       TEXT NOT NULL,
  title         TEXT,
  subtitle      TEXT,
  cta_text      TEXT,
  cta_url       TEXT,
  image_url     TEXT,
  bg_color      TEXT DEFAULT '#614A2A',
  order_index   INT DEFAULT 0,
  active        BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ORDERS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                      SERIAL PRIMARY KEY,
  order_number            TEXT UNIQUE NOT NULL,
  customer_id             UUID REFERENCES profiles(id) ON DELETE SET NULL,
  customer_name           TEXT NOT NULL,
  customer_email          TEXT NOT NULL,
  customer_phone          TEXT,
  shipping_addr           JSONB NOT NULL,
  items                   JSONB NOT NULL,
  subtotal                INT NOT NULL,
  shipping_cost           INT DEFAULT 0,
  discount                INT DEFAULT 0,
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
  ('banners', 'banners', true),
  ('blog', 'blog', true),
  ('private', 'private', false)
ON CONFLICT (id) DO NOTHING;

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Profiles: cada usuario ve su propio perfil; admins ven todos
CREATE POLICY "Users view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );

CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Products: lectura pública de activos; escritura solo admins/editors
CREATE POLICY "Public read active products" ON products
  FOR SELECT USING (active = true);

CREATE POLICY "Admins manage products" ON products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','editor'))
  );

-- Product variants: lectura pública
CREATE POLICY "Public read active variants" ON product_variants
  FOR SELECT USING (active = true);

CREATE POLICY "Admins manage variants" ON product_variants
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','editor'))
  );

-- Categories: lectura pública
CREATE POLICY "Public read categories" ON categories
  FOR SELECT USING (active = true);

CREATE POLICY "Admins manage categories" ON categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );

-- Banners: lectura pública de activos
CREATE POLICY "Public read active banners" ON banners
  FOR SELECT USING (active = true);

CREATE POLICY "Admins manage banners" ON banners
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','editor'))
  );

-- Orders: clientes ven solo los suyos; admins ven todos
CREATE POLICY "Customers see own orders" ON orders
  FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "Admins see all orders" ON orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );

CREATE POLICY "Admins update orders" ON orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );

-- Blog: lectura pública de publicados
CREATE POLICY "Public read published posts" ON blog_posts
  FOR SELECT USING (published = true);

CREATE POLICY "Admins manage blog" ON blog_posts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','editor'))
  );

-- Newsletter: solo admins
CREATE POLICY "Admins manage newsletter" ON newsletter_subscribers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );

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
