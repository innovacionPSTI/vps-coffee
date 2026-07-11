# VPS Coffee — Estado del Proyecto
> **Última actualización:** Julio 2026 · **Stack:** Next.js 15 · Supabase · Tailwind · Turborepo

---

## ✅ Implementado

### Monorepo (raíz)
- `package.json` con Turborepo + pnpm workspaces
- `turbo.json` con pipelines build/dev/lint
- `pnpm-workspace.yaml`
- `.gitignore` y `.prettierrc`
- `.env.example` con todas las variables documentadas

### `packages/config`
- `tailwind.config.ts` — paleta VPS completa (colores, fuentes, sombras, borderRadius arch)
- `tsconfig.json` compartido

### `packages/database`
- `src/types.ts` — tipos TypeScript completos de todas las tablas
- `src/client.ts` — `createBrowserClient()` y `createServerClient()`
- `src/queries/` — products, orders, blog, banners, shipping-config, **store-config**
- `supabase/migrations/001_initial_schema.sql` — schema completo con RLS, triggers, seed data y buckets de storage
- `supabase/migrations/002_shipping_config.sql` — tabla `shipping_config` con soporte multi-proveedor
- `supabase/migrations/003_banners.sql` — tabla `banners` con campos de imagen web/mobile
- `supabase/migrations/004_store_config.sql` — tabla `store_config` singleton (id=1) con whatsapp, nombre, email, logo
- `supabase/migrations/005_store_config_logo.sql` — añade columna `logo_url` a `store_config` (idempotente)

### `packages/ui`
- `Button`, `Badge`, `ProductCard`, `Spinner` — componentes base con variantes VPS
- `cn()` utility (clsx + tailwind-merge)

### `apps/web` — Sitio público
**Setup:**
- `package.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `tsconfig.json`
- `globals.css` con fuentes Ahsing/Geeeki, variables CSS, utilidades arch/scrollbar
- `app/layout.tsx` con metadata SEO global

**Layout:**
- `Navbar` — sticky con scroll, carrito badge, hamburger mobile; acepta prop `logoUrl` desde layout servidor
- `Footer` — links, redes sociales, WhatsApp; acepta props `logoUrl` y `whatsapp` desde layout servidor

**Layouts de grupo (server components):**
- `(public)/layout.tsx` — async, llama `getStoreConfig()` una vez, pasa `logoUrl` y `whatsapp_number` a Navbar y Footer
- `(account)/layout.tsx` — idem, misma configuración

**Store:**
- `store/cart.ts` — Zustand + localStorage, addItem/removeItem/updateQty/subtotal

**Páginas:**
| Ruta | Archivo | Modo |
|------|---------|------|
| `/` | `app/(public)/page.tsx` | ISR 60s |
| `/tienda` | `app/(public)/tienda/page.tsx` | ISR 60s |
| `/tienda/[slug]` | `app/(public)/tienda/[slug]/page.tsx` | `force-dynamic` (nueva ruta visible inmediatamente) |
| `/maquila` | `app/(public)/maquila/page.tsx` | Estático, async (WhatsApp desde BD) |
| `/asesorias` | `app/(public)/asesorias/page.tsx` | Estático, async (WhatsApp desde BD) |
| `/blog` | `app/(public)/blog/page.tsx` | ISR 60s |
| `/blog/[slug]` | `app/(public)/blog/[slug]/page.tsx` | SSG+ISR |
| `/nosotros` | `app/(public)/nosotros/page.tsx` | Estático |
| `/carrito` | `app/carrito/page.tsx` | Client |
| `/checkout` | `app/checkout/page.tsx` | 3 pasos |
| `/checkout/confirmacion` | `app/checkout/confirmacion/page.tsx` | async, WhatsApp desde BD |
| `/mi-cuenta` | `app/(account)/mi-cuenta/page.tsx` | Skeleton |
| `/mi-cuenta/pedidos` | `app/(account)/mi-cuenta/pedidos/page.tsx` | ✅ |

> **Nota Next.js 15:** En rutas dinámicas `params` es un `Promise`. Se debe tipar como `params: Promise<{ slug: string }>` y usar `const { slug } = await params`.

**API Routes:**
| Ruta | Función |
|------|---------|
| `POST /api/checkout` | Crea orden en Supabase |
| `POST /api/newsletter` | Upsert suscriptor |
| `POST /api/webhooks/skydropx` | Actualiza estado pedido |
| `POST /api/shipping/rates` | Cotiza envío multi-proveedor |

**Componentes:**
- `HeroCarousel` — autoplay 5s, fade, dots, flechas; usa `<picture>` + `<source media="(max-width: 768px)">` para mostrar imagen mobile en móvil e imagen desktop en escritorio
- `FeaturedProducts` — grid 3 col, add to cart
- `ServicesSection` — async, llama `Promise.all` para URLs de WhatsApp desde BD
- `NewsletterSection` — POST a API route
- `CartDrawer` — slide-in desde derecha, overlay, Escape key
- `ShopClient` — filtros tueste/peso/método, sort, grid
- `ProductDetail` — galería, selector variantes, add to cart
- `lib/whatsapp.ts` — async, lee número desde `getStoreConfig()` en BD; fallback `573XXXXXXXXX`
- `lib/skydropx/auth.ts` — OAuth 2.0 con cache de token
- `lib/skydropx/quotations.ts` — cotizar + polling + cálculo de parcel

### `apps/admin` — Panel de administración
**Setup:**
- `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`
- `globals.css` con fuentes VPS
- `app/layout.tsx`, redirect `/` → `/dashboard`

**Layout:**
- `AdminSidebar` — sidebar `#614A2A`, nav activo, todos los links
- `AdminTopbar` — barra superior con búsqueda y avatar

**Componentes:**
- `ImageUpload` — drag & drop, preview, upload a Supabase Storage; prop `onUploadStateChange` notifica al padre cuando hay upload en progreso; prop `sizeClass` para controlar dimensiones (ej. `w-48 h-48` para logo cuadrado)

**Páginas implementadas:**
| Ruta | Contenido |
|------|-----------|
| `/dashboard` | Stats (ventas hoy, pedidos pendientes, productos), tabla pedidos recientes |
| `/productos` | Tabla CRUD con precio rango, stock badge, estado |
| `/productos/nuevo` | Formulario de creación con variantes, imágenes, SEO |
| `/productos/[id]` | Formulario de edición |
| `/pedidos` | Tabla con filtros por estado |
| `/pedidos/[id]` | Detalle completo: timeline, items, cliente, dirección, pago, tracking |
| `/banners` | Vista previa de slides; cada banner soporta imagen web + imagen mobile |
| `/categorias` | CRUD de categorías |
| `/blog` | Tabla artículos con estado publicado/borrador |
| `/configuracion` | Pasarelas de pago, Skydropx, Resend; **WhatsApp y Logo desde `store_config`** |

**API Admin:**
| Ruta | Función |
|------|---------|
| `POST /api/admin/products` | Crea producto con variantes e **imágenes** (bug fix: ya no ignora el campo `images` del body) |
| `GET/PATCH /api/admin/products/[id]` | Edita producto y variantes |
| `DELETE /api/admin/products/[id]` | Elimina producto y variantes (FK) |
| `PATCH /api/admin/orders/[id]/status` | Actualiza estado de orden |
| `GET /api/admin/shipping` | Lee config de envíos (client_secret enmascarado) |
| `PATCH /api/admin/shipping` | Guarda config de envíos con validación |
| `GET /api/admin/config` | Lee `store_config` (WhatsApp, nombre, email, logo) |
| `PATCH /api/admin/config` | Guarda `store_config`; valida que WhatsApp tenga 10–15 dígitos |
| `POST /api/admin/upload` | Sube archivo a Supabase Storage; **auto-crea el bucket** si no existe |
| `DELETE /api/admin/upload` | Elimina archivo de Storage |

---

## 🔧 Pendiente de implementar

### Prioridad alta
- [ ] **Integración real de pagos Wompi** — widget JS embebido en checkout, webhook PATCH `/api/webhooks/wompi`
- [ ] **Integración real de pagos MercadoPago** — SDK React Brick, webhook
- [ ] **Stack Auth** — flujo login/registro, middleware de protección de rutas, `useUser()` hook
- [ ] **Formulario CRUD de blog** (`/admin/blog/nuevo` y `/admin/blog/[id]`) — editor Markdown/rich text

### Prioridad media
- [ ] **Middleware de autenticación** — proteger `/mi-cuenta/*` y `admin.vpscoffee.com/*` con roles
- [ ] **Emails transaccionales con Resend** — confirmación de pedido, envío, bienvenida
- [ ] **Creación de shipment Skydropx** tras pago confirmado (`lib/skydropx/shipments.ts`)
- [ ] **Modal de despacho masivo** en admin (pickups Skydropx)
- [ ] **SEO:** `sitemap.xml`, `robots.txt`, Open Graph por página
- [ ] **Página 404** personalizada
- [ ] **Gestión de usuarios y roles** en admin (`/admin/usuarios`)
- [ ] **Editor de banners** — formulario de edición/reordenamiento de slides

### Prioridad baja
- [ ] **Cupones de descuento** — tabla `coupons` + validación en checkout
- [ ] **Tracking en Mi Cuenta** — mostrar timeline de Skydropx
- [ ] **Preview de blog** con Next.js Draft Mode
- [ ] **Vercel Analytics** o Plausible
- [ ] **Responsive audit** mobile-first completo

---

## 🚀 Cómo continuar

### 1. Instalar dependencias
```bash
cd vps-coffee
pnpm install
```

### 2. Copiar fuentes
Copiar `typogama-ahsing.otf` y `Geeeki-Regular.otf` a:
- `apps/web/public/fonts/`
- `apps/admin/public/fonts/`

### 3. Configurar variables de entorno
```bash
cp .env.example apps/web/.env.local
cp .env.example apps/admin/.env.local
# Editar ambos archivos con las keys reales
```

### 4. Ejecutar migraciones SQL en Supabase
Abrir el SQL Editor de Supabase y ejecutar en orden:
```
packages/database/supabase/migrations/001_initial_schema.sql
packages/database/supabase/migrations/002_shipping_config.sql
packages/database/supabase/migrations/003_banners.sql
packages/database/supabase/migrations/004_store_config.sql
packages/database/supabase/migrations/005_store_config_logo.sql
```

### 5. Levantar el proyecto
```bash
pnpm dev
# Web:   http://localhost:3000
# Admin: http://localhost:3001
```

---

## 📁 Estructura de archivos

```
vps-coffee/
├── apps/
│   ├── web/src/
│   │   ├── app/
│   │   │   ├── (public)/
│   │   │   │   ├── layout.tsx          — async; carga store_config, pasa logoUrl+whatsapp
│   │   │   │   ├── page.tsx            — Home
│   │   │   │   ├── tienda/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [slug]/page.tsx — force-dynamic; params: Promise<{slug}>
│   │   │   │   ├── maquila/page.tsx    — async; WhatsApp desde BD
│   │   │   │   ├── asesorias/page.tsx  — async; WhatsApp desde BD
│   │   │   │   ├── blog/
│   │   │   │   └── nosotros/
│   │   │   ├── (account)/
│   │   │   │   └── layout.tsx          — async; carga store_config
│   │   │   ├── carrito/
│   │   │   ├── checkout/
│   │   │   │   └── confirmacion/       — async; WhatsApp desde BD
│   │   │   └── api/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.tsx          — acepta prop logoUrl
│   │   │   │   └── Footer.tsx          — acepta props logoUrl y whatsapp
│   │   │   ├── home/
│   │   │   │   ├── HeroCarousel.tsx    — <picture> con imagen mobile/desktop
│   │   │   │   ├── FeaturedProducts.tsx
│   │   │   │   ├── ServicesSection.tsx — async; WhatsApp desde BD
│   │   │   │   └── NewsletterSection.tsx
│   │   │   ├── shop/
│   │   │   └── cart/
│   │   ├── store/cart.ts
│   │   └── lib/
│   │       ├── whatsapp.ts             — async; lee desde BD
│   │       └── skydropx/
│   │
│   └── admin/src/
│       ├── app/
│       │   ├── dashboard/
│       │   ├── productos/
│       │   │   ├── page.tsx            — listado
│       │   │   ├── nuevo/page.tsx      — formulario crear
│       │   │   ├── [id]/page.tsx       — formulario editar
│       │   │   └── ProductForm.tsx     — form compartido; upload tracking, validación cliente
│       │   ├── pedidos/
│       │   ├── banners/
│       │   ├── categorias/
│       │   ├── blog/
│       │   ├── configuracion/
│       │   │   ├── page.tsx            — carga shipping + store_config
│       │   │   └── StoreConfigForm.tsx — WhatsApp, logo, nombre, email
│       │   └── api/admin/
│       │       ├── products/           — POST (crea con imágenes), GET/PATCH/DELETE [id]
│       │       ├── orders/[id]/status/
│       │       ├── shipping/           — GET+PATCH con validación y secret masking
│       │       ├── config/             — GET+PATCH store_config
│       │       └── upload/             — POST/DELETE con auto-create de bucket
│       └── components/
│           ├── layout/                 — AdminSidebar, AdminTopbar
│           └── ImageUpload.tsx         — drag & drop; onUploadStateChange callback
│
├── packages/
│   ├── ui/src/
│   ├── database/src/
│   │   ├── queries/
│   │   │   ├── products.ts
│   │   │   ├── orders.ts
│   │   │   ├── blog.ts
│   │   │   ├── banners.ts
│   │   │   ├── shipping-config.ts
│   │   │   └── store-config.ts         — getStoreConfig / updateStoreConfig
│   │   └── supabase/migrations/
│   │       ├── 001_initial_schema.sql
│   │       ├── 002_shipping_config.sql
│   │       ├── 003_banners.sql
│   │       ├── 004_store_config.sql
│   │       └── 005_store_config_logo.sql
│   └── config/
│
├── .env.example
├── turbo.json
└── pnpm-workspace.yaml
```

---

## 🔑 Variables de entorno necesarias

Ver `.env.example` en la raíz del proyecto para la lista completa.
Las más críticas para arrancar:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

> **Nota:** El número de WhatsApp ya **no** se configura via variable de entorno. Se gestiona desde el panel admin en `/configuracion` y se persiste en la tabla `store_config`.

---

*Proyecto VPS Coffee Roasting House · Parquesoft TI · Julio 2026*
