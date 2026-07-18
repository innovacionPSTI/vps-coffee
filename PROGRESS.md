# VPS Coffee — Estado del Proyecto
> **Última actualización:** Julio 2026 (v14) · **Stack:** Next.js 16 · Supabase · Stack Auth · Tailwind · Turborepo

---

## ✅ Implementado

### Monorepo (raíz)
- `package.json` con Turborepo + pnpm workspaces
- `turbo.json` con pipelines build/dev/lint
- `pnpm-workspace.yaml`
- `.gitignore` y `.prettierrc`
- `.env.example` con todas las variables documentadas

### `packages/config`
- `tailwind.config.ts` — paleta base compartida (fuentes, sombras, borderRadius arch). Los colores de web y admin son completamente independientes vía CSS custom properties.
- `tsconfig.json` compartido

### `packages/database`
- `src/types.ts` — tipos TypeScript completos de todas las tablas (incluye `payment_config`; campos Resend; `free_shipping_*` en `shipping_config`; `terms_content`, `privacy_content`, `instagram/facebook/tiktok_url/enabled` en `store_config`; `favicon_url` en `store_config`; tabla `admin_config` singleton)
- `src/client.ts` — `createBrowserClient()` y `createServerClient()`
- `src/queries/` — products, orders, blog, shipping-config, store-config, payment-config, **admin-config**
- `supabase/migrations/21_favicon_url.sql` — columna `favicon_url TEXT` en `store_config`
- `supabase/migrations/22_admin_config.sql` — tabla singleton `admin_config` (accent_color, sidebar_color) con CHECK constraint y RLS
- `supabase/migrations/1_initial_schema.sql` — schema completo para Stack Auth: `products` con `variant_options JSONB`; `product_variants` con `attributes JSONB` + dimensiones de envío; `banners` con `image_url_mobile`; `orders` con `coupon_code`; RLS habilitado; buckets de Storage
- `supabase/migrations/2_shipping_config.sql` — tabla `shipping_config` (multi-proveedor, envío gratis, credenciales Skydropx, 8 campos `origin_*`) + tabla `shipping_profiles`
- `supabase/migrations/3_store_config.sql` — tabla `store_config` singleton con branding, Resend, contenido legal (Markdown), redes sociales, mantenimiento y analytics
- `supabase/migrations/4_payment_config.sql` — tabla `payment_config` singleton con credenciales Wompi y MercadoPago
- `supabase/migrations/5_customers.sql` — tabla `customers` (mirror Stack Auth) + FK `orders.customer_id → customers.id` + tabla `cart_items` con FKs a `customers`, `products` y `product_variants` (ON DELETE CASCADE)
- `supabase/migrations/6_customer_addresses.sql` — tabla `customer_addresses` (N direcciones por cliente para pre-llenar checkout)
- `supabase/migrations/7_content_settings.sql` — agrupa `section_settings` (toggles del home), `coupons`, `testimonials` y `themes`; seed de secciones y tema VPS Coffee por defecto
- `supabase/migrations/8_variant_types.sql` — tabla `variant_types` (plantillas reutilizables de atributo); RLS SELECT público + escritura service_role; seed con Tueste/Peso/Molienda
- `supabase/migrations/9_indexes.sql` — índices de rendimiento: `products.category_id`, `product_variants.product_id`, `orders.customer_id/customer_email/status/created_at/coupon_code`, `banners (section, active, order_index)`, `blog_posts (published, published_at)` (9 archivos totales — compactados en v9 desde los 16 originales)
- `src/queries/coupons.ts` — `getCoupons`, `getCouponByCode`, **`validateCoupon` (función pura)**, `createCoupon`, `updateCoupon`, `deleteCoupon`, `incrementCouponUsage`
- `src/queries/testimonials.ts` — `getTestimonials(onlyActive)`, `createTestimonial`, `updateTestimonial`, `deleteTestimonial`
- `src/queries/cart.ts` — `getCartItems`, `upsertCartItem`, `removeCartItem`, `clearCart`, `replaceCart`
- `src/queries/sections.ts` — `getSectionSettings()` (lista todas ordenadas por `order_index`), `isSectionEnabled(key)` (fail-open: devuelve `true` si la tabla no existe)
- `src/queries/themes.ts` — `getThemes()`, `getActiveTheme()`, `createTheme()`, `updateTheme()`, `setActiveTheme()`, `deleteTheme()` (protege activo y predeterminado)
- `src/queries/orders.ts` — `CreateOrderInput` incluye `carrier_name`, `skydropx_rate_id` y `coupon_code` para persistir la transportadora y el cupón usados en el pedido
- `src/queries/variant-types.ts` — `getVariantTypes(activeOnly?)`, `getVariantTypeById`, `createVariantType`, `updateVariantType`, `deleteVariantType`; helper `toVariantType()` deserializa JSONB `values` como `string[]`
- `src/types.ts` — añadidas tablas `order_items` (con `image_url`), `section_settings`, `themes`; añadida función `increment_coupon_usage` en `Database['public']['Functions']`; `variant_options` en `products`, `attributes`+`weight_kg`+`length_cm`+`width_cm`+`height_cm` en `product_variants`

### `packages/ui`
- `Button`, `Badge`, `ProductCard`, `Spinner` — componentes base con variantes VPS
- `cn()` utility (clsx + tailwind-merge)

### `apps/web` — Sitio público
**Setup:**
- `package.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `tsconfig.json`
- `globals.css` — fuentes Ahsing/Geeeki, utilidades arch/scrollbar; **valores por defecto de CSS custom properties** para colores brand (`--brand-primary`, `--brand-cream`, etc. como canales RGB) y fuentes (`--font-display`, `--font-body`)
- `tailwind.config.ts` — **overrides de colores** usando `rgb(var(--brand-xxx) / <alpha-value>)` para soporte de modificadores de opacidad en runtime; fontFamily apunta a `--font-display` y `--font-body`
- `app/layout.tsx` — **carga tema activo** con `getActiveTheme()` e **inyecta `<style>`** en el `<head>` con CSS vars sobreescritas; pre-carga Playfair Display e Inter como alternativas de fuente

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
- `store/cart.ts` — Zustand + localStorage, addItem/removeItem/updateQty/subtotal; **`syncToServer` + `loadFromServer`** para usuarios logueados

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
| `/checkout` | `app/checkout/page.tsx` | 3 pasos — paso 2: comboboxes departamento/ciudad Colombia; si provider=skydropx muestra "Ver opciones de envío →" → lista de transportadoras con precio y días → usuario elige antes de continuar al pago; `shipping_rate` completo (id, carrier_name, service_name, days) se persiste en la orden |
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
| `PATCH /api/account/addresses/[id]` | Edita campos de una dirección guardada; si `is_default=true` limpia la default previa |
| `DELETE /api/account/addresses/[id]` | Elimina dirección verificando que pertenece al cliente |
| `GET /api/account/profile` | Devuelve nombre y teléfono del customer logueado |
| `PATCH /api/account/profile` | Actualiza nombre y teléfono; sincroniza `displayName` en Stack Auth |
| `GET /api/draft/enable` | Activa modo borrador (cookie `__vps_draft` 1h) + redirect a `/blog/[slug]?draft=1` |
| `POST /api/webhooks/wompi` | Verifica firma SHA256, actualiza estado de pago → `createShipmentForOrder()` → email de tracking |
| `POST /api/webhooks/mercadopago` | Consulta pago en API MP, actualiza estado → `createShipmentForOrder()` → email de tracking |
| `POST /api/webhooks/skydropx` | Mapea `workflow_status` / eventos PRO a estado de orden; envía email de tracking al entrar en tránsito |
| `GET /api/maintenance-status` | Retorna `{maintenance_mode}` desde `store_config`; ISR 60s |
| `POST /api/checkout/coupon` | Valida cupón (código + subtotal); retorna `{code, type, value, discount}` o error |
| `GET /api/account/cart` | Retorna items del carrito en BD para el usuario logueado |
| `POST /api/account/cart` | Reemplaza todo el carrito en BD (sincronización completa) |
| `DELETE /api/account/cart` | Limpia el carrito en BD |

**Componentes:**
- `HeroCarousel` — autoplay 5s, fade, dots, flechas; usa `<picture>` + `<source media="(max-width: 768px)">` para mostrar imagen mobile en móvil e imagen desktop en escritorio
- `Footer` — iconos SVG oficiales de Instagram, Facebook y TikTok; se muestran solo si están `enabled: true` y tienen URL configurada; recibe prop `social` desde el layout servidor
- `LegalPage` — componente compartido para `/terminos` y `/privacidad`; converter Markdown→HTML sin dependencias externas (h1/h2/h3, **bold**, *italic*, listas, links); muestra aviso si el contenido está vacío
- `FeaturedProducts` — grid 3 col, add to cart
- `ServicesSection` — async, llama `Promise.all` para URLs de WhatsApp desde BD
- `NewsletterSection` — POST a API route
- `CartDrawer` — slide-in desde derecha, overlay, Escape key
- `ShopClient` — filtros de categoría y atributos dinámicos desde `variant_options`; swatches de color cuando el valor es un color; "Desde $X" cuando hay múltiples precios; "Ver opciones" vs "Agregar" según cantidad de variantes
- `ProductDetail` — galería, selector variantes genérico (cualquier atributo: color/talla/etc.), strikethrough para variantes no disponibles, add to cart
- `lib/variant-utils.ts` — `getProductOptions`, `getVariantAttrs`, `getVariantLabel` (retrocompat. con café legacy), `isColorValue`, `COLOR_HEX` (20 colores españoles → hex)
- `lib/colombia-locations.ts` — 33 departamentos + ~400 municipios; `DEPARTMENTS` (lista ordenada), `getCitiesForDepartment(dept)` (lista ordenada por depto)
- `components/ui/SearchableSelect.tsx` — combobox reutilizable: input + dropdown filtrado, nav por teclado (↑↓ Enter Escape), cierre en click externo, checkmark en seleccionado, key única por índice (evita duplicados como "Buenaventura")
- `components/account/ProfileForm` — editar nombre y teléfono del cliente; PATCH a `/api/account/profile`
- `components/account/AddressesForm` — lista, agregar, **editar inline** y eliminar direcciones; comboboxes departamento/ciudad; botón "Predeterminada"; PATCH+DELETE a `/api/account/addresses/[id]`
- `components/pedidos/PickupModal` — modal para seleccionar órdenes y programar recolección Skydropx
- `components/testimonials/TestimonialsCarousel` — carrusel automático (5s), 3 cards visibles, dots + flechas, pausa en hover; usa datos de BD
- `components/auth/CartSyncOnLogin` — componente invisible montado en root layout; detecta login y sincroniza carrito localStorage ↔ BD
- `lib/whatsapp.ts` — async, lee número desde `getStoreConfig()` en BD; fallback `573XXXXXXXXX`
- `lib/wompi.ts` — `buildWompiCheckoutUrl` (firma SHA256), `verifyWompiWebhook`, `mapWompiStatus`; sin process.env
- `lib/mercadopago.ts` — `createMercadoPagoPreference`, `getMercadoPagoPayment`, `mapMercadoPagoStatus`, `isMercadoPagoSandbox`; sin process.env
- `lib/email.ts` — `sendOrderConfirmation`, `sendShippingNotification`, `sendWelcomeEmail`, `sendNewsletterConfirmation` vía Resend (fetch directo); credenciales como parámetros; **`buildEmailConfig()`** construye `EmailConfig` con `storeName` (desde `store_config.store_name`) y `siteUrl` (desde `NEXT_PUBLIC_SITE_URL`) — elimina todos los valores hardcodeados en plantillas
- `lib/markdown.ts` — **conversor Markdown→HTML sin dependencias externas**, compartido entre blog y páginas legales; soporta h1/h2/h3 (con o sin espacio tras `#`), **bold**, *italic*, `code`, links y listas; extraído de `LegalPage.tsx`; aplicado en `/blog/[slug]/page.tsx`
- `lib/shipping/types.ts` — interfaces `ShippingAddress`, `ShippingRate`, `Parcel`, `calculateParcel()`
- `lib/shipping/index.ts` — factory `getShippingProvider()` + exports de providers
- `lib/shipping/providers/fixed/index.ts` — `FixedRateProvider`: devuelve tarifa fija desde config
- `lib/shipping/providers/skydropx/auth.ts` — OAuth 2.0 client_credentials con cache de token por clientId
- `lib/shipping/providers/skydropx/index.ts` — `SkydropxProvider`: cotización con `address_from` inline (sin `postal_code` — Skydropx Colombia solo requiere `area_level1`+`area_level2`), `declared_amount` calculado desde el total del carrito (requerido por PRO API), polling hasta `is_completed`, extrae tracking de `included[0].attributes`; `createShipment()` completo
- `lib/shipping/shipments.ts` — `createShipmentForOrder(orderNumber)`: carga orden → config → destination → parcel → guía → actualiza orden; idempotente; nunca lanza

### `apps/admin` — Panel de administración
**Setup:**
- `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`
- `globals.css` — **paleta corporativa slate/indigo** como CSS vars por defecto (`--brand-primary`: indigo-600 `#4F46E5`; `--brand-sidebar`: slate-900 `#0F172A`); independiente del sitio web
- `tailwind.config.ts` — reescrito con tokens CSS var para todos los colores brand (incluye `brand-sidebar`); sin colores hardcoded
- `app/layout.tsx` — StackProvider/StackTheme; inyecta `<style>` con CSS vars de `admin_config` en cada request; helpers `hexToRgb` + `darkenHex`

**Auth (Stack Auth):**
- `src/stack.ts` — `StackServerApp` (tokenStore: nextjs-cookie)
- `src/middleware.ts` — protege todas las rutas excepto `/handler/*`; redirige a `/handler/sign-in`
- `src/app/handler/[...stack]/page.tsx` — catch-all handler Stack Auth

**Auth y Roles:**
- `src/lib/roles.ts` — reescrito con `AssignableRole = AdminRole | 'miembro'`; `ADMIN_ROLES`, `ASSIGNABLE_ROLES`, `ROLE_LABELS` (incluyendo miembro), `isAdminRole()` retorna false para miembro
- Roles disponibles: `super_admin`, `admin`, `vendedor`, `gestor_tienda`, `miembro` (sin acceso al panel), `customer`

**Layout:**
- `AdminSidebar` — sidebar `bg-brand-sidebar` (CSS var, configurable desde BD); **grupos colapsables** (Catálogo, Ventas, Contenido, Apariencia, Configuración, **Sistema**); visibilidad filtrada por rol; auto-expande el grupo activo; sub-ítems de Configuración (General, Envíos, Pagos, Emails, Legal); Sistema agrupa Usuarios + **Apariencia del Panel**; Newsletter en grupo Contenido
- `AdminTopbar` — barra superior con búsqueda y avatar

**Componentes:**
- `ImageUpload` — drag & drop, preview, upload a Supabase Storage; prop `onUploadStateChange` notifica al padre cuando hay upload en progreso; prop `sizeClass` para controlar dimensiones (ej. `w-48 h-48` para logo cuadrado)

**Páginas implementadas:**
| Ruta | Contenido |
|------|-----------|
| `/dashboard` | **Dashboard adaptado por rol**: admin ve ventas/métricas/stock; vendedor ve estado de órdenes urgentes y stock bajo; gestor_tienda ve secciones web, blog, banners y cupones próximos a vencer |
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
| `/configuracion` | → redirige a `/configuracion/general` |
| `/configuracion/general` | `StoreConfigForm` — WhatsApp, logo, nombre, email, redes sociales, **modo mantenimiento**, **analytics toggle**, **favicon** (upload con preview) |
| `/sistema/apariencia` | `AdminConfigForm` — color picker para acento (botones/nav) y sidebar del panel; presets de paleta; vista previa en tiempo real; guarda en `admin_config` |
| `/configuracion/envios` | `ShippingConfigForm` — tarifa fija, envío gratis, Skydropx, dirección de origen con comboboxes departamento/ciudad Colombia (solo admin/super_admin) |
| `/configuracion/pagos` | `PaymentConfigForm` — Wompi + MercadoPago (solo admin/super_admin) |
| `/configuracion/emails` | `EmailConfigForm` — Resend (solo admin/super_admin) |
| `/configuracion/legal` | `LegalConfigForm` — editor Markdown Términos/Privacidad |
| `/cupones` | CRUD de cupones — código (uppercase), tipo (%), valor, mínimo de pedido, usos máximos, expiración, estado activo; badges Activo/Inactivo/Expirado/Agotado |
| `/testimonios` | CRUD de testimonios — nombre, cargo, contenido, avatar, rating estrellas, orden, toggle visible; vista en tarjetas |
| `/secciones` | **Hub central de contenido configurable**: toggles para habilitar/deshabilitar secciones del home (hero, productos destacados, servicios, más vendidos, blog preview, newsletter); CRUD inline de servicios (banners de tipo `services`) |
| `/configuracion/temas` | **Editor de temas** — crear/editar perfiles de colores y tipografía; color pickers por campo brand; selector fuente display (Cormorant / Playfair) y body (DM Sans / Inter); preview en tiempo real; activar tema → se aplica al sitio inmediatamente |
| `/newsletter` | **Gestión de newsletter** — pestaña Suscriptores (tabla con email, fecha, estado activo/inactivo + exportar CSV) y pestaña Enviar campaña (formulario asunto + cuerpo Markdown, preview destinatarios activos, confirmación, feedback de resultado) |

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
| `GET /api/admin/coupons` | Lista todos los cupones |
| `POST /api/admin/coupons` | Crea cupón (código → uppercase); detecta duplicado (409) |
| `PATCH /api/admin/coupons` | Edita cupón o cambia estado activo/inactivo |
| `DELETE /api/admin/coupons` | Elimina cupón |
| `GET /api/admin/testimonios` | Lista todos los testimonios (incluyendo inactivos) |
| `POST /api/admin/testimonios` | Crea testimonio |
| `PATCH /api/admin/testimonios` | Edita testimonio o cambia visibilidad |
| `DELETE /api/admin/testimonios` | Elimina testimonio |
| `GET /api/admin/sections` | Lista todas las secciones web con estado `enabled` |
| `PATCH /api/admin/sections/[key]` | Habilita o deshabilita una sección del sitio |
| `GET /api/admin/themes` | Lista todos los temas de color/tipografía |
| `POST /api/admin/themes` | Crea un nuevo tema (inactivo por defecto) |
| `PATCH /api/admin/themes/[id]` | Edita campos del tema; `{ setActive: true }` lo activa globalmente |
| `DELETE /api/admin/themes/[id]` | Elimina tema (no permite borrar activo ni predeterminado) |
| `GET /api/admin/newsletter` | Lista todos los suscriptores de newsletter ordenados por fecha descendente |
| `POST /api/admin/newsletter/send` | Broadcast de email a todos los suscriptores activos vía Resend; lee credenciales desde `store_config`; envío en lotes de 50; retorna `{total, sent, failed}` |
| `PATCH /api/admin/sistema` | Actualiza `admin_config` (accent_color, sidebar_color); solo super_admin y admin |
| `GET /api/admin/export` | Snapshot JSON v3: store_config, **admin_config**, **themes**, nav_items, pages, page_sections, section_items |
| `POST /api/admin/import` | Restaura snapshot v3 idempotente; compatible con v2 y v1 (legacy keys ignoradas) |
| `GET /api/admin/cms/[resource]` | Lista todos los registros del recurso CMS (`pages`, `sections`, `items`, `section-settings`); soporta filtro por query param (`page_key`, `section_id`) |
| `POST /api/admin/cms/[resource]` | Crea un nuevo registro; valida campos requeridos según config del recurso; retorna 201 con el registro creado |
| `PATCH /api/admin/cms/[resource]` | Actualiza un registro por pk (`key` o `id`); require pk en body; retorna error si no hay campos para actualizar |
| `DELETE /api/admin/cms/[resource]` | Elimina un registro por pk en query param; `pkNumeric` convierte id a número para `page_sections` y `section_items` |

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

### Completado en v4
- [x] **Sub-navegación de Configuración** — sidebar con grupo expandible y 5 sub-rutas (General, Envíos, Pagos, Emails, Legal) ✅
- [x] **Modo mantenimiento** — toggle en admin → middleware Next.js redirige todo el sitio; caché 60s; página `/maintenance` con WhatsApp ✅
- [x] **Cupones de descuento** (C-06) — tabla `coupons`, `validateCoupon` (función pura), API checkout `/coupon`, campo con "Aplicar" en resumen del checkout, CRUD en `/cupones` del admin ✅
- [x] **Selección de transportadora** (S-04) — checkout muestra radio buttons con tarifas Skydropx disponibles; el cliente elige su opción de envío ✅
- [x] **Carrusel de testimonios** (SV-06) — CRUD en `/testimonios` del admin; carrusel automático con 3 cards en `/asesorias`; solo se muestra si hay testimonios activos ✅
- [x] **Sincronización carrito con BD** (C-07) — `cart_items` en Supabase; `CartSyncOnLogin` detecta login, fusiona localStorage + BD; mutations fire-and-forget hacia `/api/account/cart` ✅
- [x] **Vercel Analytics** (SEO-09) — `<Analytics />` condicional según `store_config.analytics_enabled`; toggle en `/configuracion/general` ✅
- [x] **next/image con Supabase CDN** (SEO-08) — `next.config.ts` con `remotePatterns` para `supabase.co`; imágenes optimizadas con `<Image>` ✅

### Completado en v5
- [x] **Secciones web configurables** — tabla `section_settings`; página `/secciones` en admin con toggles enable/disable; home respeta flags; fail-open (si no existe la tabla, todas las secciones se muestran) ✅
- [x] **Servicios dinámicos** — servicios separados de banners; CRUD inline en `/secciones`; `ServicesSection.tsx` renderiza N paneles desde BD; auto-detección de WhatsApp en CTA ✅
- [x] **Dashboard por rol** — `admin/super_admin`: ventas hoy/semana/mes, stock crítico, pedidos recientes, top productos; `vendedor`: conteo por estado, órdenes urgentes (rojo si >2 días), stock bajo; `gestor_tienda`: secciones activas, blog borradores, banners hero, testimonios inactivos, cupones por vencer ✅
- [x] **Sidebar con grupos colapsables** — NavGroup/NavLeaf/NavLeafWithSubs; grupos: Catálogo, Ventas, Contenido, Administración; visibility filtrada por rol; auto-expande grupo activo ✅
- [x] **Roles actualizados** — `secciones` añadida a AdminSection; vendedor acotado a ventas; gestor_tienda incluye secciones/testimonios/cupones/configuracion ✅
- [x] **Sistema de temas** — tabla `themes`; CSS custom properties en web (`rgb(var(--brand-xxx) / <alpha-value>)`) para soporte de opacidad; layout inyecta tema activo como `<style>` en `<head>`; fuentes opcionales Playfair Display e Inter pre-cargadas; editor en `/configuracion/temas` con color pickers, selectores de fuente y preview en vivo ✅
- [x] **Corrección de tipos Database** — `order_items`, `section_settings`, `themes` añadidas a `Database['public']['Tables']`; `increment_coupon_usage` añadida a `Functions`; ambas apps pasan `tsc --noEmit` sin errores ✅

### Completado en v6
- [x] **Gestión de newsletter desde admin** — página `/newsletter` bajo grupo Contenido (accessible para gestor_tienda+); pestaña suscriptores con tabla y exportación CSV; pestaña composición con formulario Markdown + broadcast vía Resend en lotes; confirmación antes de enviar ✅
- [x] **Conversor Markdown compartido** — `lib/markdown.ts` extraído a librería compartida; `/blog/[slug]` y `LegalPage.tsx` lo usan; corregida detección de títulos sin espacio tras `#` (ej. `##texto`) ✅
- [x] **`'newsletter'` en roles y sidebar** — `AdminSection` extendido; `ROLE_CONFIG` actualizado para super_admin, admin y gestor_tienda; ítem 📧 Newsletter añadido al grupo Contenido ✅

### Completado en v7
- [x] **Eliminación de valores hardcodeados en emails** — `lib/email.ts` reescrito: `storeName` y `siteUrl` vienen de `store_config` y `NEXT_PUBLIC_SITE_URL`; helper `buildEmailConfig()` actualizado en los 5 callers (wompi, mercadopago, skydropx, newsletter, welcome); `admin/newsletter/send/route.ts` corregido (footer ya no tiene `vpscoffee.com` hardcodeado) ✅
- [x] **Consolidación de migraciones** — reducidas de 19 a 13 archivos; 6 `ALTER TABLE` eliminados (6_email_config, 10_shipping_free_threshold, 11_legal_content, 12_social_links, 13_skydropx_origin_address, 14_maintenance_mode); sus columnas incorporadas en las migraciones CREATE TABLE originales (2 y 4); archivos renumerados sin colisiones; ambas apps pasan `tsc --noEmit` ✅

### Completado en v8
- [x] **Sistema de variantes genérico** — `variant_options JSONB` en `products` + `attributes JSONB` en `product_variants`; `lib/variant-utils.ts` con `getProductOptions`, `getVariantAttrs`, `getVariantLabel`, `isColorValue`, `COLOR_HEX` (20 colores); retrocompatible con campos legacy `roast`/`weight`/`grind`; `ShopClient` con swatches de color, "Desde $X", filtros dinámicos; `ProductDetail` con selector genérico ✅
- [x] **Dimensiones de envío en variantes** — `weight_kg`, `length_cm`, `width_cm`, `height_cm` en `product_variants`; migración 14 compacta las dos extensiones anteriores (15→14) ✅
- [x] **Comboboxes Colombia** — `lib/colombia-locations.ts` con 33 departamentos y ~400 municipios; `SearchableSelect` reutilizable (filtro, teclado, key por índice para evitar duplicados como "Buenaventura"); aplicado en checkout, admin/configuracion/envios y Mi Cuenta/perfil ✅
- [x] **Fix Skydropx 422** — eliminado `postal_code` de cotizaciones (Skydropx CO solo requiere area_level1+area_level2); `declared_amount` calculado desde el total del carrito (campo requerido por PRO API) ✅
- [x] **Selector de tarifa en checkout** — paso 2 separado: "Ver opciones de envío →" carga tarifas Skydropx y las muestra con carrier, servicio, días y precio; usuario elige antes de continuar; `shipping_rate` completo (`id`, `carrier_name`, `service_name`, `days`) persistido en `orders.carrier_name` y `orders.skydropx_rate_id` ✅
- [x] **Direcciones editables en Mi Cuenta** — `PATCH /api/account/addresses/[id]` (editar campos, manejar default exclusivo) + `DELETE /api/account/addresses/[id]`; `AddressesForm` reescrito con edición inline, botón Predeterminada y Eliminar ✅

### Completado en v9
- [x] **Tipos de variantes globales** — tabla `variant_types` (migración 15); CRUD completo en `/variantes` del admin; integrado en `ProductForm` con matriz cartesiana automática (Generar combinaciones → cada variante hereda `attributes` JSONB con los valores correctos); `AdminSidebar` + `roles.ts` actualizados; seed Tueste/Peso/Molienda ✅
- [x] **ProductForm reescrito** — selección de tipos globales, botón "Generar combinaciones" (producto cartesiano), preserva datos existentes al re-generar, campo `attributes` por variante; páginas de nuevo/editar reciben `variantTypes: VariantType[]` ✅
- [x] **ShopClient con sidebar de filtros** — layout sticky desktop + drawer mobile; `FilterPanel` compartido; checkboxes visuales; atributos dinámicos desde `variant_options` de los productos ✅
- [x] **Categorías con imagen y drag-to-reorder** — `CategoryFormModal` con `ImageUpload` (bucket `banners`), `uploadsInProgress` counter, `SavedCategory` exportada; `CategoriasClient` con HTML5 drag-and-drop, handle visual, thumbnail, actualización paralela vía PATCH ✅
- [x] **Auditoría DB e integridad referencial** — migración 16: FKs en `cart_items`, 6 índices de rendimiento, columna `orders.coupon_code` (bug fix: pérdida silenciosa de datos), RLS `variant_types`, índices compuestos para banners y blog_posts; `types.ts` y `queries/orders.ts` actualizados; ambas apps pasan `tsc --noEmit` ✅

### Completado en v10
- [x] **CMS de contenido y SEO por página** — migraciones 10–15: `trust_badges`, `pages`, `nav_items`, reestructuración de contenido (`page_sections` + `section_items` + `section_settings` unificados), `media_assets`, `store_seo`; editor unificado `/contenido` con árbol de navegación y editor de secciones; `/home` con editor de banners + section settings; rutas dinámicas `[slug]` con `generateMetadata()` leyendo `meta_title` y `meta_description` por página ✅
- [x] **Export/Import de contenido (JSON)** — `GET /api/admin/export` genera snapshot de 7 tablas (`store_config`, `nav_items`, `pages`, `page_sections`, `section_items`, `section_settings`, `banners`) con `Content-Disposition: attachment`; `POST /api/admin/import` restaura idempotentemente usando upsert con claves estables (`nav_key`, `section_key`, `key`); widget `DataTransferWidget` en `/configuracion/general`; respuesta 207 en errores parciales ✅
- [x] **Dashboard con stats reales** — `super_admin`/`admin` leen ventas hoy/semana/mes desde `orders`; `vendedor` ve conteo por estado y stock bajo; `gestor_tienda` ve banners home activos (filtro `page_key IS NULL`) ✅
- [x] **Fix sidebar naming** — "Contenido > Contenido" renombrado a "Contenido > Páginas" (icono 📄); doble anidado "Configuración > Configuración" eliminado promoviendo `NavLeafWithSubs` a nivel raíz del NAV array; tipo `NavNode` extendido; auto-expande cuando `pathname` comienza con `/configuracion` ✅
- [x] **Fix roles en /testimonios y /cupones** — guard hardcodeado `super_admin | admin` reemplazado por `canAccess()` de `lib/roles.ts`; `gestor_tienda` accede correctamente a ambas secciones ✅
- [x] **Búsqueda y paginación en /pedidos** — `searchParams: Promise<...>` (Next.js 16); búsqueda `.or()` por `order_number`, `customer_name`, `customer_email`; paginación 30/página con count exacto; componente `PedidosSearch` client debounced 400ms; `filterHref()` helper preserva params al navegar ✅
- [x] **Notas internas en pedidos** — migración `16_order_notes.sql` añade `internal_notes TEXT`; `PATCH /api/admin/orders/[id]/notes` (acceso vendedor+); componente `OrderNotes` con textarea auto-guardable y feedback "✓ Guardado" ✅
- [x] **Email de notificación al cambiar estado** — `apps/admin/src/lib/email.ts` con `sendShippingNotification` y `sendStatusNotification` (fetch directo a Resend, credenciales desde `store_config`); `PATCH /orders/[id]/status` dispara email automático para `shipped` (tracking + carrier), `delivered` y `cancelled`; fire-and-forget, nunca bloquea la respuesta ✅
- [x] **Búsqueda en /productos** — `searchParams: Promise<...>` en `ProductosPage`; filtro `.ilike('name', ...)` en Supabase; `ProductosSearch` client component debounced; empty state diferenciado con/sin búsqueda ✅
- [x] **Página de detalle de cliente** — `/clientes/[email]` con datos de perfil (si existe en `customers`), estadísticas (pedidos, total gastado, ticket promedio) e historial de pedidos con link a `/pedidos/[id]`; badge "Con cuenta" / "Invitado"; 404 si el email no existe ✅
- [x] **Filas clickeables en /clientes** — `Link` a `/clientes/[email]` con `encodeURIComponent`; hover suave; cursor pointer en toda la fila ✅
- [x] **Fix OrderStatusUpdater** — `router.refresh()` después de guardar actualiza timeline y chip de estado sin reload manual; indicador "✓ Actualizado" / "Error al guardar" por 2.5s ✅
- [x] **Next.js 16 compat** — todos los `params` y `searchParams` en page/route files tipados como `Promise<...>` y awaited ✅

### Completado en v11
- [x] **CMS Home — Parte A: imagen mobile en banners** — campo `image_url_mobile` en `BannerFormState`; estado `pickerTarget: 'desktop' | 'mobile'`; dos botones de picker separados (🖼️ desktop / 📱 mobile); `HomeClient.tsx` actualizado; export/import ya cubiertos por `select('*')` y upsert completo ✅
- [x] **CMS Home — Categorías dinámicas** — `getCategories()` añadida a `packages/database/src/queries/products.ts`; `Promise.all` en `page.tsx` ahora incluye las categorías; sección "Tienda" en home renderiza links dinámicos desde BD (`.slug` + `.name`) en lugar de array hardcodeado ✅
- [x] **CMS Home — Guard `enabled('historia')`** — sección Historia envuelta en `{enabled('historia') && ...}`, controlable desde el panel admin sin código ✅
- [x] **Metadata JSONB generalizada en `section_settings`** — migración 17: columna `metadata JSONB NULL`; seed de sección 'historia' con título, subtítulo y CTA como JSON; admin muestra editor inline para cualquier sección que tenga metadata; web lee con fallbacks a strings hardcodeados; patrón extensible a cualquier sección futura ✅
- [x] **Análisis arquitectural** — identificadas 5 categorías de deuda técnica: (1) rutas API zombie sin auth (`/api/admin/banners`), (2) directorios zombie `/banners/` y `/secciones/` con ~800 líneas de código muerto, (3) código duplicado entre apps (SearchableSelect, colombia-locations, email.ts, skydropx/auth.ts), (4) dos modelos CMS coexistentes (banners+section_settings vs pages+page_sections), (5) páginas legales /privacidad y /terminos fuera del CMS ✅

### Completado en v13 — Épica 10: CMS Unificado + Limpieza Arquitectural

- [x] **HU-052 — API CMS genérica** — `GET|POST|PATCH|DELETE /api/admin/cms/[resource]` maneja pages/sections/items; 4 endpoints legacy eliminados; 35 tests de integración ✅
- [x] **HU-053 — Migración 19: CMS unificado** — banners, section_settings y testimonials migrados a `page_sections` + `section_items` y tablas eliminadas. `section_items` extendido con `image_url_mobile`, `link_url`, `cta_text`, `metadata JSONB` ✅
- [x] **HU-054 — packages/database actualizado** — `types.ts` refleja el nuevo schema; `queries/home.ts` reescrito (`getWebHomeData` con `homeSections`); `queries/content.ts` actualizado (`updateSectionItem` con metadata como Json); archivos zombie `banners.ts`, `testimonials.ts`, `sections.ts` eliminados ✅
- [x] **HU-055 — apps/web actualizado** — home reescrito para leer secciones del CMS unificado; `HeroCarousel`, `ServicesSection`, `TestimonialsSection` reciben datos de `section_items` ✅
- [x] **HU-056/057 — apps/admin limpiado** — `ContenidoClient.tsx` extendido con editor por tipo (hero/services/testimonials/cards/faq); directorios zombie `/home`, `/testimonios` y sus API routes eliminados; `AdminSidebar` y `roles.ts` actualizados ✅
- [x] **Migración 20 — integridad y rendimiento** — NOT NULL en metadata, índices compuestos, índice GIN (JSONB), triggers `updated_at` en section_items/nav_items, CHECK constraint `section_type` con normalización de valores desconocidos a `'text'` ✅
- [x] **Esquema canónico compactado** — `01_schema.sql` unifica las 20 migraciones en un solo archivo limpio para despliegue desde cero; seeds separados `01_config.sql` y `02_content.sql` ✅
- [x] **Limpieza total de código muerto** — export/import routes, cms route, dashboard actualizados; JSDoc actualizado para eliminar referencias a tablas eliminadas ✅
- [x] **`tsc --noEmit --skipLibCheck` limpio** — sin errores en apps/web y apps/admin ✅
- [x] **Tests `home.test.ts` reescritos** — cubre la nueva firma `getWebHomeData()` con `homeSections` anidados, fail-open por query y mocks de Supabase actualizados ✅

### Completado en v12 — Épica 9: Arquitectura Limpia y Generalización CMS
- [x] **HU-044 — Eliminar rutas API zombie** — eliminadas `/api/admin/banners/` (sin auth guard, security hole), `/api/admin/sections/` y `/api/admin/pages/` (legacy, sin usar); ~800 líneas de código muerto removidas ✅
- [x] **HU-045 — Eliminar directorios zombie** — eliminados `/banners/`, `/secciones/` y `/paginas/` en apps/admin; las rutas en sidebar ya apuntaban a `/home` y `/contenido` ✅
- [x] **HU-046 — Consolidar `SearchableSelect` en `packages/ui`** — componente movido a `packages/ui/src/SearchableSelect.tsx`; admin usa `@vps/ui`; web mantiene copia local por limitación de Turbopack con `'use client'` en barrels ✅
- [x] **HU-047 — Consolidar `colombia-locations` en `packages/ui`** — `DEPARTMENTS`, `COLOMBIA_LOCATIONS`, `getCitiesForDepartment` movidos a `packages/ui/src/colombia-locations.ts`; eliminados de web, admin y database; tests actualizados al nuevo import ✅
- [x] **HU-048 — Consolidar `email.ts` compartido** — creado `packages/database/src/lib/email.ts` con `EmailConfig`, `sendShippingNotification` y `sendStatusNotification` (unificadas con firma flexible); `apps/admin/src/lib/email.ts` reducido a 2 líneas de re-export; `apps/web/src/lib/email.ts` conserva solo funciones web-only (`buildEmailConfig`, `sendOrderConfirmation`, `sendNewsletterConfirmation`, `sendWelcomeEmail`) e importa el resto de `@vps/database` ✅
- [x] **HU-049 — Migrar `/privacidad` y `/terminos` al CMS** — migración `18_legal_pages.sql`: seed idempotente de páginas + secciones de texto por defecto; rutas web actualizan a `getPageWithSections()` con fallback a `store_config` para compatibilidad retroactiva; `meta_title` y `meta_description` desde la página del CMS ✅
- [x] **HU-050 — Crear `getWebHomeData()`** — `packages/database/src/queries/home.ts` consolida las 6 queries paralelas del home; `apps/web/(public)/page.tsx` hace una sola llamada; nombre `getWebHomeData` evita colisión con `getHomeData` existente en `sections.ts` (admin editor) ✅
- [x] **`packages/ui` zero-dependency** — `cn.ts` reescrito en JS puro sin `clsx`/`tailwind-merge`; resuelve fallo de build por resolución estricta de pnpm en Vercel ✅
- [x] **`tsc --noEmit` limpio** — sin errores en apps/web y apps/admin después de todos los cambios ✅

### Completado en v14 — Favicon + Identidad corporativa del panel
- [x] **HU-058 — Favicon configurable** — migración `21_favicon_url.sql`; campo `favicon_url` en `store_config` + tipo; UI `ImageUpload` en `/configuracion/general` con preview inline; `generateMetadata` en `apps/web` inyecta `icons: { icon, shortcut }` y `<link rel="icon">` en `<head>` ✅
- [x] **HU-059 — Admin con identidad visual propia** — separación total de temas web y admin:
  - `admin_config` singleton (migración `22_admin_config.sql`): `accent_color` y `sidebar_color`; CHECK constraint; RLS; seed corporativo `#4F46E5` / `#0F172A`
  - `packages/database/src/queries/admin-config.ts`: `AdminConfig`, `getAdminConfig()`, `updateAdminConfig()`; registro en `types.ts`
  - `apps/admin/tailwind.config.ts` reescrito: colores `brand-*` como `rgb(var(--xxx) / <alpha-value>)`; nuevo token `brand-sidebar` para fondo del sidebar
  - `apps/admin/globals.css` reescrito: paleta corporativa slate/indigo por defecto en CSS vars
  - `apps/admin/layout.tsx`: `getAdminConfig()` → `hexToRgb`/`darkenHex` → `<style>` inyectado en `<head>` sobreescribe vars de globals.css
  - `AdminSidebar`: `bg-brand-sidebar` en `<aside>` (antes `bg-brand-primary`)
  - `roles.ts`: nueva `AdminSection` `'sistema'`; disponible para `super_admin` y `admin`
  - `AdminSidebar`: grupo Sistema ampliado con `/sistema/apariencia` (sección `'sistema'`)
  - `PATCH /api/admin/sistema`: guard super_admin/admin; upsert en `admin_config`
  - `/sistema/apariencia/page.tsx` + `AdminConfigForm.tsx`: color pickers, presets de paleta, vista previa en tiempo real
  - Export/Import actualizado a **v3**: incluye `admin_config` y `themes`; import maneja los 3 versiones; respuesta devuelve `version` del snapshot ✅

### Completado en v15 — Épica 15: Proveedores Intercambiables (Iteraciones 1-6)

#### Iteraciones 1-4 (sesión anterior)
- [x] **HU-082/083/084** — `ShippingProvider` + `SkydropxProvider` + `FixedPriceProvider` + factory; selector admin; checkout usa factory ✅
- [x] **HU-085/086/087** — `PaymentGateway` + `WompiGateway` + `MercadoPagoGateway` + factory; toggles admin; checkout solo muestra pasarelas activas ✅
- [x] **HU-088** — `TuCompraGateway` (MD5 signature, sandbox/prod); webhook `/api/webhooks/tucompra`; tipo `tucompra` en `payment_method` ✅
- [x] **HU-089/090** — `EmailProvider` + `ResendProvider` + factory `getEmailProvider()`; campo `email_provider` en `store_config`; selector en admin ✅
- [x] **HU-060** — Tracking en Mi Cuenta: `/mi-cuenta/pedidos/[id]` con timeline visual (pending→processing→shipped→delivered); tracking number, tabla de ítems, dirección, totales; verificación de propiedad por email ✅
- [x] **`/api/checkout/gateways`** — endpoint público que devuelve pasarelas activas; `CheckoutClient` las carga dinámicamente con fallback ✅

#### Iteración 5 — Polish
- [x] **HU-079 — Responsive admin** — `AdminSidebar` self-contained: hamburger fijo `top-0 left-0 z-50 md:hidden`, overlay backdrop, `<aside>` con `fixed md:relative` + `translate-x` animation; layout.tsx añade `pl-14 md:pl-0` al topbar ✅
- [x] **HU-080 — JSON-LD structured data** — schema `Product` (con offers, brand, images) en `/tienda/[slug]`; schema `Article` (con author/publisher desde store_config) en `/blog/[slug]` ✅
- [x] **HU-081 — Fuentes adicionales en editor de temas** — añadidos `Lora` y `Merriweather` como display; `Montserrat` y `Nunito` como body; registrados en `FONT_DISPLAY_MAP`/`FONT_BODY_MAP` del web layout y en `TemasClient.tsx` ✅
- [x] **Tests newsletter** — `newsletter.integration.test.ts`: 10 casos para GET/POST con auth, validaciones, Resend mock ✅
- [x] **Tests admin-config/sistema** — `sistema.integration.test.ts` + `admin-config.test.ts`: cobertura de `getAdminConfig`, `updateAdminConfig`, PATCH /api/admin/sistema (auth, filtro falsy, propagación de errores) ✅

#### Iteración 6 — Infraestructura y Seguridad
- [x] **HU-061 — GitHub Actions CI/CD** — `.github/workflows/ci.yml`: TypeScript check → tests → deploy web+admin a Vercel en `main`; preview URL con comentario en PR para branches ✅
- [x] **HU-062 — Security hardening**:
  - `/api/admin/*` — todos protegidos con `getAdminUser()` (ya estaban) ✅
  - Wompi webhook — HMAC SHA256 con `eventsSecret` (ya implementado) ✅
  - MercadoPago webhook — pull model: el estado se consulta directamente a la API de MP con nuestro `access_token`, sin depender del cuerpo del webhook ✅
  - TuCompra webhook — MD5 signature verification ✅
  - **Rate limiting** en `/api/checkout` — 10 req/min por IP, respuesta 429 con `Retry-After` ✅
  - **CSP headers** en `apps/web/next.config.ts` — `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `HSTS` ✅
  - **CSP headers** en `apps/admin/next.config.ts` — mismas directivas (sin Google Fonts, con Stack Auth domain) ✅

#### Épica 15 — Estado final
- [x] **HU-082 a HU-090** — todas completas ✅
- [x] `tsc --noEmit --skipLibCheck` pasa en `apps/web` y `apps/admin` ✅

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

### 4. Ejecutar schema y seeds en Supabase
Abrir el SQL Editor de Supabase y ejecutar en orden (**3 archivos — despliegue desde cero**):
```
packages/database/supabase/migrations/01_schema.sql   ← schema completo (único archivo)
packages/database/supabase/seeds/01_config.sql        ← tema, variantes, categorías, nav base
packages/database/supabase/seeds/02_content.sql       ← páginas, secciones e ítems CMS
```

> **v13 — esquema canónico compactado:** Las 20 migraciones históricas (1_initial_schema.sql … 20_integrity_and_indexes.sql) se conservan en la carpeta `migrations/` como registro de la evolución del proyecto, pero **para un despliegue nuevo usar únicamente `01_schema.sql`**. El esquema canónico incorpora desde el inicio todas las columnas, FKs, índices compuestos, triggers `updated_at`, CHECK constraints y comentarios de tabla que antes se añadían en migraciones sucesivas.

> Si ya tienes una instancia corriendo con las 20 migraciones aplicadas, **no** ejecutes `01_schema.sql` — el esquema ya está al día.

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
│   │       ├── markdown.ts             — markdownToHtml(); h1/h2/h3, bold, italic, code, links, listas
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
│       │   ├── cupones/
│       │   ├── testimonios/
│       │   ├── secciones/
│       │   │   ├── page.tsx            — Server Component: carga section_settings + services banners
│       │   │   └── SeccionesClient.tsx — toggles enable/disable + CRUD inline de servicios
│       │   ├── newsletter/
│       │   │   ├── page.tsx            — Server Component: auth guard (gestor_tienda+) + carga suscriptores
│       │   │   └── NewsletterClient.tsx — tabs: Suscriptores (tabla + CSV) y Enviar campaña (Markdown + broadcast)
│       │   ├── configuracion/
│       │   │   ├── page.tsx            — redirige a /configuracion/general
│       │   │   ├── general/
│       │   │   │   └── page.tsx        — StoreConfigForm (WhatsApp, logo, nombre, email, redes, mantenimiento, analytics)
│       │   │   ├── envios/
│       │   │   │   └── page.tsx        — ShippingConfigForm (proveedor, tarifa fija, envío gratis, Skydropx, origen)
│       │   │   ├── pagos/
│       │   │   │   └── page.tsx        — PaymentConfigForm (Wompi + MP)
│       │   │   ├── emails/
│       │   │   │   └── page.tsx        — EmailConfigForm (Resend API key + from email)
│       │   │   ├── legal/
│       │   │   │   └── page.tsx        — LegalConfigForm (Markdown Términos + Privacidad)
│       │   │   └── temas/
│       │   │       ├── page.tsx        — Server Component: auth guard + getThemes()
│       │   │       └── TemasClient.tsx — ThemeCard, ThemeModal, ThemePreview; color pickers, font selectors, live preview
│       │   └── api/admin/
│       │       ├── products/           — POST (crea con imágenes), GET/PATCH/DELETE [id]
│       │       ├── orders/[id]/status/
│       │       ├── shipping/           — GET+PATCH con validación y secret masking
│       │       ├── config/             — GET+PATCH store_config + Resend; enmascara resend_api_key
│       │       ├── payment-config/     — GET+PATCH payment_config; secrets ••••last4 + has_* flags
│       │       ├── upload/             — POST/DELETE con auto-create de bucket
│       │       ├── sections/
│       │       │   └── [key]/route.ts  — PATCH: habilita/deshabilita sección
│       │       ├── themes/
│       │       │   ├── route.ts        — GET (listar) + POST (crear)
│       │       │   └── [id]/route.ts   — PATCH (editar o setActive) + DELETE (guarda activo/default)
│       │       └── newsletter/
│       │           ├── route.ts        — GET: lista newsletter_subscribers ordenados por fecha
│       │           └── send/route.ts   — POST: broadcast a suscriptores activos vía Resend (lotes 50); Markdown→HTML inline
│       └── components/
│           ├── layout/                 — AdminSidebar (grupos colapsables, rol-aware), AdminTopbar
│           └── ImageUpload.tsx         — drag & drop; onUploadStateChange callback
│
├── packages/
│   ├── ui/src/
│   ├── database/src/
│   │   ├── lib/
│   │   │   └── email.ts                — EmailConfig, sendShippingNotification, sendStatusNotification (compartidas)
│   │   ├── queries/
│   │   │   ├── products.ts             — getProducts, getProductBySlug, getFeaturedProducts, getBestSellingProducts, getCategories
│   │   │   ├── orders.ts
│   │   │   ├── blog.ts
│   │   │   ├── banners.ts
│   │   │   ├── shipping-config.ts
│   │   │   ├── store-config.ts         — getStoreConfig / updateStoreConfig
│   │   │   ├── coupons.ts              — getCoupons, validateCoupon (pura), CRUD, incrementCouponUsage
│   │   │   ├── testimonials.ts         — getTestimonials(onlyActive), CRUD
│   │   │   ├── cart.ts                 — getCartItems, upsertCartItem, removeCartItem, clearCart, replaceCart
│   │   │   ├── sections.ts             — getSectionSettings(), isSectionEnabled(), getHomeData() (admin editor)
│   │   │   ├── themes.ts               — getThemes(), getActiveTheme(), createTheme(), updateTheme(), setActiveTheme(), deleteTheme()
│   │   │   ├── content.ts              — getPages, getPageBySlug, getPageWithSections, CRUD pages/sections/items
│   │   │   ├── nav.ts                  — getNavItems, CRUD nav_items
│   │   │   ├── media.ts                — getMediaAssets, CRUD media_assets
│   │   │   └── home.ts                 — getWebHomeData() (consolida 6 queries paralelas del home público)
│   │   └── supabase/migrations/         — 18 archivos
│   │       ├── 1_initial_schema.sql      — Stack Auth-native: sin FK auth.users, sin triggers
│   │       ├── 2_shipping_config.sql     — shipping_config con multi-proveedor, envío gratis y origen Skydropx
│   │       ├── 3_store_config.sql        — store_config con branding, Resend, legal, sociales, toggles
│   │       ├── 4_payment_config.sql
│   │       ├── 5_customers.sql
│   │       ├── 6_customer_addresses.sql
│   │       ├── 7_content_settings.sql    — section_settings, coupons, testimonials, themes + seeds
│   │       ├── 8_variant_types.sql
│   │       ├── 9_indexes.sql
│   │       ├── 10_trust_badges.sql
│   │       ├── 11_pages.sql              — pages, page_sections, section_items, nav_items
│   │       ├── 12_nav_items.sql
│   │       ├── 13_content_restructure.sql
│   │       ├── 14_structural_cleanup.sql — section_key, nav_key, page_key, media_assets
│   │       ├── 15_store_seo.sql          — SEO por página
│   │       ├── 16_order_notes.sql        — notas internas en pedidos
│   │       ├── 17_home_sections.sql      — metadata JSONB en section_settings + seed historia
│   │       └── 18_legal_pages.sql        — seed /privacidad y /terminos en tabla pages (idempotente)
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
