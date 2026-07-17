# packages/database — Capa de datos VPS Coffee

Paquete compartido que centraliza el cliente de Supabase, los tipos TypeScript del schema y las funciones de query para todas las apps del monorepo.

```ts
import { getWebHomeData, getPageWithSections, createServerClient } from '@vps/database'
import type { Product, Order, PageSection, SectionItem } from '@vps/database'
```

---

## Modelo de datos

### Arquitectura CMS unificado (v13)

El modelo central sigue una jerarquía de tres niveles. No existen tablas de contenido paralelas — todo el contenido gestionable vive en este árbol:

```
pages
  └─ page_sections   (bloques de una página, tipo definido por section_type)
       └─ section_items  (ítems individuales: slides, tarjetas, FAQ, testimonios, servicios)
```

Tablas eliminadas en v13: `banners`, `section_settings`, `testimonials` (el contenido equivalente vive en `page_sections` / `section_items`).

**Tipos de sección (`section_type`):**

| Tipo | Descripción | Items |
|------|-------------|-------|
| `hero` | Carrusel de imágenes principal | `slide` |
| `services` | Paneles de servicio con imagen | `service` |
| `testimonials` | Carrusel de testimonios | `testimonial` |
| `cards` | Grid de tarjetas de contenido | `card` |
| `faq` | Acordeón de preguntas | `faq` |
| `cta` | Llamada a acción centrada | — |
| `text` | Bloque de texto/Markdown | — |
| `whatsapp` | Botón de contacto WhatsApp | — |
| `featured_products` | Grid de productos destacados | — (query automática) |
| `best_sellers` | Grid de más vendidos | — (query automática) |
| `historia` | Bloque "Nuestra historia" | — (settings JSONB) |
| `blog_preview` | Vista previa del blog | — (query automática) |
| `newsletter` | Formulario de suscripción | — |

**Metadatos variables en `section_items.metadata` (JSONB):**
- `slide` / `service` → `{ "bg_color": "#614A2A" }`
- `testimonial` → `{ "rating": 5, "role": "Barista profesional" }`

**Configuración libre en `page_sections.settings` (JSONB):**
- `whatsapp` → `{ "message_type": "asesoria" | "maquila" | "general" }`
- `historia` → `{ "title": "...", "subtitle": "...", "cta_text": "...", "cta_url": "..." }`
- `testimonials` → `{ "filter_by_page": true }`

### Tablas de soporte

| Tabla | Patrón | Descripción |
|-------|--------|-------------|
| `profiles` | FK Stack Auth por email | Usuarios del panel admin |
| `customers` | Mirror Stack Auth | Compradores web |
| `orders` | Snapshot inmutable | Pedidos con `shipping_addr` JSONB |
| `cart_items` | FK ON DELETE CASCADE | Carrito persistente |
| `customer_addresses` | FK customer | Direcciones guardadas para checkout |
| `store_config` | Singleton (`CHECK id=1`) | Branding, Resend, redes sociales, toggles |
| `shipping_config` | Singleton (`CHECK id=1`) | Proveedor, tarifa, credenciales Skydropx |
| `payment_config` | Singleton (`CHECK id=1`) | Credenciales Wompi y MercadoPago |
| `themes` | Uno activo a la vez | Paleta CSS y tipografía inyectadas en `<head>` |
| `nav_items` | Árbol de 1 nivel | Menú de navegación con `nav_key` estable |
| `media_assets` | Inventario | Assets subidos con referencias `used_in` JSONB |

---

## Estructura de archivos

```
packages/database/
├── src/
│   ├── client.ts               ← createBrowserClient() + createServerClient()
│   ├── types.ts                ← Tipos de todas las tablas (Row, Insert, Update)
│   ├── index.ts                ← Re-exporta todo
│   ├── lib/
│   │   └── email.ts            ← sendShippingNotification, sendStatusNotification
│   └── queries/
│       ├── home.ts             ← getWebHomeData() — consolida home en una llamada
│       ├── content.ts          ← getPages, getPageWithSections, CRUD pages/sections/items
│       ├── nav.ts              ← getNavItems, CRUD nav_items
│       ├── products.ts         ← getProducts, getFeaturedProducts, getBestSellingProducts
│       ├── orders.ts           ← getOrders, getOrderById, createOrder, updateOrderStatus
│       ├── blog.ts             ← getBlogPosts, getBlogPostBySlug
│       ├── store-config.ts     ← getStoreConfig, updateStoreConfig
│       ├── shipping-config.ts  ← getShippingConfig, updateShippingConfig
│       ├── coupons.ts          ← validateCoupon (pura), CRUD, incrementCouponUsage
│       ├── cart.ts             ← getCartItems, upsertCartItem, clearCart, replaceCart
│       ├── themes.ts           ← getActiveTheme, setActiveTheme, CRUD
│       ├── media.ts            ← getMediaAssets, CRUD media_assets
│       └── variant-types.ts    ← getVariantTypes, CRUD
└── supabase/
    ├── migrations/
    │   ├── 01_schema.sql       ← ★ ESQUEMA CANÓNICO — usar para despliegue nuevo
    │   └── 1_initial_schema.sql … 20_integrity_and_indexes.sql  ← historial evolutivo
    └── seeds/
        ├── 01_config.sql       ← Tema, variantes, categorías, nav base
        └── 02_content.sql      ← Páginas, secciones e ítems CMS de VPS Coffee
```

---

## Despliegue desde cero

Para un entorno nuevo (staging, local, CI), ejecutar en orden en el SQL Editor de Supabase:

```sql
-- 1. Schema completo (tablas, índices, RLS, triggers, constraints)
\i packages/database/supabase/migrations/01_schema.sql

-- 2. Configuración base (tema, variantes, categorías, nav)
\i packages/database/supabase/seeds/01_config.sql

-- 3. Contenido CMS (páginas, secciones, ítems)
\i packages/database/supabase/seeds/02_content.sql
```

Los archivos `1_initial_schema.sql` … `20_integrity_and_indexes.sql` documentan la evolución histórica y se aplican automáticamente en entornos Supabase con historial existente. Para un despliegue limpio, usar únicamente `01_schema.sql` + los seeds — el resultado es idéntico.

---

## Integridad referencial

El schema aplica las siguientes garantías a nivel de base de datos, sin depender de la lógica de aplicación:

### Claves foráneas con política de borrado

| Relación | Política |
|----------|----------|
| `product_variants → products` | CASCADE |
| `cart_items → customers / products / product_variants` | CASCADE |
| `customer_addresses → customers` | CASCADE |
| `page_sections → pages` | CASCADE |
| `section_items → page_sections` | CASCADE |
| `orders → customers` | SET NULL — el pedido se conserva aunque se elimine el cliente |
| `nav_items → pages (page_key)` | SET NULL |
| `blog_posts → profiles (author_id)` | SET NULL |
| `media_assets → profiles (uploaded_by)` | SET NULL |

### CHECK constraints

```sql
-- Roles del panel admin
profiles.role IN ('super_admin','admin','vendedor','gestor_tienda','miembro','customer')

-- Estados del ciclo de vida del pedido
orders.status IN ('pending','processing','shipped','delivered','cancelled','exception')
orders.payment_status IN ('pending','approved','rejected','refunded')

-- Tipos de sección CMS (13 valores fijos)
page_sections.section_type IN (
  'hero','text','cards','faq','cta','testimonials','whatsapp',
  'services','featured_products','best_sellers','historia','blog_preview','newsletter'
)

-- Singletons de configuración
store_config.id = 1
payment_config.id = 1
shipping_config.id = 1
```

### Índices de rendimiento

```sql
-- Catálogo
products (category_id) WHERE category_id IS NOT NULL

-- Pedidos
orders (customer_email)
orders (status)
orders (created_at DESC)
orders (coupon_code) WHERE coupon_code IS NOT NULL

-- CMS (filtrado frecuente por habilitado + orden)
page_sections (page_key, enabled, order_index) WHERE enabled = true
page_sections (page_key, section_type)
section_items (section_id, enabled, order_index) WHERE enabled = true
section_items (section_id, item_type)

-- Media (búsquedas de contenedor JSONB)
media_assets.used_in  -- índice GIN para @> containment
```

### Triggers `updated_at`

Una función genérica `set_updated_at()` aplica el trigger en: `orders`, `customers`, `nav_items`, `page_sections`, `section_items`, `media_assets`, `themes`, `pages`, `store_config`.

---

## Seguridad y RLS

### Modelo de dos llaves

| Variable | Acceso | Dónde se usa |
|----------|--------|--------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Bypasea RLS — acceso total a todas las tablas | Solo en el backend (API routes, server components). **Nunca enviar al cliente.** |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Solo políticas `anon` | Frontend si se instancia un browser client |

En la práctica, el 95% de las queries del proyecto usan `createServerClient()` con `SERVICE_ROLE_KEY` desde API routes de Next.js, lo que elimina la necesidad de políticas anon elaboradas para escritura.

### Políticas anon (lectura pública)

```sql
-- Catálogo
SELECT en categories, products (active=true), product_variants (active=true), variant_types

-- CMS y navegación
SELECT en pages (enabled), nav_items (enabled), page_sections (enabled), section_items (enabled)

-- Blog
SELECT en blog_posts (published=true)

-- Configuración visual
SELECT en themes, media_assets

-- Checkout (tarifa antes del login)
SELECT en shipping_config

-- Newsletter
INSERT en newsletter_subscribers
```

### Sin políticas anon

`profiles`, `customers`, `orders`, `cart_items`, `customer_addresses`, `store_config`, `payment_config` — solo accesibles via `service_role`.

---

## Patrones de diseño

### Singleton de configuración

`store_config`, `payment_config` y `shipping_config` tienen `CHECK (id = 1)` y siempre contienen exactamente una fila. Las queries nunca hacen INSERT — solo UPDATE o upsert con `id=1`. Esto elimina el caso "sin configuración" y hace las queries triviales.

### Fail-open en el home

`getWebHomeData()` usa `Promise.all` con `.catch(() => [])` en cada sub-query. Si una falla, las demás siguen y el home renderiza parcialmente en lugar de retornar 500.

### Snapshot inmutable de pedidos

`orders.shipping_addr` (JSONB) guarda la dirección en el momento del pedido. No se actualiza si el cliente cambia `customer_addresses`. El historial de pedidos es siempre auditable.

### Claves estables para export/import

`nav_items.nav_key` (TEXT) y `page_sections.section_key` (UUID) son identificadores estables. El endpoint `/api/admin/export` los usa para producir snapshots idempotentes que se pueden reimportar sin crear duplicados.

### JSONB para datos variables

`section_items.metadata` y `page_sections.settings` almacenan campos opcionales que varían por tipo. Esto evita columnas nulas en masa en tablas polimórficas y permite agregar propiedades nuevas sin migraciones.

---

## Queries principales

```ts
// Home completo (paralelo, fail-open)
const { homeSections, featuredProducts, bestSellers, blogPosts, categories }
  = await getWebHomeData()

// Página con secciones e ítems anidados
const page = await getPageWithSections('nosotros')
// page.sections[0].items[0].metadata?.bg_color

// Validar cupón (función pura — sin side effects)
const result = validateCoupon(coupon, cartTotal)
// { valid: true, discount: 5000 } | { valid: false, reason: '...' }

// Cliente server-side desde una API route
const client = createServerClient()
const { data } = await client
  .from('section_items')
  .select('*')
  .eq('section_id', sectionId)
  .eq('enabled', true)
  .order('order_index')
```
