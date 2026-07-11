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
├── client.ts           ← Factories de cliente Supabase (browser / server)
├── types.ts            ← Tipos de todas las tablas (Row, Insert, Update)
├── queries/
│   ├── index.ts        ← Re-exporta todos los módulos de queries
│   ├── products.ts     ← Funciones de lectura/escritura de productos
│   ├── orders.ts       ← Funciones de órdenes
│   ├── blog.ts         ← Funciones de artículos del blog
│   ├── banners.ts      ← Funciones de banners
│   ├── shipping-config.ts ← Configuración de proveedor de envíos (singleton)
│   └── store-config.ts    ← Configuración de la tienda: logo, WhatsApp, nombre (singleton)
└── supabase/
    └── migrations/
        ├── 001_initial_schema.sql   ← Schema base + RLS + buckets + seed
        ├── 002_shipping_config.sql  ← Tabla shipping_config
        ├── 003_banners.sql          ← Tabla banners con imagen_url_mobile
        ├── 004_store_config.sql     ← Tabla store_config (singleton id=1)
        └── 005_store_config_logo.sql ← ADD COLUMN logo_url (idempotente)
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
  roast_level: RoastLevel          // 'light' | 'medium' | 'dark' | 'extra_dark'
  weight: string                   // '250g' | '500g' | '1kg' | '2kg'
  grind_type: GrindType | null     // 'whole_bean' | 'fine' | 'medium' | 'coarse' | null
  brew_method: BrewMethod | null
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
createOrder(input: OrderInput): Promise<Order>

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

Ejecutar en el SQL Editor de Supabase en este orden:

### `001_initial_schema.sql`

Crea:
- Tablas: `profiles`, `categories`, `products`, `product_variants`, `banners`, `orders`, `blog_posts`, `newsletter_subscribers`
- Trigger `on_auth_user_created` → crea `profiles` automáticamente al registrarse
- Políticas RLS en todas las tablas
- 4 buckets de Storage: `products`, `banners`, `blog`, `private`
- Seed data: 3 categorías, 2 banners de ejemplo

### `002_shipping_config.sql`

Crea:
- Tipo enum `shipping_provider_type` (`'fixed'`, `'skydropx'`)
- Tabla `shipping_config` con índice único `shipping_config_singleton`
- RLS: lectura pública, escritura solo para `service_role`
- Registro inicial: `provider = 'fixed'`, `fixed_rate = 8000`

### `003_banners.sql`

Agrega campo `image_url_mobile` a la tabla `banners` para soportar imágenes separadas en mobile y desktop.

### `004_store_config.sql`

Crea:
- Tabla `store_config` con `CHECK (id = 1)` para garantizar que sea singleton
- Columnas: `whatsapp_number`, `store_name`, `store_email`, `logo_url`, `updated_at`
- RLS: lectura pública, escritura service_role
- Inserta fila inicial `id=1` con `ON CONFLICT DO NOTHING`

### `005_store_config_logo.sql`

Agrega la columna `logo_url TEXT DEFAULT NULL` a `store_config` de forma idempotente (`ADD COLUMN IF NOT EXISTS`). Esta migración existe porque la tabla puede haberse creado sin esa columna en entornos que aplicaron la 004 antes de agregarla.

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

---

## Agregar una nueva tabla

1. Crear la migración en `supabase/migrations/00X_<nombre>.sql`
2. Agregar los tipos (Row/Insert/Update) en `src/types.ts`
3. Crear `src/queries/<tabla>.ts` con las funciones de acceso
4. Exportar desde `src/queries/index.ts`
5. Ejecutar `pnpm db:generate` para sincronizar tipos
6. Escribir tests en `src/queries/__tests__/<tabla>.test.ts`
