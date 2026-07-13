# VPS Coffee Roasting House — Plataforma Digital

> E-commerce de café de especialidad + servicios B2B de maquila y asesoría + panel de administración.  
> **Desarrollado por [Parquesoft TI](mailto:produccion@parquesoftti.com)**

---

## Tabla de contenido

1. [Visión general](#1-visión-general)
2. [Stack tecnológico](#2-stack-tecnológico)
3. [Arquitectura del monorepo](#3-arquitectura-del-monorepo)
4. [Estructura de carpetas](#4-estructura-de-carpetas)
5. [Requisitos previos](#5-requisitos-previos)
6. [Instalación y setup local](#6-instalación-y-setup-local)
7. [Variables de entorno](#7-variables-de-entorno)
8. [Base de datos](#8-base-de-datos)
9. [Scripts disponibles](#9-scripts-disponibles)
10. [Rutas y páginas](#10-rutas-y-páginas)
11. [API Reference](#11-api-reference)
12. [Arquitectura de proveedores de envío](#12-arquitectura-de-proveedores-de-envío)
13. [Design System](#13-design-system)
14. [Testing](#14-testing)
15. [Despliegue](#15-despliegue)
16. [Flujos de negocio](#16-flujos-de-negocio)
17. [Guía de contribución](#17-guía-de-contribución)
18. [Estado del proyecto](#18-estado-del-proyecto)

---

## 1. Visión general

VPS Coffee Roasting House es una tostadora de café de especialidad colombiana. Esta plataforma cubre tres líneas de negocio:

| Línea | Canal | Descripción |
|-------|-------|-------------|
| **E-commerce** | `/tienda` | Venta directa de café en grano y molido al consumidor final |
| **Maquila** | `/maquila` | Servicio de tueste a terceros (marcas, cafeterías) |
| **Asesorías** | `/asesorias` | Consultoría profesional en catación, perfiles y formación |

El proyecto se compone de **dos aplicaciones Next.js** en un monorepo Turborepo: el sitio público (`apps/web`) y el panel de administración (`apps/admin`), más paquetes compartidos de UI, base de datos y configuración.

---

## 2. Stack tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | Next.js (App Router) | 15 |
| Lenguaje | TypeScript | 5.4 |
| Monorepo | Turborepo + pnpm workspaces | 2.0 / 9.0 |
| Base de datos | Supabase (PostgreSQL) | — |
| ORM / cliente | @supabase/supabase-js + @supabase/ssr | 2.x |
| Autenticación | Stack Auth | — |
| Estado global | Zustand (+ persist middleware) | 4.5 |
| Estilos | Tailwind CSS | 3.4 |
| Formularios | React Hook Form + Zod | 7.x / 3.x |
| Envíos | Capa propia multi-proveedor (Skydropx / tarifa fija) | — |
| Pagos | Wompi + MercadoPago *(widget pendiente)* | — |
| Emails | Resend *(scaffolded)* | 3.x |
| Testing | Jest + Testing Library + ts-jest | 29.x |
| Linting / formato | ESLint + Prettier | — |

---

## 3. Arquitectura del monorepo

```
vps-coffee/                    ← raíz del monorepo (Turborepo)
├── apps/
│   ├── web/                   ← Sitio público  (puerto 3000)
│   └── admin/                 ← Panel admin    (puerto 3001)
└── packages/
    ├── ui/                    ← Componentes React compartidos
    ├── database/              ← Tipos, cliente Supabase, queries
    └── config/                ← tailwind.config.ts y tsconfig.json base
```

### Flujo de dependencias

```
apps/web   ──┐
             ├──▶  packages/ui
apps/admin ──┘
             ├──▶  packages/database
             └──▶  packages/config
```

Los `packages/*` son consumidos directamente como workspace packages (sin compilar a dist). Turborepo cachea las tareas de build/lint/test para evitar trabajo redundante.

---

## 4. Estructura de carpetas

```
vps-coffee/
├── apps/
│   ├── web/
│   │   └── src/
│   │       ├── app/
│   │       │   ├── (public)/               ← Grupo de rutas públicas
│   │       │   │   ├── page.tsx            ← Home  /
│   │       │   │   ├── tienda/             ← /tienda  y  /tienda/[slug]
│   │       │   │   ├── maquila/            ← /maquila
│   │       │   │   ├── asesorias/          ← /asesorias
│   │       │   │   ├── blog/               ← /blog  y  /blog/[slug]
│   │       │   │   └── nosotros/           ← /nosotros
│   │       │   ├── (account)/              ← Área privada del cliente
│   │       │   │   └── mi-cuenta/          ← /mi-cuenta  y  /mi-cuenta/pedidos
│   │       │   ├── carrito/                ← /carrito
│   │       │   ├── checkout/               ← /checkout  y  /checkout/confirmacion
│   │       │   └── api/
│   │       │       ├── checkout/           ← POST /api/checkout
│   │       │       ├── newsletter/         ← POST /api/newsletter
│   │       │       ├── shipping/rates/     ← POST /api/shipping/rates
│   │       │       └── webhooks/skydropx/  ← POST /api/webhooks/skydropx
│   │       ├── components/
│   │       │   ├── layout/                 ← Navbar, Footer
│   │       │   ├── cart/                   ← CartDrawer
│   │       │   ├── home/                   ← HeroCarousel, FeaturedProducts, etc.
│   │       │   └── shop/                   ← ShopClient, ProductDetail
│   │       ├── lib/
│   │       │   ├── shipping/               ← Capa multi-proveedor de envíos
│   │       │   │   ├── types.ts            ← ShippingProvider interface + calculateParcel
│   │       │   │   ├── index.ts            ← getShippingProvider() factory
│   │       │   │   └── providers/
│   │       │   │       ├── fixed-rate.ts
│   │       │   │       └── skydropx/
│   │       │   │           ├── auth.ts     ← OAuth 2.0, cache por clientId
│   │       │   │           └── index.ts    ← SkydropxProvider
│   │       │   └── whatsapp.ts
│   │       └── store/
│   │           └── cart.ts                 ← Zustand + localStorage persist
│   │
│   └── admin/
│       └── src/
│           ├── app/
│           │   ├── (dashboard)/            ← Layout con sidebar
│           │   │   ├── layout.tsx
│           │   │   ├── dashboard/          ← Métricas y pedidos recientes
│           │   │   ├── productos/          ← CRUD catálogo
│           │   │   ├── pedidos/            ← Gestión de órdenes
│           │   │   ├── banners/            ← Gestión de banners hero
│           │   │   ├── blog/               ← Gestión de artículos
│           │   │   └── configuracion/      ← Proveedor de envíos, pasarelas, etc.
│           │   └── api/admin/
│           │       ├── orders/[id]/status/ ← PATCH status de orden
│           │       └── shipping/           ← GET/PATCH shipping_config
│           └── components/
│               └── layout/                 ← AdminSidebar, AdminTopbar
│
└── packages/
    ├── ui/src/
    │   ├── button.tsx
    │   ├── badge.tsx
    │   ├── product-card.tsx
    │   ├── spinner.tsx
    │   └── cn.ts                           ← clsx + tailwind-merge
    ├── database/src/
    │   ├── types.ts                        ← Tipos de todas las tablas
    │   ├── client.ts                       ← createBrowserClient / createServerClient
    │   ├── queries/
    │   │   ├── products.ts, orders.ts, blog.ts, banners.ts
    │   │   ├── shipping-config.ts, store-config.ts, payment-config.ts
    │   │   ├── coupons.ts, testimonials.ts, cart.ts
    │   │   ├── sections.ts                 ← isSectionEnabled (fail-open)
    │   │   └── themes.ts                   ← getActiveTheme, setActiveTheme, etc.
    │   └── supabase/migrations/            ← 1_initial_schema.sql … 14_product_variants_extended.sql
    └── config/
        ├── tailwind.config.ts              ← Design system VPS (colores, fuentes, etc.)
        └── tsconfig.json                   ← Configuración TypeScript base
```

---

## 5. Requisitos previos

| Herramienta | Versión mínima | Instalación |
|-------------|---------------|-------------|
| Node.js | 20 LTS | [nodejs.org](https://nodejs.org) |
| pnpm | 9.x | `npm install -g pnpm@9` |
| Git | 2.x | — |
| Cuenta Supabase | — | [supabase.com](https://supabase.com) |

> **Fuentes tipográficas:** El proyecto usa `typogama-ahsing.otf` (display/hero) y `Geeeki-Regular.otf` (UI/body). Estas fuentes deben copiarse manualmente a `apps/web/public/fonts/` y `apps/admin/public/fonts/` antes de levantar el proyecto.

---

## 6. Instalación y setup local

### Paso 1 — Clonar e instalar dependencias

```bash
git clone <repo-url> vps-coffee
cd vps-coffee
pnpm install
```

### Paso 2 — Copiar fuentes tipográficas

```bash
# Copiar typogama-ahsing.otf y Geeeki-Regular.otf en:
apps/web/public/fonts/
apps/admin/public/fonts/
```

### Paso 3 — Configurar variables de entorno

```bash
cp .env.example apps/web/.env.local
cp .env.example apps/admin/.env.local
# Editar ambos archivos con las claves reales
```

Ver sección [7. Variables de entorno](#7-variables-de-entorno) para el detalle de cada variable.

### Paso 4 — Aplicar migraciones en Supabase

En el **SQL Editor** de tu proyecto Supabase, ejecutar en orden:

Abrir el **SQL Editor** de Supabase y ejecutar los archivos en este orden:

```
packages/database/supabase/migrations/1_initial_schema.sql
packages/database/supabase/migrations/2_shipping_config.sql
packages/database/supabase/migrations/3_banner_mobile_image.sql
packages/database/supabase/migrations/4_store_config.sql
packages/database/supabase/migrations/5_payment_config.sql
packages/database/supabase/migrations/6_shipping_profiles.sql
packages/database/supabase/migrations/7_customers.sql
packages/database/supabase/migrations/8_customer_addresses.sql
packages/database/supabase/migrations/9_section_settings.sql
packages/database/supabase/migrations/10_coupons.sql
packages/database/supabase/migrations/11_testimonials.sql
packages/database/supabase/migrations/12_cart_items.sql
packages/database/supabase/migrations/13_themes.sql
packages/database/supabase/migrations/14_product_variants_extended.sql
```

### Paso 5 — Levantar el proyecto

```bash
pnpm dev
# Web:   http://localhost:3000
# Admin: http://localhost:3001
```

### Paso 6 — (Opcional) Regenerar tipos de Supabase

Después de modificar el schema de la base de datos:

```bash
pnpm db:generate
```

---

## 7. Variables de entorno

Todas las variables se definen en `.env.local` dentro de cada app. La plantilla completa está en `.env.example`.

### Variables críticas para arrancar

| Variable | App | Descripción |
|----------|-----|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | web + admin | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | web + admin | Clave anónima (cliente) |
| `SUPABASE_SERVICE_ROLE_KEY` | web + admin | Clave de servicio (solo servidor) |

> **Nota:** El número de WhatsApp ya **no** se configura como variable de entorno. Se gestiona desde el panel admin en `/configuracion` y se persiste en la tabla `store_config`.

### Autenticación (Stack Auth) — *pendiente de integrar*

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_STACK_PROJECT_ID` | ID del proyecto en Stack Auth |
| `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY` | Clave pública |
| `STACK_SECRET_SERVER_KEY` | Clave secreta del servidor |

### Pasarelas de pago — *pendiente de integrar widget*

| Variable | Descripción |
|----------|-------------|
| `WOMPI_PUBLIC_KEY` | Clave pública Wompi |
| `WOMPI_PRIVATE_KEY` | Clave privada Wompi |
| `WOMPI_EVENTS_SECRET` | Secret para validar webhooks Wompi |
| `MERCADOPAGO_ACCESS_TOKEN` | Token de acceso MercadoPago |
| `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` | Clave pública MercadoPago |

> **Importante:** Las credenciales de Skydropx ya **no se configuran** en `.env`. Se gestionan desde el panel de administración en `/configuracion` y se guardan en la tabla `shipping_config` de Supabase.

### Emails (Resend) — *pendiente de integrar*

| Variable | Descripción |
|----------|-------------|
| `RESEND_API_KEY` | Clave de la API de Resend |
| `RESEND_FROM_EMAIL` | Email de remitente (ej: `pedidos@vpscoffee.com`) |

### URLs y modo mantenimiento

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_SITE_URL` | URL pública del sitio (`https://vpscoffee.com`) |
| `NEXT_PUBLIC_ADMIN_URL` | URL del admin (`https://admin.vpscoffee.com`) |
| `MAINTENANCE_MODE` | `true` / `false` |

---

## 8. Base de datos

### Diagrama de tablas

```
auth.users (Supabase Auth)
    │
    └──▶ profiles            ← rol, nombre, teléfono
             │
             └──▶ orders     ← pedidos del cliente

categories ◀── products ──▶ product_variants
                              (roast × weight × grind × brew_method × price × stock)

banners                       ← slides del hero y secciones (imagen web + mobile)
blog_posts                    ← artículos del blog
newsletter_subscribers        ← lista de correos
shipping_config               ← proveedor de envíos + credenciales (singleton)
store_config                  ← identidad de la tienda: logo, WhatsApp, nombre, email (singleton)
```

### Tablas principales

| Tabla | Descripción | RLS |
|-------|-------------|-----|
| `profiles` | Perfil de usuario extendido (rol, teléfono) | Cada usuario ve el suyo; admins ven todos |
| `categories` | Categorías de productos | Lectura pública; escritura admin |
| `products` | Catálogo de cafés | Lectura pública (activos); escritura admin/editor |
| `product_variants` | Combinaciones tueste × peso × molienda | Lectura pública (activos); escritura admin/editor |
| `orders` | Pedidos con estado, items JSONB, datos de envío | Clientes ven los suyos; admins ven todos |
| `banners` | Slides del carrusel y secciones de servicios | Lectura pública (activos); escritura admin/editor |
| `blog_posts` | Artículos del blog | Lectura pública (publicados); escritura admin/editor |
| `newsletter_subscribers` | Suscriptores del boletín | Solo admins |
| `shipping_config` | Proveedor activo + credenciales (singleton) | Lectura pública; escritura service_role |
| `store_config` | Logo, WhatsApp, nombre y email de la tienda (singleton) | Lectura pública; escritura service_role |

### Roles de usuario

| Rol | Acceso |
|-----|--------|
| `super_admin` | Todo, incluida gestión de usuarios y roles |
| `admin` | Pedidos, productos, blog, banners, configuración |
| `editor` | Blog, banners, lectura de pedidos |
| `customer` | Solo sus propios pedidos y perfil |

### Trigger automático

Al registrarse un usuario (`auth.users`), el trigger `on_auth_user_created` crea automáticamente su fila en `profiles` con `role = 'customer'`.

### Storage buckets

| Bucket | Acceso | Uso |
|--------|--------|-----|
| `products` | Público | Imágenes de productos |
| `banners` | Público | Imágenes de banners y secciones |
| `blog` | Público | Imágenes de portada de artículos |
| `logos` | Público | Logo de la tienda (desde `/configuracion`) |
| `private` | Privado | Guías de envío (labels PDF) |

> **Auto-creación de buckets:** `POST /api/admin/upload` verifica si el bucket existe y lo crea automáticamente con acceso público si no existe. Esto evita errores "Bucket not found" al subir la primera imagen a un bucket nuevo.

---

## 9. Scripts disponibles

### Desde la raíz del monorepo

```bash
pnpm dev              # Levanta web (3000) y admin (3001) en paralelo
pnpm build            # Compila todas las apps (con caché Turborepo)
pnpm lint             # Lint en todos los packages
pnpm format           # Formatea con Prettier
pnpm db:generate      # Regenera tipos TypeScript desde el schema de Supabase
```

### Por app específica

```bash
cd apps/web
pnpm dev              # Solo el sitio público
pnpm test             # Ejecuta tests
pnpm test:watch       # Tests en modo watch (TDD)
pnpm test:coverage    # Tests con reporte de cobertura HTML
pnpm type-check       # Verifica tipos sin compilar

cd apps/admin
pnpm dev              # Solo el panel admin
pnpm test             # Tests del admin

cd packages/database
pnpm test             # Tests de las queries de DB
```

---

## 10. Rutas y páginas

### Sitio público (`apps/web` — puerto 3000)

| Ruta | Renderizado | Descripción |
|------|-------------|-------------|
| `/` | ISR 60s | Home: hero carrusel, productos destacados, servicios, blog preview, newsletter |
| `/tienda` | ISR 60s | Catálogo con filtros por tueste/peso/método y ordenamiento |
| `/tienda/[slug]` | `force-dynamic` | Detalle de producto con galería, selector de variantes, productos relacionados. Dinámico para que rutas nuevas sean visibles inmediatamente. |
| `/maquila` | Estático | Servicio de maquila con FAQ y CTA WhatsApp |
| `/asesorias` | Estático | Servicios de asesoría con formulario → WhatsApp |
| `/blog` | ISR 60s | Listado de artículos con filtro por categoría |
| `/blog/[slug]` | SSG + ISR 60s | Artículo completo con artículos relacionados |
| `/nosotros` | Estático | Historia de la marca |
| `/carrito` | Client-side | Resumen del carrito, editar cantidades, cupón |
| `/checkout` | Client-side | Proceso de 3 pasos: Contacto → Envío → Pago |
| `/checkout/confirmacion` | Client-side | Confirmación con número de orden |
| `/mi-cuenta` | Protegida* | Dashboard: pedidos activos y datos personales |
| `/mi-cuenta/pedidos` | Protegida* | Historial de pedidos con estado y tracking |

*Requiere integración de Stack Auth (pendiente).

### Panel de administración (`apps/admin` — puerto 3001)

| Ruta | Descripción |
|------|-------------|
| `/dashboard` | Métricas: ventas del día, pedidos pendientes, productos activos |
| `/productos` | Listado de catálogo con precios, stock y estado |
| `/pedidos` | Tabla de órdenes filtrable por estado |
| `/pedidos/[id]` | Detalle: timeline de estados, items, cliente, tracking, cambio de estado |
| `/banners` | Preview de slides del hero y secciones de servicios |
| `/blog` | Tabla de artículos con estado publicado/borrador |
| `/configuracion` | Proveedor de envíos, pasarelas de pago, Resend; **logo y WhatsApp desde `store_config`** |
| `/categorias` | CRUD de categorías de producto |
| `/productos/nuevo` | Formulario de creación de producto con variantes e imágenes |
| `/productos/[id]` | Formulario de edición de producto |

---

## 11. API Reference

### Sitio público

#### `POST /api/checkout`

Crea una orden en Supabase al finalizar el checkout.

**Body:**
```json
{
  "email": "string (requerido)",
  "name": "string (requerido)",
  "phone": "string",
  "address": {
    "street": "string (requerido)",
    "city": "string",
    "department": "string",
    "postal_code": "string"
  },
  "items": [
    { "variantId": 10, "productName": "...", "variantLabel": "...", "price": 45000, "qty": 2, "weight": "500g" }
  ],
  "subtotal": 90000,
  "shipping_cost": 8000,
  "total": 98000,
  "payment_method": "wompi | mercadopago",
  "shipping_rate": {
    "id": "rate-abc123",
    "carrier_name": "Servientrega",
    "service_name": "Entrega estándar",
    "days": 3,
    "total_price": 12000
  }
}
```

**Respuesta 200:**
```json
{ "order_number": "VPS-0042", "order_id": 42 }
```

**Errores:** `400` datos incompletos · `500` error interno

---

#### `POST /api/shipping/rates`

Cotiza tarifas de envío usando el proveedor configurado en el admin.

**Body:**
```json
{
  "address": {
    "name": "...", "street": "...", "city": "...",
    "department": "...", "postal_code": "...",
    "phone": "...", "email": "..."
  },
  "items": [{ "weight": "500g", "qty": 2 }]
}
```

**Respuesta 200:**
```json
{
  "provider": "fixed | skydropx",
  "rates": [
    {
      "id": "...", "provider": "skydropx",
      "carrier_name": "Servientrega", "service_name": "Estándar",
      "currency": "COP", "total_price": 18000, "days": 2
    }
  ]
}
```

---

#### `POST /api/newsletter`

Suscribe un email al boletín (upsert — no falla si ya existe).

**Body:** `{ "email": "string" }`  
**Respuesta 200:** `{ "ok": true }`

---

#### `POST /api/webhooks/skydropx`

Recibe notificaciones de Skydropx y actualiza el estado de la orden correspondiente.

**Eventos soportados:**

| Evento Skydropx | Status en BD |
|----------------|--------------|
| `shipment.in_transit` | `shipped` |
| `shipment.out_for_delivery` | `shipped` |
| `shipment.delivered` | `delivered` |
| `shipment.exception` | `exception` |

---

### Panel de administración

#### `PATCH /api/admin/orders/[id]/status`

Actualiza el estado de un pedido.

**Body:** `{ "status": "pending | processing | shipped | delivered | cancelled | exception" }`  
**Respuesta 200:** El objeto orden actualizado.

---

#### `GET /api/admin/shipping`

Devuelve la configuración de envíos actual con el `client_secret` enmascarado.

**Respuesta 200:**
```json
{
  "provider": "fixed | skydropx",
  "fixed_rate": 8000,
  "skydropx_client_id": "...",
  "skydropx_client_secret": "••••••••1234",
  "skydropx_address_from_id": "...",
  "skydropx_base_url": "https://api-pro.skydropx.com"
}
```

---

#### `GET /api/admin/config`

Devuelve la configuración de la tienda (`store_config`): nombre, email, WhatsApp y logo.

**Respuesta 200:**
```json
{
  "id": 1,
  "store_name": "VPS Coffee",
  "store_email": "info@vpscoffee.com",
  "whatsapp_number": "573001234567",
  "logo_url": "https://<supabase>/storage/v1/object/public/logos/logo.png",
  "updated_at": "2026-07-09T..."
}
```

---

#### `PATCH /api/admin/config`

Actualiza la configuración de la tienda.

**Body (cualquier subconjunto):**
```json
{
  "whatsapp_number": "573001234567",
  "store_name": "VPS Coffee Roasting House",
  "store_email": "info@vpscoffee.com",
  "logo_url": "https://..."
}
```

**Validación:** `whatsapp_number` debe tener entre 10 y 15 dígitos. Se eliminan caracteres no numéricos automáticamente.  
**Errores:** `400` número de WhatsApp inválido · `500` error de BD

---

#### `POST /api/admin/upload`

Sube una imagen a Supabase Storage. **Auto-crea el bucket** si no existe.

**Body:** `FormData` con campos `file` (imagen JPG/PNG/WebP) y `bucket` (nombre del bucket).

**Respuesta 200:** `{ "url": "https://.../storage/v1/object/public/<bucket>/<filename>" }`

---

#### `DELETE /api/admin/upload`

Elimina un archivo de Supabase Storage.

**Body:** `{ "filename": "...", "bucket": "..." }`  
**Respuesta 200:** `{ "ok": true }`

---

#### `PATCH /api/admin/shipping`

Actualiza la configuración de envíos.

**Body (ejemplos):**
```json
// Cambiar a tarifa fija de 10.000 COP
{ "provider": "fixed", "fixed_rate": 10000 }

// Activar Skydropx
{
  "provider": "skydropx",
  "skydropx_client_id": "...",
  "skydropx_client_secret": "...",
  "skydropx_address_from_id": "...",
  "fixed_rate": 8000
}

// Solo actualizar la tarifa fallback
{ "fixed_rate": 12000 }
```

**Validaciones:** proveedor debe ser `fixed` o `skydropx`; al activar Skydropx deben existir las tres credenciales; `fixed_rate` ≥ 0.

---

## 12. Arquitectura de proveedores de envío

El sistema de envíos está abstraído detrás de una interfaz `ShippingProvider` que permite agregar nuevos proveedores sin modificar el checkout ni las páginas.

### Interfaz

```typescript
interface ShippingProvider {
  readonly name: string
  getRates(address: ShippingAddress, parcel: ShippingParcel): Promise<ShippingRate[]>
}
```

### Proveedores disponibles

| Slug | Clase | Descripción |
|------|-------|-------------|
| `fixed` | `FixedRateProvider` | Tarifa plana configurable desde el admin. Sin llamadas externas. **Es el proveedor por defecto y el fallback de emergencia.** |
| `skydropx` | `SkydropxProvider` | Cotización en tiempo real vía API Skydropx. OAuth 2.0 con caché de token por `clientId`. Polling de cotizaciones (10 intentos × 500ms). Si falla, devuelve `[]` sin propagar el error. |

### Factory

```typescript
// lib/shipping/index.ts
const provider = await getShippingProvider()
// Lee shipping_config de Supabase y devuelve la instancia correcta
// Fallback automático a FixedRateProvider si:
//   - provider = 'fixed'
//   - Credenciales de Skydropx incompletas
//   - La BD no responde
```

### Agregar un nuevo proveedor

1. Agregar el slug al enum `shipping_provider_type` en una nueva migración SQL.
2. Agregar columnas de credenciales a `shipping_config`.
3. Crear `apps/web/src/lib/shipping/providers/<nombre>/index.ts` implementando `ShippingProvider`.
4. Agregar un `case '<nombre>':` en el `switch` de `lib/shipping/index.ts`.
5. Agregar la UI de credenciales en `apps/admin/src/app/configuracion/ShippingConfigForm.tsx`.

### Cálculo del paquete

```typescript
calculateParcel(items: { weight: string; qty: number }[]): ShippingParcel

// Tiers por peso total:
// ≤ 0.7 kg → 20×15×8 cm   (caja pequeña)
// ≤ 1.5 kg → 25×20×10 cm  (caja mediana)
// > 1.5 kg → 35×25×15 cm  (caja grande)
```

---

## 13. Design System

### Paleta de colores

| Token | Valor hex | Uso |
|-------|----------|-----|
| `brand-primary` | `#614A2A` | Marrón primario — textos, botones, sidebar |
| `brand-dark` | `#4A3520` | Hover de elementos primarios |
| `brand-cream` | `#FFF0D1` | Crema — fondo general, texto sobre primario |
| `brand-light` | `#F5E6C8` | Variante más oscura del crema |
| `brand-accent` | `#C8963E` | Dorado — acentos, badges de precio |

### Tipografía

| Clase CSS | Fuente | Uso |
|-----------|--------|-----|
| `font-display` | Ahsing (`typogama-ahsing.otf`) | Títulos hero y de sección |
| `font-brand` | Geeeki Regular (`Geeeki-Regular.otf`) | UI, párrafos, etiquetas |

**Tamaños responsivos:**
- `.text-hero` → `clamp(3rem, 8vw, 7rem)`
- `.text-section` → `clamp(2rem, 5vw, 4rem)`

### Utilidades personalizadas

```css
.arch-image       /* Border-radius en forma de arco para imágenes de producto */
.shadow-card      /* Sombra suave para tarjetas */
.scrollbar-thin   /* Scrollbar estilizado para drawers */
```

### Componentes compartidos (`packages/ui`)

| Componente | Props principales |
|-----------|-------------------|
| `Button` | `variant`: primary / secondary / whatsapp / ghost · `size`: sm / md / lg · `loading` |
| `Badge` | `active` (toggle visual) |
| `ProductCard` | `product`, `onAddToCart` |
| `Spinner` | — |
| `cn()` | `clsx` + `tailwind-merge` helper |

---

## 14. Testing

### Ejecutar todos los tests

```bash
# Desde la raíz
pnpm test

# Con cobertura
cd apps/web && pnpm test:coverage
cd packages/database && pnpm test:coverage
```

### Suite de pruebas

| Archivo | Tipo | Casos | Qué prueba |
|---------|------|-------|------------|
| `apps/web/src/store/__tests__/cart.test.ts` | Unitaria | 18 | Cart Store: addItem, deduplicación, removeItem, updateQty, clearCart, subtotal, localStorage |
| `apps/web/src/lib/shipping/__tests__/types.test.ts` | Unitaria | 10 | `calculateParcel`: tiers de peso, mezclas, casos borde |
| `apps/web/src/lib/shipping/__tests__/fixed-rate.test.ts` | Unitaria | 10 | `FixedRateProvider`: tarifa, envío gratuito, idempotencia |
| `apps/web/src/lib/shipping/__tests__/skydropx-auth.test.ts` | Unitaria | 7 | OAuth 2.0: nuevo token, caché, renovación, cache por clientId |
| `apps/web/src/lib/shipping/__tests__/skydropx-provider.test.ts` | Unitaria | 9 | `SkydropxProvider`: happy path, polling, degradación graceful |
| `apps/web/src/lib/shipping/__tests__/factory.test.ts` | Unitaria | 8 | Factory: todos los paths del switch, fallbacks |
| `apps/web/src/lib/__tests__/variant-utils.test.ts` | Unitaria | 22 | `getProductOptions`, `getVariantAttrs`, `getVariantLabel`, `isColorValue`, `COLOR_HEX` |
| `apps/web/src/lib/__tests__/colombia-locations.test.ts` | Unitaria | 10 | 33 departamentos, sin duplicados, `getCitiesForDepartment`, ciudades ordenadas |
| `packages/database/src/queries/__tests__/products.test.ts` | Unitaria | 8 | Queries de productos: filtros, slug, featured, errores |
| `packages/database/src/queries/__tests__/orders.test.ts` | Unitaria | 12 | Queries de órdenes: número correlativo, discount default, updateOrderStatus |
| `packages/database/src/queries/__tests__/blog.test.ts` | Unitaria | 10 | Queries de blog: filtro categoría, limit, getFeaturedPost null-safe |
| `packages/database/src/queries/__tests__/coupons.test.ts` | Unitaria | 14 | `validateCoupon`: porcentaje, fijo, inactivo, expirado, usos, mínimo pedido |
| `packages/database/src/queries/__tests__/themes.test.ts` | Unitaria | 14 | `getThemes`, `getActiveTheme`, `createTheme`, `setActiveTheme`, `deleteTheme` |
| `apps/web/src/app/api/__tests__/checkout.integration.test.ts` | Integración | 17 | `POST /api/checkout`: validación, pasarela, happy path, `shipping_rate` → `carrier_name`, errores |
| `apps/web/src/app/api/__tests__/webhook-skydropx.integration.test.ts` | Integración | 9 | `POST /api/webhooks/skydropx`: mapping de eventos, tracking_number, idempotencia |
| `apps/web/src/app/api/__tests__/shipping-rates.integration.test.ts` | Integración | 9 | `POST /api/shipping/rates`: routing a provider, address mapping, fallbacks |
| `apps/web/src/app/api/account/__tests__/addresses-id.integration.test.ts` | Integración | 9 | `PATCH/DELETE /api/account/addresses/[id]`: auth guard, 404, update, set default, delete |
| `apps/admin/src/app/api/admin/orders/__tests__/order-status.integration.test.ts` | Integración | 9 | `PATCH /api/admin/orders/[id]/status`: todos los estados, errores |
| `apps/admin/src/app/api/admin/shipping/__tests__/shipping-config.integration.test.ts` | Integración | 14 | `GET/PATCH /api/admin/shipping`: enmascaramiento del secret, validaciones, errores |
| `packages/database/src/queries/__tests__/store-config.test.ts` | Unitaria | 10 | `getStoreConfig`: fallback a DEFAULT_CONFIG, happy path; `updateStoreConfig`: upsert, errores |
| `apps/admin/src/app/api/admin/config/__tests__/store-config-api.integration.test.ts` | Integración | 11 | `GET/PATCH /api/admin/config`: WhatsApp validation, strip no-digits, logo URL, errores |
| `apps/admin/src/app/api/admin/products/__tests__/products-create.integration.test.ts` | Integración | 9 | `POST /api/admin/products`: imágenes guardadas, variantes creadas, validación nombre+slug |
| **Total** | | **238** | |

### Umbrales de cobertura

```
branches:   ≥ 70%
functions:  ≥ 80%
lines:      ≥ 80%
statements: ≥ 80%
```

### Patrones de mock

- **Supabase** → `jest.mock('@vps/database')` con chains de `.from().select().eq()...`
- **fetch global** → `global.fetch = jest.fn()` dentro de `jest.isolateModulesAsync()`
- **ShippingProvider** → `jest.mock('@/lib/shipping')` para tests de API routes

---

## 15. Despliegue

### Recomendado: Vercel

```bash
# Web
vercel deploy apps/web --prod

# Admin (subdomain o proyecto separado)
vercel deploy apps/admin --prod
```

**Variables de entorno en Vercel:** Configurar todas las variables del `.env.example` en el dashboard de Vercel para cada proyecto.

### Configuración DNS

| Subdominio | App |
|-----------|-----|
| `vpscoffee.com` | `apps/web` |
| `admin.vpscoffee.com` | `apps/admin` |

### Pre-deploy checklist

- [ ] Ejecutar migraciones SQL en Supabase (production)
- [ ] Verificar que `SUPABASE_SERVICE_ROLE_KEY` está configurado (nunca exponer al cliente)
- [ ] Configurar el proveedor de envíos desde `/configuracion` en el admin
- [ ] Configurar `NEXT_PUBLIC_SITE_URL` con el dominio de producción
- [ ] Configurar el webhook de Skydropx apuntando a `https://vpscoffee.com/api/webhooks/skydropx`
- [ ] Copiar las fuentes `.otf` a `public/fonts/` en ambas apps antes del build

---

## 16. Flujos de negocio

### Flujo de compra completo

```
Cliente →  /tienda  →  Selecciona variante
        →  CartDrawer  (Zustand + localStorage)
        →  /carrito  →  Revisa totales + cupón
        →  /checkout  (Paso 1: Contacto)
                     (Paso 2: Envío → selecciona depto/ciudad → "Ver opciones" → POST /api/shipping/rates → elige transportadora)
                     (Paso 3: Pago → elige Wompi/MercadoPago)
        →  POST /api/checkout  →  Orden creada en Supabase (status: pending)
        →  /checkout/confirmacion  →  Muestra VPS-XXXX
```

### Flujo de despacho (Admin)

```
Admin  →  /pedidos  →  Filtra por "Pendiente"
       →  /pedidos/[id]  →  Revisa items y dirección
       →  Actualiza status a "Procesando"
       →  (Cuando el pago es confirmado) Crea guía en Skydropx
       →  Actualiza status a "Enviado" + tracking_number
       →  Skydropx dispara webhook  →  POST /api/webhooks/skydropx
       →  Status se actualiza automáticamente a "Entregado"
```

### Flujo de configuración de envíos

```
Admin  →  /configuracion  →  Sección "Proveedor de envíos"
       →  Selecciona "Skydropx"
       →  Ingresa Client ID, Client Secret, Address From ID
       →  PATCH /api/admin/shipping  →  Guarda en shipping_config
       →  Próximas cotizaciones usan SkydropxProvider automáticamente
```

---

## 17. Guía de contribución

### Convenciones de commits

```
feat:     nueva funcionalidad
fix:      corrección de bug
refactor: refactorización sin cambio de comportamiento
test:     agregar o corregir tests
docs:     documentación
chore:    configuración, dependencias
```

### Antes de hacer PR

```bash
pnpm lint          # Sin errores de ESLint
pnpm type-check    # Sin errores de TypeScript (en cada app)
pnpm test          # Todos los tests pasan
pnpm format        # Código formateado con Prettier
```

### Agregar una nueva página pública

1. Crear `apps/web/src/app/(public)/<ruta>/page.tsx`
2. Exportar `metadata` para SEO
3. Agregar `export const revalidate = 60` si la página tiene datos dinámicos
4. Agregar el link en `Navbar.tsx` y `Footer.tsx`

### Agregar un nuevo componente compartido

1. Crear `packages/ui/src/<nombre>.tsx`
2. Exportar desde `packages/ui/src/index.ts`
3. Usar `import { Nombre } from '@vps/ui'` en cualquier app

### Agregar una nueva tabla en la BD

1. Crear `packages/database/supabase/migrations/00X_<descripcion>.sql`
2. Agregar los tipos correspondientes en `packages/database/src/types.ts`
3. Crear el archivo de queries en `packages/database/src/queries/<tabla>.ts`
4. Exportar desde `packages/database/src/queries/index.ts`
5. Regenerar tipos: `pnpm db:generate`

---

## 18. Estado del proyecto

### Implementado ✅

- Monorepo Turborepo con pnpm workspaces
- Design system completo (colores, fuentes, componentes)
- Schema de base de datos con RLS y triggers (5 migraciones)
- Sitio público: Home, Tienda, Producto, Maquila, Asesorías, Blog, Nosotros
- HeroCarousel con imágenes separadas para mobile/desktop (`<picture>`)
- Carrito con Zustand + persistencia en localStorage
- Checkout de 3 pasos + confirmación
- Área Mi Cuenta (estructura; requiere auth)
- Panel admin: Dashboard, Productos (CRUD + imágenes), Pedidos, Categorías, Banners, Blog, Configuración
- **CRUD de productos** con formulario, variantes, upload de imágenes a Storage, validación cliente
- **store_config** — logo y WhatsApp gestionados desde el admin (tabla singleton)
- **Logo** cargado desde admin, visible en Navbar y Footer del sitio público
- **WhatsApp desde BD** — sin variables de entorno; usado en todos los CTAs
- **Auto-creación de buckets** en Storage al subir la primera imagen
- API Routes: checkout, newsletter, webhooks Skydropx, shipping rates, config, upload
- **Capa multi-proveedor de envíos** con FixedRateProvider y SkydropxProvider
- **Configuración de proveedor de envíos desde el admin** (sin redespliegue)
- **Generación automática de guía Skydropx** tras pago confirmado (Wompi + MercadoPago)
- **Modal de despacho masivo** (pickups Skydropx) desde `/admin/pedidos`
- **Blog Draft Mode** — previsualización de borradores con cookie segura (`__vps_draft`)
- **Edición de perfil** (`/mi-cuenta/perfil`) — nombre, teléfono, sincronización con Stack Auth
- **Email de confirmación de newsletter** — solo al primer registro (sin duplicados)
- **Página 404 personalizada** con diseño "taza de café vacía"
- **SEO completo**: `sitemap.xml` dinámico, `robots.txt`, Open Graph y Twitter Cards por página
- 209 casos de prueba (unitarias + integración)

### Variables de entorno nuevas (v3)

Además de las variables base, agrega en `apps/web/.env.local`:

```env
# Blog Draft Mode — previsualización de borradores
DRAFT_SECRET=cambia-este-secreto
```

Y en `apps/admin/.env.local`:

```env
# URL pública del sitio web para generar el enlace de previsualización
NEXT_PUBLIC_SITE_URL=https://vpscoffee.com
NEXT_PUBLIC_DRAFT_SECRET=cambia-este-secreto  # debe coincidir con DRAFT_SECRET del web
```

### Pendiente 🔲

| Feature | Prioridad |
|---------|-----------|
| Validación de cupones de descuento | Media |
| Integración analítica (Vercel Analytics / Plausible) | Baja |
| Búsqueda de productos en la tienda | Baja |

---

## Licencia

Proyecto privado. Todos los derechos reservados.  
© 2026 VPS Coffee Roasting House · Desarrollado por **Parquesoft TI**
