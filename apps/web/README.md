# apps/web — Sitio público VPS Coffee

Aplicación Next.js 14 (App Router) que implementa el sitio público de VPS Coffee Roasting House: e-commerce, servicios B2B (maquila y asesorías) y blog.

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
│   │   └── [slug]/page.tsx → /blog/[slug]
│   └── nosotros/page.tsx   → /nosotros
├── (account)/         ← Layout protegido (requiere auth)
│   └── mi-cuenta/
│       ├── page.tsx        → /mi-cuenta
│       └── pedidos/page.tsx→ /mi-cuenta/pedidos
├── carrito/page.tsx        → /carrito
├── checkout/
│   ├── page.tsx            → /checkout
│   └── confirmacion/page.tsx→ /checkout/confirmacion
└── api/
    ├── checkout/route.ts
    ├── newsletter/route.ts
    ├── shipping/rates/route.ts
    └── webhooks/skydropx/route.ts
```

### Estrategia de renderizado

| Página | Método | Razón |
|--------|--------|-------|
| `/` | ISR (`revalidate = 60`) | Home con productos destacados y banners |
| `/tienda` | ISR (`revalidate = 60`) | Catálogo con filtros |
| `/tienda/[slug]` | SSG + ISR (`generateStaticParams`) | SEO, precarga de slugs activos |
| `/blog` | ISR (`revalidate = 60`) | Listado de artículos |
| `/blog/[slug]` | SSG + ISR (`generateStaticParams`) | SEO de artículos |
| `/maquila`, `/asesorias`, `/nosotros` | Estático | Contenido que no cambia |
| `/carrito`, `/checkout` | Client-side | Estado local del carrito |
| `/mi-cuenta` | Server + auth guard | Datos del usuario autenticado |

---

## Estado global del carrito

El carrito usa **Zustand** con `persist` middleware (clave `vps-cart` en `localStorage`).

```typescript
// src/store/cart.ts
import { useCartStore } from '@/store/cart'

// Dentro de un componente
const { items, addItem, removeItem, updateQty, clearCart, subtotal } = useCartStore()

// addItem hace upsert: si la variante ya existe, suma qty
addItem({
  variantId: 10,
  productName: 'Geisha Natural',
  variantLabel: '250g · Tueste claro · Grano entero',
  price: 45000,
  qty: 1,
  weight: '250g',
  image: '/images/geisha.jpg',
})
```

**Persistencia:** El carrito sobrevive recargas y cierre del navegador. Se limpia llamando a `clearCart()` tras una compra exitosa.

---

## Capa de envíos

Documentada completamente en el [README raíz](../../README.md#12-arquitectura-de-proveedores-de-envío).

Resumen de la estructura de archivos:

```
src/lib/shipping/
├── types.ts          ← ShippingProvider interface, ShippingRate, calculateParcel
├── index.ts          ← getShippingProvider() factory (lee DB, devuelve instancia)
└── providers/
    ├── fixed-rate.ts ← Tarifa plana, responde instantáneamente
    └── skydropx/
        ├── auth.ts   ← OAuth 2.0 con caché de token keyed por clientId
        └── index.ts  ← SkydropxProvider: crea quotation, polling 10×500ms
```

**Regla de oro:** `SkydropxProvider.getRates()` nunca lanza. Siempre devuelve `[]` en error para que el checkout pueda degradar gracefully a tarifa fija.

---

## Componentes principales

### Layout

| Componente | Archivo | Descripción |
|-----------|---------|-------------|
| `Navbar` | `components/layout/Navbar.tsx` | Logo, menú principal, ícono del carrito |
| `Footer` | `components/layout/Footer.tsx` | Links, redes sociales, newsletter |
| `CartDrawer` | `components/cart/CartDrawer.tsx` | Drawer lateral con items del carrito |

### Home

| Componente | Archivo |
|-----------|---------|
| `HeroCarousel` | `components/home/HeroCarousel.tsx` |
| `FeaturedProducts` | `components/home/FeaturedProducts.tsx` |
| `ServicesSection` | `components/home/ServicesSection.tsx` |
| `BlogPreview` | `components/home/BlogPreview.tsx` |
| `NewsletterSection` | `components/home/NewsletterSection.tsx` |

### Tienda

| Componente | Archivo | Descripción |
|-----------|---------|-------------|
| `ShopClient` | `components/shop/ShopClient.tsx` | Filtros + grid de productos (Client Component) |
| `ProductDetail` | `components/shop/ProductDetail.tsx` | Selector de variantes, galería, add-to-cart |

---

## API Routes

### `POST /api/checkout`

Valida el body, crea la orden en Supabase y devuelve el número correlativo `VPS-XXXX`.

**Validaciones:** `email` y `name` requeridos; al menos un item en el carrito; total ≥ 0.

### `POST /api/shipping/rates`

Llama a `getShippingProvider()`, construye el `ShippingAddress` y el `ShippingParcel`, y devuelve las tarifas disponibles.

**Fallback automático:** si el proveedor activo falla o devuelve `[]`, el checkout puede ofrecer la tarifa fija como alternativa.

### `POST /api/newsletter`

Hace `upsert` del email en `newsletter_subscribers`. Devuelve `{ ok: true }` siempre (no revela si el email ya existía).

### `POST /api/webhooks/skydropx`

Recibe el webhook de Skydropx, mapea el evento a un status interno y llama a `updateOrderStatus()`.

Mapeo de eventos:

```
shipment.in_transit       → shipped
shipment.out_for_delivery → shipped
shipment.delivered        → delivered
shipment.exception        → exception
```

---

## Variables de entorno requeridas

Ver la plantilla completa en `.env.example` en la raíz del monorepo. Las mínimas para que el sitio arrange:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_WHATSAPP_NUMBER=573XXXXXXXXX
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Tests

```bash
pnpm test              # Jest — 90 casos en 9 archivos
pnpm test:watch        # TDD
pnpm test:coverage     # Con reporte HTML
```

Ver tabla completa de cobertura en el [README raíz](../../README.md#14-testing).

---

## Design system

Las fuentes y colores se heredan de `packages/config/tailwind.config.ts`. Asegúrate de haber copiado los archivos `.otf` a `public/fonts/` antes de iniciar.

```
public/fonts/
├── typogama-ahsing.otf    ← font-display (títulos hero)
└── Geeeki-Regular.otf     ← font-brand (UI, párrafos)
```
