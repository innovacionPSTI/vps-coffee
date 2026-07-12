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
| `gestor_tienda` | Banners, Blog, Configuración General |

### Crear el primer super_admin

Ver el procedimiento completo en [`DEPLOYMENT.md` — sección 12.0](../../DEPLOYMENT.md).

Resumen rápido para desarrollo:

```sql
-- En el SQL Editor de Supabase
INSERT INTO profiles (id, email, full_name, role)
VALUES (gen_random_uuid(), 'tu@email.com', 'Tu Nombre', 'super_admin');
```

Luego ir a `http://localhost:3001/handler/sign-in` → "¿Olvidaste tu contraseña?" con ese email.

---

## Estructura de rutas

```
src/app/
├── layout.tsx                    ← Root layout: verifica rol, renderiza Sidebar + Topbar
├── no-autorizado/page.tsx        ← Página 403 (sin rol de admin)
├── handler/[...stack]/page.tsx   ← Stack Auth catch-all (sign-in, password-reset, etc.)
│
├── dashboard/page.tsx            → /dashboard
├── productos/
│   ├── page.tsx                  → /productos
│   ├── nuevo/page.tsx            → /productos/nuevo
│   └── [id]/page.tsx             → /productos/[id]
├── categorias/page.tsx           → /categorias
├── pedidos/
│   ├── page.tsx                  → /pedidos
│   └── [id]/page.tsx             → /pedidos/[id]
├── clientes/page.tsx             → /clientes
├── banners/page.tsx              → /banners
├── blog/page.tsx                 → /blog
├── configuracion/page.tsx        → /configuracion (secciones según rol)
└── usuarios/
    ├── page.tsx                  → /usuarios (solo super_admin)
    └── UsuariosClient.tsx        ← UI de invitación y cambio de roles
│
└── api/admin/
    ├── usuarios/route.ts         ← GET/POST/PATCH/DELETE usuarios
    ├── products/route.ts
    ├── categories/[id]/route.ts
    ├── orders/[id]/status/route.ts
    ├── banners/route.ts
    ├── config/route.ts
    ├── payment-config/route.ts
    ├── shipping/route.ts
    └── upload/route.ts
```

---

## Archivos de lógica de autenticación/roles

| Archivo | Propósito |
|---------|-----------|
| `src/stack.ts` | Instancia `StackServerApp` (sin signUp URL) |
| `src/middleware.ts` | Bloquea sign-up, inyecta `x-pathname`, verifica sesión Stack Auth |
| `src/lib/auth.ts` | `getAdminUser()` — combina Stack Auth + Supabase para obtener rol |
| `src/lib/roles.ts` | `ROLE_CONFIG`, `canAccess()`, `ASSIGNABLE_ROLES` |
| `src/app/layout.tsx` | Llama `getAdminUser()`, redirige a `/no-autorizado` si no es admin, pasa rol al Sidebar |
| `src/components/layout/AdminSidebar.tsx` | Filtra items de nav según el rol recibido como prop |

---

## Página de configuración — acceso por rol

`/configuracion` adapta su contenido según el rol:

- **`gestor_tienda`**: ve solo la sección *Configuración General* (nombre de tienda, WhatsApp, logo)
- **`admin` / `super_admin`**: ven además *Envíos*, *Pasarelas de pago* y *Emails transaccionales*

---

## Gestión de usuarios (`/usuarios`)

Solo accesible para `super_admin`. Permite:

- **Ver** todos los usuarios con rol admin y sus fechas de creación
- **Agregar** un usuario (email + nombre + rol) → crea fila en `profiles`
- **Cambiar rol** inline mediante un dropdown en la tabla
- **Revocar acceso** → elimina la fila de `profiles` (el usuario queda sin acceso al admin)

> Al agregar un usuario, el sistema crea el registro en `profiles`. El usuario debe ir a `/handler/sign-in` y usar "¿Olvidaste tu contraseña?" para crear su cuenta en Stack Auth.

---

## Variables de entorno requeridas

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stack Auth (Hexclave)
NEXT_PUBLIC_HEXCLAVE_PROJECT_ID=
NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY=
HEXCLAVE_SECRET_SERVER_KEY=

# URLs
NEXT_PUBLIC_ADMIN_URL=http://localhost:3001
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
