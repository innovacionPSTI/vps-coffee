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
    │   ├── profile/route.ts   ← GET/PATCH perfil del cliente
    │   └── addresses/route.ts ← GET/POST direcciones guardadas
    ├── draft/enable/route.ts  ← Blog Draft Mode (cookie __vps_draft)
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
pnpm test              # Jest — 209 casos en 19 archivos
pnpm test:watch        # TDD
pnpm test:coverage     # Con reporte HTML
```

Nuevos archivos de test (v3):

| Archivo | Cubre |
|---------|-------|
| `src/app/api/__tests__/newsletter.test.ts` | Suscripción, deduplicación, email de confirmación |
| `src/app/api/__tests__/profile.test.ts` | GET/PATCH perfil, auth guard |
| `src/app/api/__tests__/draft-enable.test.ts` | Validación de secret, cookie, redirect |
| `src/__tests__/sitemap.test.ts` | Rutas estáticas, filtrado de productos/posts |

---

## Design system

Las fuentes y colores se heredan de `packages/config/tailwind.config.ts`.

```
public/fonts/
├── typogama-ahsing.otf    ← font-display (títulos hero)
└── Geeeki-Regular.otf     ← font-brand (UI, párrafos)
```
