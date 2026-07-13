# VPS Coffee — Estado del Proyecto
> **Última actualización:** Julio 2026 (v8) · **Stack:** Next.js 15 · Supabase · Stack Auth · Tailwind · Turborepo

---

## ✅ Implementado

### Monorepo (raíz)
- `package.json` con Turborepo + pnpm workspaces
- `turbo.json` con pipelines build/dev/lint
- `pnpm-workspace.yaml`
- `.gitignore` y `.prettierrc`
- `.env.example` con todas las variables documentadas

### `packages/config`
- `tailwind.config.ts` — paleta VPS completa (colores hardcoded para admin, fuentes, sombras, borderRadius arch)
- `tsconfig.json` compartido

### `packages/database`
- `src/types.ts` — tipos TypeScript completos de todas las tablas (incluye `payment_config`; campos Resend; `free_shipping_*` en `shipping_config`; `terms_content`, `privacy_content`, `instagram/facebook/tiktok_url/enabled` en `store_config`)
- `src/client.ts` — `createBrowserClient()` y `createServerClient()`
- `src/queries/` — products, orders, blog, banners, shipping-config, store-config, **payment-config**
- `supabase/migrations/1_initial_schema.sql` — schema completo para Stack Auth (sin FK a auth.users, sin trigger on_auth_user_created); RLS solo con políticas válidas; roles correctos incluido `miembro`
- `supabase/migrations/2_shipping_config.sql` — tabla `shipping_config` con soporte multi-proveedor, reglas de envío gratis (`free_shipping_enabled`, `free_shipping_min_amount`) y dirección de origen Skydropx (8 campos `origin_*`); todo consolidado en una sola migración
- `supabase/migrations/3_banner_mobile_image.sql` — tabla `banners` con campos de imagen web/mobile
- `supabase/migrations/4_store_config.sql` — tabla `store_config` singleton (id=1) con branding, Resend (api_key + from_email), contenido legal (terms/privacy Markdown), redes sociales (instagram/facebook/tiktok), modo mantenimiento y analytics; todo consolidado en una sola migración
- `supabase/migrations/5_payment_config.sql` — tabla `payment_config` singleton (id=1) con credenciales Wompi y MercadoPago
- `supabase/migrations/6_shipping_profiles.sql` — tabla `shipping_profiles` para perfiles de envío; RLS habilitado
- `supabase/migrations/7_customers.sql` — tabla `customers` (mirror de compradores web desde Stack Auth); FK `orders.customer_id → customers.id`; RLS habilitado (solo service_role)
- `supabase/migrations/8_customer_addresses.sql` — tabla `customer_addresses` (1 cliente → N direcciones guardadas para pre-llenar checkout); RLS habilitado
- `supabase/migrations/9_section_settings.sql` — tabla `section_settings` para habilitar/deshabilitar secciones del home; seed con secciones por defecto
- `supabase/migrations/10_coupons.sql` — tabla `coupons` con código, tipo (percentage/fixed), valor, mínimo de pedido, usos máximos, contador de usos, expiración, estado activo
- `supabase/migrations/11_testimonials.sql` — tabla `testimonials` con autor, cargo, contenido, avatar, rating (1-5), orden, estado activo
- `supabase/migrations/12_cart_items.sql` — tabla `cart_items` para sincronizar carrito de usuarios logueados (FK a `customers`)
- `supabase/migrations/13_themes.sql` — tabla `themes` con paleta hex completa (`color_primary`, `color_dark`, `color_cream`, `color_cream_warm`, `color_yellow`, `color_yellow_pale`, `color_text`) y selección de fuentes (`font_display`, `font_body`); seed con tema VPS Coffee original; unique index parcial `WHERE is_active = true`
- `supabase/migrations/14_product_variants_extended.sql` — **dimensiones físicas** (`weight_kg`, `length_cm`, `width_cm`, `height_cm`) en `product_variants` para cotización real con Skydropx; **sistema de variantes genérico**: `variant_options JSONB` en `products` + `attributes JSONB` en `product_variants`; retrocompatible con campos heredados `roast`/`weight`/`grind` (14 archivos totales)
- `src/queries/coupons.ts` — `getCoupons`, `getCouponByCode`, **`validateCoupon` (función pura)**, `createCoupon`, `updateCoupon`, `deleteCoupon`, `incrementCouponUsage`
- `src/queries/testimonials.ts` — `getTestimonials(onlyActive)`, `createTestimonial`, `updateTestimonial`, `deleteTestimonial`
- `src/queries/cart.ts` — `getCartItems`, `upsertCartItem`, `removeCartItem`, `clearCart`, `replaceCart`
- `src/queries/sections.ts` — `getSectionSettings()` (lista todas ordenadas por `order_index`), `isSectionEnabled(key)` (fail-open: devuelve `true` si la tabla no existe)
- `src/queries/themes.ts` — `getThemes()`, `getActiveTheme()`, `createTheme()`, `updateTheme()`, `setActiveTheme()`, `deleteTheme()` (protege activo y predeterminado)
- `src/queries/orders.ts` — `CreateOrderInput` incluye `carrier_name` y `skydropx_rate_id` para persistir la transportadora elegida por el cliente
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
- `AdminSidebar` — sidebar `#614A2A`; **grupos colapsables** (Catálogo, Ventas, Contenido, Administración); visibilidad filtrada por rol; auto-expande el grupo activo; sub-ítems de Configuración (General, Temas, Envíos, Pagos, Emails, Legal); **Newsletter** añadido al grupo Contenido (visible para gestor_tienda, admin, super_admin)
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
| `/configuracion/general` | `StoreConfigForm` — WhatsApp, logo, nombre, email, redes sociales, **modo mantenimiento**, **analytics toggle** |
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

### Pendiente
- [ ] **Tests newsletter** — API routes GET /api/admin/newsletter y POST /api/admin/newsletter/send
- [ ] **Tracking en Mi Cuenta** — timeline visual del estado del pedido / Skydropx
- [ ] **Responsive audit** mobile-first completo
- [ ] **Fuentes adicionales de tema** — ampliar opciones de display y body en el editor de temas

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
│   │   ├── queries/
│   │   │   ├── products.ts
│   │   │   ├── orders.ts
│   │   │   ├── blog.ts
│   │   │   ├── banners.ts
│   │   │   ├── shipping-config.ts
│   │   │   ├── store-config.ts         — getStoreConfig / updateStoreConfig
│   │   │   ├── coupons.ts              — getCoupons, validateCoupon (pura), CRUD, incrementCouponUsage
│   │   │   ├── testimonials.ts         — getTestimonials(onlyActive), CRUD
│   │   │   ├── cart.ts                 — getCartItems, upsertCartItem, removeCartItem, clearCart, replaceCart
│   │   │   ├── sections.ts             — getSectionSettings(), isSectionEnabled() (fail-open)
│   │   │   └── themes.ts               — getThemes(), getActiveTheme(), createTheme(), updateTheme(), setActiveTheme(), deleteTheme()
│   │   └── supabase/migrations/         — 14 archivos (consolidados desde 19)
│   │       ├── 1_initial_schema.sql      — Stack Auth-native: sin FK auth.users, sin triggers
│   │       ├── 2_shipping_config.sql     — shipping_config con multi-proveedor, envío gratis y origen Skydropx
│   │       ├── 3_banner_mobile_image.sql
│   │       ├── 4_store_config.sql        — store_config con branding, Resend, legal, sociales, toggles
│   │       ├── 5_payment_config.sql
│   │       ├── 6_shipping_profiles.sql
│   │       ├── 7_customers.sql
│   │       ├── 8_customer_addresses.sql
│   │       ├── 9_section_settings.sql
│   │       ├── 10_coupons.sql
│   │       ├── 11_testimonials.sql
│   │       ├── 12_cart_items.sql
│   │       ├── 13_themes.sql
│   │       └── 14_product_variants_extended.sql — dimensiones físicas + variantes genéricas (color/talla/etc.)
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
