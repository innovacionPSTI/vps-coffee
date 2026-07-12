# VPS Coffee — Estado del Proyecto
> **Última actualización:** Julio 2026 · **Stack:** Next.js 15 · Supabase · Stack Auth · Tailwind · Turborepo

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
- `src/types.ts` — tipos TypeScript completos de todas las tablas (incluye `payment_config`, campos Resend)
- `src/client.ts` — `createBrowserClient()` y `createServerClient()`
- `src/queries/` — products, orders, blog, banners, shipping-config, store-config, **payment-config**
- `supabase/migrations/1_initial_schema.sql` — schema completo para Stack Auth (sin FK a auth.users, sin trigger on_auth_user_created); RLS solo con políticas válidas; roles correctos incluido `miembro`
- `supabase/migrations/2_shipping_config.sql` — tabla `shipping_config` con soporte multi-proveedor
- `supabase/migrations/3_banner_mobile_image.sql` — tabla `banners` con campos de imagen web/mobile
- `supabase/migrations/4_store_config.sql` — tabla `store_config` singleton (id=1) con whatsapp, nombre, email, logo; RLS habilitado
- `supabase/migrations/5_payment_config.sql` — tabla `payment_config` singleton (id=1) con credenciales Wompi y MercadoPago
- `supabase/migrations/6_email_config.sql` — añade `resend_api_key` y `resend_from_email` a `store_config`
- `supabase/migrations/7_shipping_profiles.sql` — tabla `shipping_profiles` para perfiles de envío; RLS habilitado
- `supabase/migrations/8_customers.sql` — tabla `customers` (mirror de compradores web desde Stack Auth); FK `orders.customer_id → customers.id`; RLS habilitado (solo service_role)
- `supabase/migrations/9_customer_addresses.sql` — tabla `customer_addresses` (1 cliente → N direcciones guardadas para pre-llenar checkout); RLS habilitado

### `packages/ui`
- `Button`, `Badge`, `ProductCard`, `Spinner` — componentes base con variantes VPS
- `cn()` utility (clsx + tailwind-merge)

### `apps/web` — Sitio público
**Setup:**
- `package.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `tsconfig.json`
- `globals.css` con fuentes Ahsing/Geeeki, variables CSS, utilidades arch/scrollbar
- `app/layout.tsx` con metadata SEO global

**Auth (Stack Auth):**
- `src/stack.ts` — `StackServerApp` (tokenStore: nextjs-cookie, urls custom: /login, /registro, /mi-cuenta)
- `src/middleware.ts` — protege `/mi-cuenta/*`; redirige a `/login?returnTo=...` si sin sesión
- `src/app/handler/[...stack]/page.tsx` — catch-all handler (password-reset, email-verification, etc.)
- `src/app/(auth)/layout.tsx` — layout centrado con logo para páginas de auth
- `src/app/(auth)/login/page.tsx` — formulario VPS-branded, `signInWithCredential`, returnTo param
- `src/app/(auth)/registro/page.tsx` — formulario VPS-branded, `signUpWithCredential`, dispara welcome email
- `src/components/auth/LogoutButton.tsx` — client component con `useUser().signOut()`
- `src/app/api/auth/welcome/route.ts` — POST: obtiene user de Stack Auth, envía bienvenida vía Resend

**Layout:**
- `Navbar` — sticky; carrito badge; hamburger mobile; acepta prop `logoUrl`; muestra "Iniciar sesión" o icono Mi Cuenta segú `useUser()` (Stack Auth)
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
| `/mi-cuenta` | `app/(account)/mi-cuenta/page.tsx` | SSR · user real |
| `/mi-cuenta/pedidos` | `app/(account)/mi-cuenta/pedidos/page.tsx` | ✅ |

> **Nota Next.js 15:** En rutas dinámicas `params` es un `Promise`. Se debe tipar como `params: Promise<{ slug: string }>` y usar `const { slug } = await params`.

**API Routes:**
| Ruta | Función |
|------|---------|
| `POST /api/checkout` | Crea orden en Supabase + genera URL de pago Wompi o preferencia MercadoPago |
| `POST /api/newsletter` | Upsert suscriptor |
| `POST /api/webhooks/skydropx` | Actualiza estado pedido |
| `POST /api/webhooks/wompi` | Verifica firma SHA256, actualiza estado de pago, envía email de confirmación |
| `POST /api/webhooks/mercadopago` | Consulta pago real en API de MP, actualiza estado, envía email |
| `POST /api/shipping/rates` | Cotiza envío multi-proveedor |
| `POST /api/auth/welcome` | Upsert en `customers` + vincula pedidos previos + email de bienvenida |
| `GET /api/account/addresses` | Devuelve direcciones guardadas del cliente logueado (para pre-llenar checkout) |
| `POST /api/account/addresses` | Guarda nueva dirección del cliente; maneja `is_default` de forma exclusiva |

**Componentes:**
- `HeroCarousel` — autoplay 5s, fade, dots, flechas; usa `<picture>` + `<source media="(max-width: 768px)">` para mostrar imagen mobile en móvil e imagen desktop en escritorio
- `FeaturedProducts` — grid 3 col, add to cart
- `ServicesSection` — async, llama `Promise.all` para URLs de WhatsApp desde BD
- `NewsletterSection` — POST a API route
- `CartDrawer` — slide-in desde derecha, overlay, Escape key
- `ShopClient` — filtros tueste/peso/método, sort, grid
- `ProductDetail` — galería, selector variantes, add to cart
- `lib/whatsapp.ts` — async, lee número desde `getStoreConfig()` en BD; fallback `573XXXXXXXXX`
- `lib/wompi.ts` — `buildWompiCheckoutUrl` (firma SHA256), `verifyWompiWebhook`, `mapWompiStatus`; sin process.env
- `lib/mercadopago.ts` — `createMercadoPagoPreference`, `getMercadoPagoPayment`, `mapMercadoPagoStatus`, `isMercadoPagoSandbox`; sin process.env
- `lib/email.ts` — `sendOrderConfirmation`, `sendShippingNotification`, `sendWelcomeEmail` vía Resend (fetch directo); credenciales como parámetros
- `lib/skydropx/auth.ts` — OAuth 2.0 con cache de token
- `lib/skydropx/quotations.ts` — cotizar + polling + cálculo de parcel

### `apps/admin` — Panel de administración
**Setup:**
- `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`
- `globals.css` con fuentes VPS
- `app/layout.tsx` — StackProvider/StackTheme; topbar con nombre/iniciales del usuario real

**Auth (Stack Auth):**
- `src/stack.ts` — `StackServerApp` (tokenStore: nextjs-cookie)
- `src/middleware.ts` — protege todas las rutas excepto `/handler/*`; redirige a `/handler/sign-in`
- `src/app/handler/[...stack]/page.tsx` — catch-all handler Stack Auth

**Auth y Roles:**
- `src/lib/roles.ts` — reescrito con `AssignableRole = AdminRole | 'miembro'`; `ADMIN_ROLES`, `ASSIGNABLE_ROLES`, `ROLE_LABELS` (incluyendo miembro), `isAdminRole()` retorna false para miembro
- Roles disponibles: `super_admin`, `admin`, `vendedor`, `gestor_tienda`, `miembro` (sin acceso al panel), `customer`

**Layout:**
- `AdminSidebar` — sidebar `#614A2A`, nav activo, Configuración al final de la lista
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
| `/clientes` | Tabla unificada: usuarios registrados (Stack Auth, badge "Con cuenta") + compradores sin cuenta (solo en orders, badge "Sin cuenta"); búsqueda y filtros |
| `/usuarios` | CRUD de usuarios del panel: invitar (crea en Stack Auth con rol `miembro` + envía email de contraseña), cambiar rol, eliminar |
| `/configuracion` | `ShippingConfigForm`, `PaymentConfigForm` (Wompi+MP con SecretInput + toggle), `EmailConfigForm` (Resend), `StoreConfigForm` (WhatsApp, logo) |

**API Admin:**
| Ruta | Función |
|------|---------|
| `POST /api/admin/products` | Crea producto con variantes e **imágenes** (bug fix: ya no ignora el campo `images` del body) |
| `GET/PATCH /api/admin/products/[id]` | Edita producto y variantes |
| `DELETE /api/admin/products/[id]` | Elimina producto y variantes (FK) |
| `PATCH /api/admin/orders/[id]/status` | Actualiza estado de orden |
| `GET /api/admin/shipping` | Lee config de envíos (client_secret enmascarado) |
| `PATCH /api/admin/shipping` | Guarda config de envíos con validación |
| `GET /api/admin/config` | Lee `store_config` (WhatsApp, nombre, email, logo, Resend); enmascara `resend_api_key` |
| `PATCH /api/admin/config` | Guarda `store_config`; valida que WhatsApp tenga 10–15 dígitos; acepta campos Resend |
| `GET /api/admin/payment-config` | Lee `payment_config`; devuelve secrets enmascarados + flags `has_*` |
| `PATCH /api/admin/payment-config` | Guarda credenciales Wompi/MP; valida prefijo `pub_`; no sobreescribe secrets vacíos |
| `GET /api/admin/usuarios` | Lista usuarios del panel (roles `super_admin`, `admin`, `vendedor`, `gestor_tienda`, `miembro`) desde Supabase |
| `POST /api/admin/usuarios` | Crea usuario: `stackServerApp.createUser()` → upsert en `profiles` con rol `miembro` → envía email "Establece tu contraseña" vía Stack Auth REST API |
| `PATCH /api/admin/usuarios/[id]` | Cambia rol (`AssignableRole`); solo super_admin puede asignar super_admin |
| `DELETE /api/admin/usuarios/[id]` | Elimina usuario del panel |
| `POST /api/admin/upload` | Sube archivo a Supabase Storage; **auto-crea el bucket** si no existe |
| `DELETE /api/admin/upload` | Elimina archivo de Storage |

---

## 🔧 Pendiente de implementar

### Prioridad alta
- [ ] **Formulario CRUD de blog** (`/admin/blog/nuevo` y `/admin/blog/[id]`) — editor Markdown/rich text
- [ ] **Editor de banners** — formulario de edición de slide con imagen web + imagen mobile; drag & drop para reordenar

### Prioridad media
- [ ] **Creación de shipment Skydropx** tras pago confirmado (`lib/skydropx/shipments.ts`)
- [ ] **Modal de despacho masivo** en admin (pickups Skydropx)
- [ ] **SEO:** `sitemap.xml`, `robots.txt`, Open Graph por página
- [ ] **Página 404** personalizada

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
packages/database/supabase/migrations/1_initial_schema.sql
packages/database/supabase/migrations/2_shipping_config.sql
packages/database/supabase/migrations/3_banner_mobile_image.sql
packages/database/supabase/migrations/4_store_config.sql
packages/database/supabase/migrations/5_payment_config.sql
packages/database/supabase/migrations/6_email_config.sql
packages/database/supabase/migrations/7_shipping_profiles.sql
packages/database/supabase/migrations/8_customers.sql
packages/database/supabase/migrations/9_customer_addresses.sql
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
│   │   │   ├── api/
│   │   │   │   ├── checkout/route.ts   — crea orden + URL pago Wompi/MP
│   │   │   │   ├── webhooks/
│   │   │   │   │   ├── skydropx/route.ts
│   │   │   │   │   ├── wompi/route.ts  — verifica firma, actualiza orden, email
│   │   │   │   │   └── mercadopago/route.ts — consulta MP API, actualiza orden, email
│   │   │   │   ├── newsletter/
│   │   │   │   └── shipping/rates/
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
│   │       ├── wompi.ts                — buildWompiCheckoutUrl, verifyWompiWebhook, mapWompiStatus
│   │       ├── mercadopago.ts          — createMercadoPagoPreference, getMercadoPagoPayment, etc.
│   │       ├── email.ts                — sendOrderConfirmation, sendShippingNotification, sendWelcomeEmail
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
│       │   ├── clientes/
│       │   │   ├── page.tsx            — Server Component: fusiona Stack Auth users + orders por email
│       │   │   └── ClientesClient.tsx  — búsqueda, filtros con/sin cuenta, tabla con badge de tipo
│       │   ├── usuarios/
│       │   │   └── UsuariosClient.tsx  — invitar (siempre como miembro), cambiar rol, eliminar
│       │   ├── configuracion/
│       │   │   ├── page.tsx            — carga shipping + store_config + payment_config
│       │   │   ├── ShippingConfigForm.tsx
│       │   │   ├── StoreConfigForm.tsx — WhatsApp, logo, nombre, email
│       │   │   ├── PaymentConfigForm.tsx — Wompi + MP con SecretInput + toggles
│       │   │   └── EmailConfigForm.tsx — Resend API key + from email
│       │   └── api/admin/
│       │       ├── products/           — POST (crea con imágenes), GET/PATCH/DELETE [id]
│       │       ├── orders/[id]/status/
│       │       ├── shipping/           — GET+PATCH con validación y secret masking
│       │       ├── config/             — GET+PATCH store_config + Resend; enmascara resend_api_key
│       │       ├── payment-config/     — GET+PATCH payment_config; secrets ••••last4 + has_* flags
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
│   │       ├── 1_initial_schema.sql        — Stack Auth-native: sin FK auth.users, sin triggers
│   │       ├── 2_shipping_config.sql
│   │       ├── 3_banner_mobile_image.sql
│   │       ├── 4_store_config.sql
│   │       ├── 5_payment_config.sql
│   │       ├── 6_email_config.sql
│   │       └── 7_shipping_profiles.sql
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
