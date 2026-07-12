# VPS Coffee — Estado del Proyecto
> **Última actualización:** Julio 2026 (v3) · **Stack:** Next.js 15 · Supabase · Stack Auth · Tailwind · Turborepo

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
- `src/types.ts` — tipos TypeScript completos de todas las tablas (incluye `payment_config`; campos Resend; `free_shipping_*` en `shipping_config`; `terms_content`, `privacy_content`, `instagram/facebook/tiktok_url/enabled` en `store_config`)
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
- `supabase/migrations/10_shipping_free_threshold.sql` — añade `free_shipping_enabled` (boolean) y `free_shipping_min_amount` (numeric) a `shipping_config`; configurable desde el admin sin código
- `supabase/migrations/11_legal_content.sql` — añade `terms_content` y `privacy_content` (TEXT nullable) a `store_config`; editor Markdown en admin
- `supabase/migrations/12_social_links.sql` — añade `instagram_url/enabled`, `facebook_url/enabled`, `tiktok_url/enabled` a `store_config`; iconos SVG en footer
- `supabase/migrations/13_skydropx_origin_address.sql` — añade 8 campos de dirección de origen a `shipping_config` (origin_name, origin_street, origin_neighborhood, origin_city, origin_department, origin_postal_code, origin_phone, origin_email) — **ejecutar manualmente en Supabase SQL Editor**

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
| `/carrito` | `app/carrito/page.tsx` | Client — tarifa y umbral de envío gratis desde BD vía `/api/shipping/config`; barra de progreso hacia envío gratis |
| `/checkout` | `app/checkout/page.tsx` | 3 pasos — envío desde config real; si provider=skydropx llama `/api/shipping/rates` al completar dirección |
| `/terminos` | `app/(public)/terminos/page.tsx` | `force-dynamic` — renderiza `store_config.terms_content` (Markdown→HTML) |
| `/privacidad` | `app/(public)/privacidad/page.tsx` | `force-dynamic` — renderiza `store_config.privacy_content` (Markdown→HTML) |
| `/checkout/confirmacion` | `app/checkout/confirmacion/page.tsx` | async, WhatsApp desde BD |
| `/` | `app/(public)/page.tsx` | ISR 60s |
| `/tienda` | `app/(public)/tienda/page.tsx` | ISR 60s |
| `/tienda/[slug]` | `app/(public)/tienda/[slug]/page.tsx` | `force-dynamic`; OG image desde `images[0].url` |
| `/blog` | `app/(public)/blog/page.tsx` | ISR 60s |
| `/blog/[slug]` | `app/(public)/blog/[slug]/page.tsx` | SSG+ISR; Draft Mode con cookie `__vps_draft`; banner borrador |
| `/mi-cuenta` | `app/(account)/mi-cuenta/page.tsx` | SSR · user real |
| `/mi-cuenta/perfil` | `app/(account)/mi-cuenta/perfil/page.tsx` | SSR · editar nombre, teléfono y direcciones |
| `/mi-cuenta/pedidos` | `app/(account)/mi-cuenta/pedidos/page.tsx` | SSR |
| `not-found.tsx` | `app/not-found.tsx` | Página 404 con estilo VPS (café vacío) |
| `sitemap.ts` | `app/sitemap.ts` | Sitemap dinámico: rutas estáticas + productos activos + posts publicados |
| `robots.ts` | `app/robots.ts` | robots.txt: bloquea `/api/`, `/mi-cuenta/`, `/checkout/` |

> **Nota Next.js 15:** En rutas dinámicas `params` es un `Promise`. Se debe tipar como `params: Promise<{ slug: string }>` y usar `const { slug } = await params`.

**API Routes:**
| Ruta | Función |
|------|---------|
| `POST /api/checkout` | Crea orden en Supabase + genera URL de pago Wompi o preferencia MercadoPago |
| `POST /api/newsletter` | Upsert suscriptor + email de confirmación vía Resend (solo en primera suscripción) |
| `GET /api/shipping/config` | Config pública de envío (provider, fixed_rate, free_shipping_*) — para carrito y checkout |
| `POST /api/shipping/rates` | Cotiza envío multi-proveedor (Skydropx o tarifa fija) |
| `POST /api/auth/welcome` | Upsert en `customers` + vincula pedidos previos + email de bienvenida |
| `GET /api/account/addresses` | Devuelve direcciones guardadas del cliente logueado |
| `POST /api/account/addresses` | Guarda nueva dirección; maneja `is_default` de forma exclusiva |
| `GET /api/account/profile` | Devuelve nombre y teléfono del customer logueado |
| `PATCH /api/account/profile` | Actualiza nombre y teléfono; sincroniza `displayName` en Stack Auth |
| `GET /api/draft/enable` | Activa modo borrador (cookie `__vps_draft` 1h) + redirect a `/blog/[slug]?draft=1` |
| `POST /api/webhooks/wompi` | Verifica firma SHA256, actualiza estado de pago → `createShipmentForOrder()` → email de tracking |
| `POST /api/webhooks/mercadopago` | Consulta pago en API MP, actualiza estado → `createShipmentForOrder()` → email de tracking |
| `POST /api/webhooks/skydropx` | Mapea `workflow_status` / eventos PRO a estado de orden; envía email de tracking al entrar en tránsito |

**Componentes:**
- `HeroCarousel` — autoplay 5s, fade, dots, flechas; usa `<picture>` + `<source media="(max-width: 768px)">` para mostrar imagen mobile en móvil e imagen desktop en escritorio
- `Footer` — iconos SVG oficiales de Instagram, Facebook y TikTok; se muestran solo si están `enabled: true` y tienen URL configurada; recibe prop `social` desde el layout servidor
- `LegalPage` — componente compartido para `/terminos` y `/privacidad`; converter Markdown→HTML sin dependencias externas (h1/h2/h3, **bold**, *italic*, listas, links); muestra aviso si el contenido está vacío
- `FeaturedProducts` — grid 3 col, add to cart
- `ServicesSection` — async, llama `Promise.all` para URLs de WhatsApp desde BD
- `NewsletterSection` — POST a API route
- `CartDrawer` — slide-in desde derecha, overlay, Escape key
- `ShopClient` — filtros tueste/peso/método, sort, grid
- `ProductDetail` — galería, selector variantes, add to cart
- `components/account/ProfileForm` — editar nombre y teléfono del cliente; PATCH a `/api/account/profile`
- `components/account/AddressesForm` — lista y agregar direcciones guardadas con modal inline
- `components/pedidos/PickupModal` — modal para seleccionar órdenes y programar recolección Skydropx
- `lib/whatsapp.ts` — async, lee número desde `getStoreConfig()` en BD; fallback `573XXXXXXXXX`
- `lib/wompi.ts` — `buildWompiCheckoutUrl` (firma SHA256), `verifyWompiWebhook`, `mapWompiStatus`; sin process.env
- `lib/mercadopago.ts` — `createMercadoPagoPreference`, `getMercadoPagoPayment`, `mapMercadoPagoStatus`, `isMercadoPagoSandbox`; sin process.env
- `lib/email.ts` — `sendOrderConfirmation`, `sendShippingNotification`, `sendWelcomeEmail`, `sendNewsletterConfirmation` vía Resend (fetch directo); credenciales como parámetros
- `lib/shipping/types.ts` — interfaces `ShippingAddress`, `ShippingRate`, `Parcel`, `calculateParcel()`
- `lib/shipping/index.ts` — factory `getShippingProvider()` + exports de providers
- `lib/shipping/providers/fixed/index.ts` — `FixedRateProvider`: devuelve tarifa fija desde config
- `lib/shipping/providers/skydropx/auth.ts` — OAuth 2.0 client_credentials con cache de token por clientId
- `lib/shipping/providers/skydropx/index.ts` — `SkydropxProvider`: cotización con `address_from` inline, polling hasta `is_completed`, extrae tracking de `included[0].attributes`; `createShipment()` completo
- `lib/shipping/shipments.ts` — `createShipmentForOrder(orderNumber)`: carga orden → config → destination → parcel → guía → actualiza orden; idempotente; nunca lanza

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
| `/clientes` | Tabla unificada: lee desde `customers` (Supabase) en lugar de Stack Auth API; compradores sin cuenta desde `orders`; búsqueda y filtros |
| `/usuarios` | CRUD de usuarios del panel: invitar (crea en Stack Auth con rol `miembro` + envía email de contraseña), cambiar rol, eliminar |
| `/blog/nuevo` | Formulario de creación de artículo: título, slug auto-generado, imagen de portada, categoría, toggle publicado/borrador, extracto, contenido Markdown, SEO |
| `/blog/[id]` | Formulario de edición de artículo; botón eliminar; botón "Previsualizar ↗" — activa Draft Mode mediante cookie |
| `/configuracion` | `ShippingConfigForm` (tarifa fija + toggle envío gratis + monto mínimo + credenciales Skydropx), `PaymentConfigForm` (Wompi+MP), `EmailConfigForm` (Resend), `StoreConfigForm` (WhatsApp, logo, **redes sociales con toggle + URL por red**), `LegalConfigForm` (editor Markdown con tabs Términos/Privacidad) |

**API Admin:**
| Ruta | Función |
|------|---------|
| `POST /api/admin/products` | Crea producto con variantes e **imágenes** (bug fix: ya no ignora el campo `images` del body) |
| `GET/PATCH /api/admin/products/[id]` | Edita producto y variantes |
| `DELETE /api/admin/products/[id]` | Elimina producto y variantes (FK) |
| `PATCH /api/admin/orders/[id]/status` | Actualiza estado de orden |
| `GET /api/shipping/config` | Config pública de envío sin credenciales (provider, fixed_rate, free_shipping_enabled, free_shipping_min_amount) — usada por carrito y checkout |
| `GET /api/admin/shipping` | Lee config de envíos (client_secret enmascarado) |
| `PATCH /api/admin/shipping` | Guarda config de envíos con validación; acepta `free_shipping_enabled` y `free_shipping_min_amount` |
| `GET /api/admin/config` | Lee `store_config` (WhatsApp, nombre, email, logo, Resend, legal, redes sociales); enmascara `resend_api_key` |
| `PATCH /api/admin/config` | Guarda `store_config`; valida WhatsApp (10–15 dígitos); acepta Resend, `terms_content`, `privacy_content`, `instagram/facebook/tiktok_url/enabled` |
| `GET /api/admin/payment-config` | Lee `payment_config`; devuelve secrets enmascarados + flags `has_*` |
| `PATCH /api/admin/payment-config` | Guarda credenciales Wompi/MP; valida prefijo `pub_`; no sobreescribe secrets vacíos |
| `GET /api/admin/usuarios` | Lista usuarios del panel (roles `super_admin`, `admin`, `vendedor`, `gestor_tienda`, `miembro`) desde Supabase |
| `POST /api/admin/usuarios` | Crea usuario: `stackServerApp.createUser()` → insert en `profiles` con UUID generado en servidor → envía email "Establece tu contraseña" vía Stack Auth REST API con `secret-server-key` |
| `PATCH /api/admin/usuarios/[id]` | Cambia rol (`AssignableRole`); solo super_admin puede asignar super_admin |
| `DELETE /api/admin/usuarios/[id]` | Elimina usuario del panel |
| `POST /api/admin/blog` | Crea artículo del blog; detecta slug duplicado (409) |
| `PATCH /api/admin/blog/[id]` | Edita artículo; gestiona `published_at` automáticamente |
| `DELETE /api/admin/blog/[id]` | Elimina artículo |
| `POST /api/admin/upload` | Sube archivo a Supabase Storage; **auto-crea el bucket** si no existe |
| `DELETE /api/admin/upload` | Elimina archivo de Storage |
| `POST /api/admin/pickups` | Programa recolección en Skydropx PRO (fecha + ventana horaria + lista de shipment_ids) |
| `GET /api/admin/pickups` | Lista recolecciones programadas (paginado) |

---

## 🔧 Pendiente de implementar

### Completado recientemente (v3)
- [x] **Skydropx PRO completo** — OAuth2 client_credentials, cotización (quotations API), creación automática de guías post-pago (`createShipmentForOrder`), webhooks de tracking, pickups masivos desde admin ✅
- [x] **Página 404** personalizada con motivo de "taza vacía", links de recuperación ✅
- [x] **SEO técnico** — `sitemap.xml` dinámico (productos + blog), `robots.txt`, Open Graph + Twitter Card por producto y artículo ✅
- [x] **Edición de perfil** en `/mi-cuenta/perfil` — nombre, teléfono, y gestión de direcciones guardadas ✅
- [x] **Email de confirmación de newsletter** — vía Resend, solo en primera suscripción ✅
- [x] **Modal de despacho masivo** — `PickupModal` en `/pedidos` para seleccionar órdenes con guía y programar recolección Skydropx ✅
- [x] **Blog Draft Mode** — botón "Previsualizar" en el editor activa cookie `__vps_draft` por 1h; artículo se renderiza con banner de borrador ✅

### Pendiente
- [ ] **Cupones de descuento** — tabla `coupons` + validación en checkout + campo en carrito (C-06)
- [ ] **Sincronización carrito con BD** para usuarios logueados (C-07)
- [ ] **Tracking en Mi Cuenta** — timeline visual del estado del pedido / Skydropx
- [ ] **Carrusel de testimonios** en Asesorías (SV-06)
- [ ] **Vercel Analytics** — integración en `apps/web/app/layout.tsx` (SEO-09)
- [ ] **Optimización de imágenes** con `next/image` + dominios Supabase (SEO-08)
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
