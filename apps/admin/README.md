# apps/admin — Panel de administración VPS Coffee

Aplicación Next.js 16 (App Router) para la gestión interna de VPS Coffee. Protegida con Stack Auth + sistema de roles en Supabase.

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

---

## Autenticación y roles

El acceso al panel está restringido por dos capas:

1. **Stack Auth** — verifica que el usuario tiene sesión activa
2. **Supabase `profiles`** — verifica que el email tiene un rol de admin

Sin signup: los usuarios admin los crea únicamente el super_admin desde `/usuarios`.

### Roles disponibles

| Rol | Secciones accesibles |
|-----|---------------------|
| `super_admin` | Todo + gestión de usuarios y roles |
| `admin` | Todo (sin gestión de usuarios) |
| `vendedor` | Productos, Categorías, Pedidos, Clientes |
| `gestor_tienda` | Banners, Blog, Testimonios, Cupones, Secciones, Configuración (General, Temas, Legal) |

### Crear el primer super_admin

Ver el procedimiento completo en [`DEPLOYMENT.md` — sección 12.0](../../DEPLOYMENT.md).

```sql
-- En el SQL Editor de Supabase
INSERT INTO profiles (id, email, full_name, role)
VALUES (gen_random_uuid(), 'tu@email.com', 'Tu Nombre', 'super_admin');
```

Luego ir a `http://localhost:3001/handler/sign-in` → "¿Olvidaste tu contraseña?".

---

## Estructura de rutas

```
src/app/
├── layout.tsx                    ← Root layout: verifica rol, renderiza Sidebar + Topbar
├── no-autorizado/page.tsx        ← Página 403
├── handler/[...stack]/page.tsx   ← Stack Auth catch-all
│
├── dashboard/page.tsx            → /dashboard
├── productos/
│   ├── page.tsx                  → /productos
│   ├── nuevo/page.tsx            → /productos/nuevo
│   └── [id]/page.tsx             → /productos/[id]
├── categorias/page.tsx           → /categorias (con imagen de portada y drag-to-reorder)
├── variantes/page.tsx            → /variantes (CRUD de tipos de variante globales)
├── pedidos/
│   ├── page.tsx                  → /pedidos (con modal "Programar recolección")
│   └── [id]/page.tsx             → /pedidos/[id]
├── clientes/page.tsx             → /clientes
├── banners/page.tsx              → /banners
├── blog/
│   ├── page.tsx                  → /blog (lista de artículos)
│   └── [id]/page.tsx             → /blog/[id] (editor + "Previsualizar ↗")
├── cupones/page.tsx              → /cupones (CRUD; gestor_tienda+)
├── testimonios/page.tsx          → /testimonios (CRUD; gestor_tienda+)
├── secciones/
│   ├── page.tsx                  → /secciones (toggles home + CRUD servicios)
│   └── SeccionesClient.tsx
├── configuracion/
│   ├── page.tsx                  → redirige a /configuracion/general
│   ├── general/page.tsx          → identidad + redes + mantenimiento + analytics
│   ├── envios/page.tsx           → proveedor de envíos + Skydropx + envío gratis
│   ├── pagos/page.tsx            → Wompi + MercadoPago
│   ├── emails/page.tsx           → Resend
│   ├── legal/page.tsx            → Términos + Privacidad (Markdown)
│   └── temas/
│       ├── page.tsx              → /configuracion/temas (lista de temas)
│       └── TemasClient.tsx       ← ThemeCard, ThemeModal, ThemePreview; live preview
└── usuarios/
    ├── page.tsx                  → /usuarios (solo super_admin)
    └── UsuariosClient.tsx        ← UI de invitación y cambio de roles
│
└── api/admin/
    ├── usuarios/route.ts
    ├── products/route.ts
    ├── categories/[id]/route.ts
    ├── orders/[id]/status/route.ts
    ├── banners/route.ts
    ├── blog/route.ts             ← CRUD de artículos del blog
    ├── blog/[id]/route.ts
    ├── config/route.ts
    ├── payment-config/route.ts
    ├── shipping/route.ts         ← Guarda credenciales Skydropx + dirección de origen
    ├── pickups/route.ts          ← Programar recolección masiva Skydropx
    ├── upload/route.ts
    ├── sections/[key]/route.ts   ← PATCH: habilitar/deshabilitar sección del home
    ├── coupons/route.ts          ← CRUD de cupones
    ├── testimonios/route.ts      ← CRUD de testimonios
    └── themes/
        ├── route.ts              ← GET lista + POST crear
        └── [id]/route.ts         ← PATCH editar/setActive + DELETE
```

---

## Blog Draft Mode (previsualización)

El editor de artículos permite previsualizar borradores sin publicarlos:

1. El botón "Previsualizar ↗" en `BlogPostForm.tsx` llama a `GET /api/draft/enable?slug=<slug>&secret=<DRAFT_SECRET>` en el sitio web
2. El sitio setea una cookie segura `__vps_draft=1` (1 hora) y redirige al artículo
3. La página del artículo muestra un banner amarillo indicando que es un borrador

**Variable de entorno necesaria:**
```env
# apps/admin/.env.local
NEXT_PUBLIC_SITE_URL=https://vpscoffee.com
NEXT_PUBLIC_DRAFT_SECRET=cambia-este-secreto  # debe coincidir con DRAFT_SECRET en apps/web
```

---

## Despacho masivo (Pickups Skydropx)

En `/pedidos`, el botón "Programar recolección" abre `PickupModal.tsx` que:

1. Lista los pedidos con `skydropx_shipment_id NOT NULL` (ya tienen guía generada)
2. Permite seleccionar pedidos, fecha, hora inicio y hora fin
3. POST a `/api/admin/pickups` → llama a la API de pickups de Skydropx
4. Muestra pantalla de éxito o el mensaje de error de Skydropx

Requiere que **Skydropx esté configurado** en `/configuracion` con credenciales válidas y dirección de origen completa.

---

## Configuración de Skydropx

En `/configuracion` → sección *Envíos*, el formulario `ShippingConfigForm.tsx` permite configurar:

**Credenciales API:**
- Client ID, Client Secret, Base URL (default: `https://app.skydropx.com`)

**Dirección de origen** (reemplaza el antiguo `address_from_id`):
- Nombre del remitente, dirección, barrio, **departamento** (combobox SearchableSelect), **ciudad** (combobox filtrado por departamento), código postal, teléfono, email

La dirección de origen se guarda en `shipping_config` y se usa tanto para cotizaciones como para la creación de guías.

---

## Componente SearchableSelect

```
src/components/ui/SearchableSelect.tsx
```

Combobox reutilizable con búsqueda incremental, navegación con teclado (↑↓ Enter Escape) y cierre al hacer clic fuera. Las claves de lista usan `${index}-${option}` para evitar colisiones cuando un nombre de ciudad aparece en múltiples departamentos (ej: "Buenaventura" en Valle del Cauca y Chocó).

---

## Archivos de lógica de auth/roles

| Archivo | Propósito |
|---------|-----------|
| `src/stack.ts` | Instancia `StackServerApp` (sin signUp URL) |
| `src/middleware.ts` | Bloquea sign-up, inyecta `x-pathname`, verifica sesión Stack Auth |
| `src/lib/auth.ts` | `getAdminUser()` — combina Stack Auth + Supabase para obtener rol |
| `src/lib/roles.ts` | `ROLE_CONFIG`, `canAccess()`, `ASSIGNABLE_ROLES` |
| `src/lib/shipping/providers/skydropx/auth.ts` | Copia local del cliente OAuth Skydropx (para pickups) |

---

## Variables de entorno requeridas

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stack Auth
NEXT_PUBLIC_HEXCLAVE_PROJECT_ID=
NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY=
HEXCLAVE_SECRET_SERVER_KEY=

# URLs
NEXT_PUBLIC_ADMIN_URL=http://localhost:3001
NEXT_PUBLIC_SITE_URL=https://vpscoffee.com   ← para el enlace de previsualización del blog

# Blog Draft Mode
NEXT_PUBLIC_DRAFT_SECRET=cambia-este-secreto  ← mismo valor que DRAFT_SECRET en apps/web
```

---

## Tests

```bash
cd apps/admin
pnpm test
pnpm test:coverage
```

Tests de integración disponibles:

- `api/admin/orders/__tests__/` — actualización de estado de pedidos
- `api/admin/config/__tests__/` — configuración de tienda
- `api/admin/payment-config/__tests__/` — credenciales de pasarelas
- `api/admin/shipping/__tests__/` — configuración de envíos
- `api/admin/usuarios/__tests__/` — gestión de usuarios y roles
- `api/admin/testimonios/__tests__/` — CRUD de testimonios
- `api/admin/themes/__tests__/` — CRUD de temas + setActive + guards delete
- `api/admin/sections/__tests__/` — toggle secciones del home
