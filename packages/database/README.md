# packages/database — Capa de datos VPS Coffee

Paquete compartido que centraliza el cliente de Supabase, los tipos TypeScript del schema y las funciones de query para todas las apps del monorepo.

```
import { getProducts, getOrderById } from '@vps/database'
import type { Product, Order } from '@vps/database'
```

---

## Estructura

```
packages/database/src/
├── client.ts               ← Factories de cliente Supabase (browser / server)
├── types.ts                ← Tipos de todas las tablas (Row, Insert, Update)
├── queries/
│   ├── index.ts            ← Re-exporta todos los módulos de queries
│   ├── products.ts         ← Catálogo, variantes, slugs, featured
│   ├── orders.ts           ← createOrder, getAllOrders, updateOrderStatus, etc.
│   ├── blog.ts             ← Artículos, slugs, draft mode
│   ├── banners.ts          ← Banners por sección (hero, maquila, asesorias, services)
│   ├── shipping-config.ts  ← Proveedor de envíos + credenciales Skydropx (singleton)
│   ├── store-config.ts     ← Logo, WhatsApp, nombre, Resend, redes, mantenimiento (singleton)
│   ├── payment-config.ts   ← Wompi + MercadoPago (singleton)
│   ├── coupons.ts          ← getCoupons, validateCoupon (pura), CRUD, incrementCouponUsage
│   ├── testimonials.ts     ← getTestimonials(onlyActive), CRUD
│   ├── cart.ts             ← getCartItems, upsertCartItem, removeCartItem, clearCart, replaceCart
│   ├── sections.ts         ← getSectionSettings(), isSectionEnabled() (fail-open)
│   └── themes.ts           ← getThemes(), getActiveTheme(), createTheme(), updateTheme(), setActiveTheme(), deleteTheme()
└── supabase/
    └── migrations/         ← Ejecutar en orden en el SQL Editor de Supabase
        ├── 1_initial_schema.sql
        ├── 2_shipping_config.sql
        ├── 3_banner_mobile_image.sql
        ├── 4_store_config.sql
        ├── 5_payment_config.sql
        ├── 6_shipping_profiles.sql
        ├── 7_customers.sql
        ├── 8_customer_addresses.sql
        ├── 9_section_settings.sql
        ├── 10_coupons.sql
        ├── 11_testimonials.sql
        ├── 12_cart_items.sql
        ├── 13_themes.sql
        └── 14_product_variants_extended.sql
```

---

## Cliente Supabase

Se exportan dos factories según el contexto de ejecución:

```typescript
import { createBrowserClient, createServerClient } from '@vps/database'

// En un componente cliente (React)
const supabase = createBrowserClient()

// En un Server Component o Route Handler de Next.js
// Requiere la cookie store de next/headers
import { cookies } from 'next/headers'
const supabase = createServerClient(cookies())
```

Internamente usan `@supabase/supabase-js` con las variables de entorno `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_SERVICE_ROLE_KEY`.

---

## Tipos

Todos los tipos están definidos en `src/types.ts` y reflejan el schema de Supabase:

```typescript
// Patrón: Row (SELECT), Insert (INSERT), Update (PATCH)
type Product = {
  id: number
  name: string
  slug: string
  description: string | null
  category_id: number | null
  is_active: boolean
  is_featured: boolean
  created_at: string
}

type ProductVariant = {
  id: number
  product_id: number
  roast_level: RoastLevel | null   // heredado: 'light' | 'medium' | 'dark' | 'extra_dark'
  weight: string | null            // heredado: '250g' | '500g' | '1kg' | '2kg'
  grind_type: GrindType | null     // heredado: 'whole_bean' | 'fine' | 'medium' | 'coarse' | null
  brew_method: BrewMethod | null
  attributes: Record<string, string> | null  // sistema genérico: { color: 'Rojo', talla: 'M' }
  weight_kg: number | null         // para cotización real con Skydropx
  length_cm: number | null
  width_cm: number | null
  height_cm: number | null
  price: number
  stock: number
  is_available: boolean
}

type Order = {
  id: number
  order_number: string             // 'VPS-XXXX'
  user_id: string | null
  customer_email: string
  customer_name: string
  status: OrderStatus              // 'pending' | 'processing' | 'shipped' | ...
  items: OrderItem[]               // JSONB
  shipping_address: ShippingAddress // JSONB
  subtotal: number
  shipping_cost: number
  discount: number
  total: number
  payment_method: string | null
  tracking_number: string | null
  carrier_name: string | null      // transportadora elegida por el cliente (ej: 'Servientrega')
  skydropx_rate_id: string | null  // ID de tarifa Skydropx para crear la guía
  skydropx_quotation_id: string | null
  skydropx_shipment_id: string | null
  created_at: string
}

type ShippingConfig = {
  id: number
  provider: ShippingProviderType   // 'fixed' | 'skydropx'
  fixed_rate: number
  skydropx_client_id: string | null
  skydropx_client_secret: string | null
  skydropx_address_from_id: string | null
  skydropx_base_url: string
  updated_at: string
}

type StoreConfig = {
  id: number
  whatsapp_number: string | null   // 10–15 dígitos, ej. '573001234567'
  store_name: string               // por defecto 'VPS Coffee'
  store_email: string | null
  logo_url: string | null          // URL pública del bucket 'logos'
  updated_at: string
}
```

---

## Queries disponibles

### Productos

```typescript
// Catálogo activo (con variantes)
getProducts(filters?: { categorySlug?: string; roast?: string }): Promise<Product[]>

// Un producto por slug (con variantes y productos relacionados)
getProductBySlug(slug: string): Promise<Product | null>

// Productos destacados para la home
getFeaturedProducts(limit?: number): Promise<Product[]>

// Slugs para generateStaticParams
getProductSlugs(): Promise<{ slug: string }[]>
```

### Órdenes

```typescript
// Crear una nueva orden (asigna número correlativo VPS-XXXX)
// CreateOrderInput incluye carrier_name y skydropx_rate_id opcionales
createOrder(input: CreateOrderInput): Promise<Order>

// Obtener una orden por ID
getOrderById(id: number): Promise<Order | null>

// Historial de órdenes de un usuario
getOrdersByUser(userId: string): Promise<Order[]>

// Todas las órdenes para el admin (con filtro por status)
getAllOrders(status?: OrderStatus): Promise<Order[]>

// Actualizar el estado de una orden
updateOrderStatus(id: number, status: OrderStatus, trackingNumber?: string): Promise<Order>
```

### Blog

```typescript
// Lista de artículos publicados
getBlogPosts(params?: { category?: string; limit?: number }): Promise<BlogPost[]>

// Un artículo por slug
getBlogPostBySlug(slug: string): Promise<BlogPost | null>

// Artículo destacado (para preview en home)
getFeaturedBlogPost(): Promise<BlogPost | null>

// Slugs para generateStaticParams
getBlogSlugs(): Promise<{ slug: string }[]>
```

### Banners

```typescript
// Banners activos de una sección
getBanners(section: 'hero' | 'maquila' | 'asesorias'): Promise<Banner[]>
```

### Configuración de envíos

```typescript
// Lee el singleton (siempre devuelve un objeto — nunca lanza)
getShippingConfig(): Promise<ShippingConfig>

// Actualiza la configuración
updateShippingConfig(input: Partial<ShippingConfig>): Promise<ShippingConfig>
```

`getShippingConfig()` tiene un fallback seguro: si la tabla no existe o hay un error de conexión, devuelve un objeto con valores por defecto (`provider: 'fixed'`, `fixed_rate: 8000`).

### Configuración de la tienda

```typescript
// Lee el singleton; si hay error o tabla vacía devuelve DEFAULT_CONFIG
getStoreConfig(): Promise<StoreConfig>

// Upsert del registro id=1 — nunca falla si la fila ya existe
updateStoreConfig(input: UpdateStoreConfigInput): Promise<StoreConfig>

// Tipos de input
type UpdateStoreConfigInput = Partial<{
  whatsapp_number: string | null
  store_name: string
  store_email: string | null
  logo_url: string | null
}>
```

`getStoreConfig()` es llamada una vez por request desde los layouts `(public)/layout.tsx` y `(account)/layout.tsx`. El resultado se pasa como prop a `Navbar` y `Footer`, evitando consultas duplicadas a la BD.

---

## Migraciones

**14 archivos en total.** Ejecutar en el SQL Editor de Supabase en orden numérico:

### `1_initial_schema.sql`
Schema base: `profiles`, `categories`, `products`, `product_variants`, `banners`, `orders`, `blog_posts`, `newsletter_subscribers`. RLS habilitado. Buckets de Storage (`products`, `banners`, `blog`, `private`). Diseñado para Stack Auth (sin FK a `auth.users`, sin trigger de Supabase Auth).

### `2_shipping_config.sql`
Tabla `shipping_config` con enum `shipping_provider_type` (`fixed`/`skydropx`), tarifa fija, envío gratis configurable, credenciales Skydropx OAuth y **8 campos `origin_*`** para dirección de origen. Todo consolidado en una sola migración.

### `3_banner_mobile_image.sql`
Campo `image_url_mobile` en `banners` para imágenes separadas web/mobile.

### `4_store_config.sql`
Tabla `store_config` singleton (id=1) con branding, Resend (api_key + from_email), contenido legal (Markdown), redes sociales, modo mantenimiento y analytics. Todo consolidado.

### `5_payment_config.sql`
Tabla `payment_config` singleton con credenciales Wompi y MercadoPago.

### `6_shipping_profiles.sql`
Tabla `shipping_profiles` para perfiles de envío por zona.

### `7_customers.sql`
Tabla `customers` (mirror de compradores web desde Stack Auth). FK `orders.customer_id → customers.id`.

### `8_customer_addresses.sql`
Tabla `customer_addresses` (N direcciones por cliente) para pre-llenar checkout.

### `9_section_settings.sql`
Tabla `section_settings` para habilitar/deshabilitar secciones del home. Seed con secciones por defecto.

### `10_coupons.sql`
Tabla `coupons`: código, tipo (`percentage`/`fixed`), valor, mínimo, usos máximos, expiración.

### `11_testimonials.sql`
Tabla `testimonials`: autor, cargo, texto, avatar, rating (1-5), orden, activo.

### `12_cart_items.sql`
Tabla `cart_items` para sincronizar carrito de usuarios logueados (FK a `customers`).

### `13_themes.sql`
Tabla `themes` con paleta de colores hex y selección de fuentes. Unique index parcial en `is_active = true`.

### `14_product_variants_extended.sql`
Dos extensiones sobre `product_variants`:
- **Dimensiones físicas** (`weight_kg`, `length_cm`, `width_cm`, `height_cm`) para cotización real con Skydropx
- **Sistema genérico de variantes**: columna `variant_options JSONB` en `products` + `attributes JSONB` en `product_variants`; retrocompatible con campos heredados `roast`/`weight`/`grind`

---

## Regenerar tipos

Después de modificar el schema en Supabase:

```bash
# Desde la raíz del monorepo
pnpm db:generate
```

Esto ejecuta `supabase gen types typescript` y sobrescribe `src/types.ts`.

---

## Tests

Los tests mockean el cliente de Supabase para ser completamente independientes de la red:

```bash
cd packages/database
pnpm test
pnpm test:coverage
```

El mock está configurado en `jest.setup.ts`:

```typescript
jest.mock('./src/client', () => ({
  createServerClient: jest.fn(() => mockSupabaseClient),
}))
```

Archivos de test:

| Archivo | Casos | Cobertura |
|---------|-------|-----------|
| `queries/__tests__/products.test.ts` | 8 | Filtros, slug, featured, errores |
| `queries/__tests__/orders.test.ts` | 12 | Número correlativo, discount default, updateOrderStatus |
| `queries/__tests__/blog.test.ts` | 10 | Filtro categoría, limit, getFeaturedPost null-safe |
| `queries/__tests__/store-config.test.ts` | 10 | getStoreConfig: fallback DEFAULT_CONFIG, datos reales; updateStoreConfig: upsert id=1, errores |
| `queries/__tests__/coupons.test.ts` | 14 | validateCoupon: porcentaje, fijo, inactivo, expirado, usos, mínimo pedido |
| `queries/__tests__/themes.test.ts` | 14 | getThemes, getActiveTheme, createTheme (is_active=false forzado), setActiveTheme (dos ops), deleteTheme (guards) |

---

## Agregar una nueva tabla

1. Crear la migración en `supabase/migrations/15_<nombre>.sql` (siguiente número disponible)
2. Agregar los tipos (Row/Insert/Update) en `src/types.ts`
3. Crear `src/queries/<tabla>.ts` con las funciones de acceso
4. Exportar desde `src/queries/index.ts`
5. Ejecutar `pnpm db:generate` para sincronizar tipos
6. Escribir tests en `src/queries/__tests__/<tabla>.test.ts`
