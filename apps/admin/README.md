# apps/admin — Panel de administración VPS Coffee

Aplicación Next.js 14 (App Router) para la gestión interna de VPS Coffee: pedidos, catálogo, blog, banners y configuración del sistema.

**URL local:** `http://localhost:3001`

---

## Arrancar en desarrollo

```bash
# Desde la raíz del monorepo
pnpm dev

# O solo esta app
cd apps/admin
pnpm dev
```

> En desarrollo, el panel es accesible sin autenticación. En producción se protegerá con Stack Auth (pendiente de integrar).

---

## Estructura de rutas

Todas las rutas del admin están dentro del grupo `(dashboard)` que aplica el layout con sidebar y topbar:

```
src/app/
├── (dashboard)/
│   ├── layout.tsx               ← Sidebar + Topbar wrapper
│   ├── dashboard/page.tsx       → /dashboard
│   ├── productos/page.tsx       → /productos
│   ├── pedidos/
│   │   ├── page.tsx             → /pedidos
│   │   └── [id]/page.tsx        → /pedidos/[id]
│   ├── banners/page.tsx         → /banners
│   ├── blog/page.tsx            → /blog
│   └── configuracion/
│       ├── page.tsx             → /configuracion  (Server Component)
│       └── ShippingConfigForm.tsx (Client Component)
└── api/admin/
    ├── orders/[id]/status/route.ts   ← PATCH estado de orden
    └── shipping/route.ts             ← GET/PATCH configuración de envíos
```

---

## Páginas del panel

### `/dashboard`

Métricas del negocio con datos en tiempo real:

- Ventas totales del día
- Pedidos pendientes de procesar
- Número de productos activos
- Tabla de pedidos recientes con acceso rápido a cada orden

Usa `force-dynamic` para no cachear datos de negocio.

### `/productos`

Tabla del catálogo completo con:

- Nombre, categoría, precio base, estado (activo / inactivo)
- Acceso rápido a editar cada producto
- *(CRUD completo pendiente — formulario de creación/edición con upload de imágenes)*

### `/pedidos`

Listado de todas las órdenes con filtro por estado:

| Estado | Color | Descripción |
|--------|-------|-------------|
| `pending` | Gris | Esperando confirmación de pago |
| `processing` | Azul | Pago confirmado, preparando |
| `shipped` | Amarillo | Guía generada, en camino |
| `delivered` | Verde | Entregado al destinatario |
| `cancelled` | Rojo | Cancelado |
| `exception` | Naranja | Incidencia en la entrega |

### `/pedidos/[id]`

Vista detallada de una orden:

- Timeline de cambios de estado
- Items con imagen, variante, cantidad y precio
- Datos del cliente y dirección de envío
- Campo de tracking number
- Selector de nuevo estado con `PATCH /api/admin/orders/[id]/status`

### `/banners`

Preview del carrusel hero y las secciones de servicios (maquila, asesorías). *(Gestión visual de banners y upload pendiente)*

### `/blog`

Tabla de artículos del blog con estado publicado/borrador. *(Editor rich text pendiente)*

### `/configuracion`

Configuración del proveedor de envíos activo. Carga el estado inicial desde la BD (`force-dynamic`) y lo pasa a `<ShippingConfigForm>`.

---

## Configuración de envíos (detalles técnicos)

Esta es la sección más compleja del admin. La página es un Server Component async que lee la config actual; el formulario es un Client Component que maneja la UI y el submit.

### `page.tsx` (Server Component)

```typescript
export const dynamic = 'force-dynamic'

export default async function ConfiguracionPage() {
  const shippingConfig = await getShippingConfig()
  return (
    <div>
      <ShippingConfigForm initialConfig={shippingConfig} />
    </div>
  )
}
```

### `ShippingConfigForm.tsx` (Client Component)

Comportamientos clave:

- **Tabs de proveedor:** array `AVAILABLE_PROVIDERS = ['fixed', 'skydropx']` — agregar nuevos proveedores aquí.
- **Secret nunca pre-llenado:** El campo `client_secret` siempre empieza vacío. Si el usuario no escribe nada, el PATCH no envía el campo y el backend conserva el valor existente.
- **Indicador de credencial guardada:** Cuando `initialConfig.skydropx_client_secret` empieza con `••••`, muestra un badge "Credencial guardada".
- **Estados del botón:** `idle → saving → saved/error` usando `useTransition`.
- **Extensible:** Para agregar un nuevo proveedor, basta con agregar su slug al array `AVAILABLE_PROVIDERS` y un bloque condicional de campos en el JSX.

---

## API Routes del admin

### `PATCH /api/admin/orders/[id]/status`

Actualiza el estado de una orden. Solo acepta los valores del enum `order_status`.

```typescript
// Request
{ "status": "processing" }

// Response 200
{ "id": 42, "status": "processing", "order_number": "VPS-0042", ... }
```

**Errores:** `400` si el status es inválido · `404` si la orden no existe · `500` error de BD

---

### `GET /api/admin/shipping`

Devuelve la configuración actual con el `client_secret` enmascarado:

```json
{
  "provider": "skydropx",
  "fixed_rate": 8000,
  "skydropx_client_id": "mi-client-id",
  "skydropx_client_secret": "••••••••5678",
  "skydropx_address_from_id": "warehouse-01",
  "skydropx_base_url": "https://api-pro.skydropx.com"
}
```

La función `maskConfig()` aplica esta transformación: si `client_secret` existe, devuelve `••••` + últimos 4 caracteres; si no, `null`.

---

### `PATCH /api/admin/shipping`

Actualiza la configuración. Reglas de validación:

1. `provider` debe ser `'fixed'` o `'skydropx'` (o los slugs que se agreguen en el futuro)
2. `fixed_rate` debe ser ≥ 0
3. Al cambiar a `skydropx`, los tres campos de credencial deben existir — ya sea en el body del request o en la configuración actual en BD

Si el usuario no envía `skydropx_client_secret`, el backend no lo sobreescribe (preserva el valor existente).

---

## Componentes de layout

```
src/components/layout/
├── AdminSidebar.tsx    ← Nav links, logo, menú colapsable en mobile
└── AdminTopbar.tsx     ← Título de sección, botón de logout (pendiente)
```

---

## Variables de entorno requeridas

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_ADMIN_URL=http://localhost:3001
```

---

## Tests

```bash
cd apps/admin
pnpm test
pnpm test:coverage
```

Archivos de test:

- `src/app/api/admin/orders/__tests__/order-status.integration.test.ts` — 9 casos
- `src/app/api/admin/shipping/__tests__/shipping-config.integration.test.ts` — 14 casos

---

## Pendiente de implementar

- Stack Auth: middleware de protección de rutas, login page, logout
- CRUD de productos: formulario con upload de imágenes a Supabase Storage
- Editor de blog: componente rich text (Tiptap o similar)
- Gestión de banners: upload de imágenes y reordenamiento
- Gestión de usuarios y roles
- Creación de guías de envío (Skydropx label API) desde `/pedidos/[id]`
