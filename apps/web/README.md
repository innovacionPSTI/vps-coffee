# apps/web — Sitio público VPS Coffee

Aplicación Next.js (App Router) que implementa el sitio público de VPS Coffee Roasting House: e-commerce, servicios B2B (maquila y asesorías) y blog.

**URL local:** `http://localhost:3000`

---

## Arrancar en desarrollo

```bash
# Desde la raíz del monorepo
pnpm dev

# O solo esta app
cd apps/web
pnpm dev
```

---

## Arquitectura interna

### Grupos de rutas (Route Groups)

```
src/app/
├── (public)/          ← Layout con Navbar + Footer (sin auth)
│   ├── page.tsx       → /
│   ├── tienda/
│   │   ├── page.tsx   → /tienda
│   │   └── [slug]/page.tsx → /tienda/[slug]
│   ├── maquila/page.tsx    → /maquila
│   ├── asesorias/page.tsx  → /asesorias
│   ├── blog/
│   │   ├── page.tsx        → /blog
│   │   └── [slug]/page.tsx → /blog/[slug]  (soporta Draft Mode)
│   └── nosotros/page.tsx   → /nosotros
├── (account)/         ← Layout protegido (requiere auth)
│   └── mi-cuenta/
│       ├── page.tsx        → /mi-cuenta (resumen + pedidos recientes)
│       ├── pedidos/page.tsx→ /mi-cuenta/pedidos
│       └── perfil/page.tsx → /mi-cuenta/perfil (editar nombre, teléfono, direcciones)
├── carrito/page.tsx        → /carrito
├── checkout/
│   ├── page.tsx            → /checkout
│   └── confirmacion/page.tsx→ /checkout/confirmacion
├── not-found.tsx           → Página 404 ("Esta taza está vacía")
├── sitemap.ts              → /sitemap.xml (dinámico: productos + blog)
├── robots.ts               → /robots.txt
└── api/
    ├── checkout/route.ts
    ├── newsletter/route.ts
    ├── shipping/rates/route.ts
    ├── account/
    │   ├── profile/route.ts            ← GET/PATCH perfil del cliente
    │   └── addresses/
    │       ├── route.ts                ← GET/POST direcciones guardadas
    │       └── [id]/route.ts           ← PATCH/DELETE dirección por ID
    ├── draft/enable/route.ts           ← Blog Draft Mode (cookie __vps_draft)
    └── webhooks/skydropx/route.ts
```

### Estrategia de renderizado

| Página | Método | Razón |
|--------|--------|-------|
| `/` | ISR (`revalidate = 60`) | Home con productos destacados y banners |
| `/tienda` | ISR (`revalidate = 60`) | Catálogo con filtros |
| `/tienda/[slug]` | SSG + ISR + OG | SEO, precarga de slugs activos, Open Graph por producto |
| `/blog` | ISR (`revalidate = 60`) | Listado de artículos |
| `/blog/[slug]` | SSG + ISR + Draft Mode + OG | SEO, Open Graph por artículo, preview de borradores |
| `/maquila`, `/asesorias`, `/nosotros` | Estático | Contenido que no cambia |
| `/carrito`, `/checkout` | Client-side | Estado local del carrito |
| `/mi-cuenta` | SSR + auth guard | Datos del usuario autenticado |
| `/mi-cuenta/perfil` | SSR + auth guard | Edición de nombre, teléfono y direcciones |

---

## Estado global del carrito

El carrito usa **Zustand** con `persist` middleware (clave `vps-cart` en `localStorage`).

```typescript
// src/store/cart.ts
import { useCartStore } from '@/store/cart'

const { items, addItem, removeItem, updateQty, clearCart, subtotal } = useCartStore()
```

`CartItem` incluye `productId` (requerido para la sincronización con BD). Todos los call sites de `addItem` — `ProductDetail`, `ShopClient` y `FeaturedProducts` — pasan `productId: product.id`. La API route `POST /api/account/cart` filtra ítems sin `productId` válido antes de insertar en Supabase (defensa contra FK violations).

---

## Capa de envíos

Documentada en el [README raíz](../../README.md#12-arquitectura-de-proveedores-de-envío).

```
src/lib/shipping/
├── types.ts          ← ShippingProvider interface, ShippingRate, calculateParcel
├── index.ts          ← getShippingProvider() factory (lee DB, devuelve instancia)
└── providers/
    ├── fixed-rate.ts ← Tarifa plana, responde instantáneamente
    └── skydropx/
        ├── auth.ts   ← OAuth 2.0 con caché de token keyed por clientId
        └── index.ts  ← SkydropxProvider: cotización → polling → label
```

`SkydropxProvider.getRates()` **nunca lanza** — siempre devuelve `[]` en error para que el checkout pueda degradar gracefully.

## Utilidades de localización y variantes

```
src/lib/
├── colombia-locations.ts   ← 33 departamentos + ~400 municipios; getCitiesForDepartment()
└── variant-utils.ts        ← getProductOptions, getVariantAttrs, getVariantLabel,
                               isColorValue, COLOR_HEX (sistema genérico de variantes)
```

## Componentes de UI reutilizables

```
src/components/ui/
└── SearchableSelect.tsx    ← Combobox accesible con búsqueda, teclado y click-outside;
                               usado en checkout (depto/ciudad) y selección de variantes
```

El checkout de 3 pasos implementa un **selector de tarifas de envío** en el paso 2:

1. Usuario selecciona departamento y ciudad con `SearchableSelect`
2. Botón "Ver opciones de envío →" llama a `POST /api/shipping/rates`
3. Se listan las tarifas disponibles por transportadora/precio/días
4. El usuario elige una tarifa; el botón "Continuar al pago →" se habilita
5. La tarifa elegida (`carrier_name`, `skydropx_rate_id`) se persiste en la orden

---

## Blog Draft Mode

Permite al equipo admin previsualizar artículos borrador antes de publicarlos.

**Flujo:**
1. Admin hace clic en "Previsualizar ↗" en `apps/admin/src/app/blog/BlogPostForm.tsx`
2. Redirige a `GET /api/draft/enable?slug=<slug>&secret=<DRAFT_SECRET>`
3. El endpoint valida el secreto, setea una cookie `__vps_draft=1` (httpOnly, 1h) y redirige a `/blog/<slug>?draft=1`
4. La página `/blog/[slug]` detecta la cookie y carga el artículo aunque `published = false`
5. Se muestra un banner amarillo: _"Modo borrador — Este artículo no está publicado"_

**Variables de entorno:**
```env
# apps/web/.env.local
DRAFT_SECRET=cambia-este-secreto

# apps/admin/.env.local
NEXT_PUBLIC_DRAFT_SECRET=cambia-este-secreto  # mismo valor
```

**Limpiar la cookie:**
```
DELETE /api/draft/enable
```

---

## SEO

| Feature | Implementación |
|---------|---------------|
| `sitemap.xml` | `src/app/sitemap.ts` — rutas estáticas + productos activos + posts publicados |
| `robots.txt` | `src/app/robots.ts` — bloquea `/api/`, `/mi-cuenta/`, `/checkout/`, `/handler/` |
| Open Graph | `generateMetadata()` en cada página pública con imagen, título y descripción |
| Twitter Cards | `twitter: { card: 'summary_large_image' }` en cada página |
| `metadataBase` | Configurado en `app/layout.tsx` con `NEXT_PUBLIC_SITE_URL` |

---

## API Routes

### `POST /api/checkout`
Valida el body, crea la orden en Supabase y devuelve `VPS-XXXX`.

### `POST /api/shipping/rates`
Llama a `getShippingProvider()` y devuelve tarifas disponibles.

### `POST /api/newsletter`
Upsert del email en `newsletter_subscribers`. Envía email de confirmación **solo al primer registro** (no en re-suscripciones). Requiere Resend configurado en `/admin/configuracion`.

### `GET /api/account/profile` · `PATCH /api/account/profile`
Lee/actualiza `name` y `phone` del customer. El PATCH también actualiza `displayName` en Stack Auth.

### `GET /api/account/addresses` · `POST /api/account/addresses`
Lista las direcciones guardadas del cliente / crea una nueva dirección. Requiere sesión Stack Auth.

### `PATCH /api/account/addresses/[id]` · `DELETE /api/account/addresses/[id]`
Edita campos de una dirección existente (incluyendo marcarla como predeterminada) o la elimina. Requiere sesión y que la dirección pertenezca al cliente autenticado.

### `GET /api/draft/enable` · `DELETE /api/draft/enable`
Activa/desactiva Blog Draft Mode mediante cookie `__vps_draft`.

### `POST /api/webhooks/skydropx`
Mapea eventos PRO API → status de la orden:

| Event / workflow_status | Status resultante |
|------------------------|-------------------|
| `shipment.delivered` / `delivered` | `delivered` |
| `shipment.exception` / `exception` | `exception` |
| `package.in_transit` / `in_transit` | `shipped` |
| `package.out_for_delivery` / `out_for_delivery` | `shipped` |

---

## Variables de entorno requeridas

Ver `.env.example` en la raíz del monorepo. Las mínimas:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Stack Auth
NEXT_PUBLIC_HEXCLAVE_PROJECT_ID=
NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY=
HEXCLAVE_SECRET_SERVER_KEY=

# Blog Draft Mode
DRAFT_SECRET=cambia-este-secreto
```

---

## Tests

```bash
pnpm test              # Jest — todos los casos
pnpm test:watch        # TDD
pnpm test:coverage     # Con reporte HTML
```

| Archivo | Casos | Cubre |
|---------|-------|-------|
| `src/store/__tests__/cart.test.ts` | 18 | Cart Store: addItem, deduplicación, subtotal, localStorage |
| `src/lib/shipping/__tests__/types.test.ts` | 10 | `calculateParcel`: tiers de peso, casos borde |
| `src/lib/shipping/__tests__/fixed-rate.test.ts` | 10 | `FixedRateProvider`: tarifa, envío gratuito |
| `src/lib/shipping/__tests__/skydropx-auth.test.ts` | 7 | OAuth 2.0: nuevo token, caché, renovación |
| `src/lib/shipping/__tests__/skydropx-provider.test.ts` | 9 | `SkydropxProvider`: happy path, polling, degradación |
| `src/lib/shipping/__tests__/factory.test.ts` | 8 | Factory: switch, fallbacks |
| `src/lib/__tests__/variant-utils.test.ts` | 22 | `getProductOptions`, `getVariantLabel`, `isColorValue`, `COLOR_HEX` |
| `src/lib/__tests__/colombia-locations.test.ts` | 10 | 33 departamentos, sin duplicados, ciudades ordenadas |
| `src/app/api/__tests__/checkout.integration.test.ts` | 17 | `POST /api/checkout`: validación, pasarela, `shipping_rate`, errores |
| `src/app/api/__tests__/webhook-skydropx.integration.test.ts` | 9 | Mapping de eventos Skydropx → status |
| `src/app/api/__tests__/shipping-rates.integration.test.ts` | 9 | Routing a provider, address mapping, fallbacks |
| `src/app/api/account/__tests__/addresses-id.integration.test.ts` | 9 | `PATCH/DELETE /addresses/[id]`: auth, 404, update, delete |
| `src/app/api/__tests__/newsletter.test.ts` | — | Suscripción, deduplicación, email de confirmación |
| `src/app/api/__tests__/profile.test.ts` | — | GET/PATCH perfil, auth guard |
| `src/app/api/__tests__/draft-enable.test.ts` | — | Validación de secret, cookie, redirect |
| `src/__tests__/sitemap.test.ts` | — | Rutas estáticas, filtrado de productos/posts |

---

## Design system

Las fuentes y colores se heredan de `packages/config/tailwind.config.ts`.

```
public/fonts/
├── typogama-ahsing.otf    ← font-display (títulos hero)
└── Geeeki-Regular.otf     ← font-brand (UI, párrafos)
```
