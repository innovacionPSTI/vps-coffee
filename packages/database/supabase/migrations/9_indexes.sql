-- ============================================================
-- VPS Coffee — Migración 9: Índices de rendimiento
--
-- Índices en columnas de alto tráfico detectadas en auditoría.
-- Postgres NO crea índices automáticos en columnas FK (solo en PK
-- y UNIQUE). Sin estos índices, los JOINs y WHERE hacen full scans.
--
-- Las FK de cart_items → products/product_variants ya están en la
-- migración 5 (CREATE TABLE). Esta migración solo añade índices
-- de rendimiento para consultas frecuentes.
-- ============================================================

-- products.category_id: filtro más frecuente en la tienda
CREATE INDEX IF NOT EXISTS products_category_id_idx
  ON products (category_id)
  WHERE category_id IS NOT NULL;

-- product_variants.product_id: join principal al cargar catálogo
CREATE INDEX IF NOT EXISTS product_variants_product_id_idx
  ON product_variants (product_id);

-- orders.customer_id: consultas del historial de pedidos del cliente
CREATE INDEX IF NOT EXISTS orders_customer_id_idx
  ON orders (customer_id)
  WHERE customer_id IS NOT NULL;

-- orders.customer_email: consultas históricas por email (guest checkout)
CREATE INDEX IF NOT EXISTS orders_customer_email_idx
  ON orders (customer_email);

-- orders.status: filtro en la lista de pedidos del admin
CREATE INDEX IF NOT EXISTS orders_status_idx
  ON orders (status);

-- orders.created_at: ordenamiento por fecha (más reciente primero)
CREATE INDEX IF NOT EXISTS orders_created_at_idx
  ON orders (created_at DESC);

-- orders.coupon_code: reportes de uso de cupones
CREATE INDEX IF NOT EXISTS orders_coupon_code_idx
  ON orders (coupon_code)
  WHERE coupon_code IS NOT NULL;

-- banners: listados por sección con filtro de activos y orden
CREATE INDEX IF NOT EXISTS banners_section_active_idx
  ON banners (section, active, order_index);

-- blog_posts: listados públicos de artículos publicados
CREATE INDEX IF NOT EXISTS blog_posts_published_idx
  ON blog_posts (published, published_at DESC)
  WHERE published = true;

COMMENT ON INDEX blog_posts_published_idx IS
  'Cubre la consulta más frecuente: artículos publicados ordenados por fecha.';
