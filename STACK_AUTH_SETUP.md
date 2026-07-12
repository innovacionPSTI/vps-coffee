# Stack Auth — Guía de Configuración

> **Proyecto:** VPS Coffee Roasting House  
> **Paquete:** `@stackframe/stack` v2.7.4  
> **Aplica a:** `apps/web` y `apps/admin`

---

## ¿Qué es Stack Auth?

Stack Auth es el proveedor de autenticación del proyecto. Maneja el registro, inicio de sesión, cierre de sesión, verificación de email y recuperación de contraseña. La integración ya está lista en el código — solo necesitas crear la cuenta, configurar el proyecto y agregar las variables de entorno.

---

## Paso 1 — Crear la cuenta en Stack Auth

1. Ve a **[https://app.stack-auth.com](https://app.stack-auth.com)**
2. Haz clic en **"Sign up"**
3. Regístrate con email y contraseña (o con GitHub)
4. Verifica tu email cuando llegue el correo de confirmación

---

## Paso 2 — Crear el proyecto

1. En el dashboard, haz clic en **"New Project"**
2. Asigna el nombre: `VPS Coffee`
3. Selecciona el plan **Free** (suficiente para desarrollo y para producción con bajo volumen)
4. Haz clic en **"Create Project"**

Esto creará un proyecto con un `Project ID` único.

---

## Paso 3 — Configurar métodos de autenticación

En el panel de tu proyecto, ve a **"Auth" → "Providers"**:

1. Asegúrate de que **Email/Password** esté habilitado (viene activado por defecto)
2. Si quieres agregar Google OAuth en el futuro:
   - Activa **"Google"**
   - Ingresa `Client ID` y `Client Secret` desde Google Cloud Console

> Por ahora solo se usa Email/Password. Puedes activar Google más adelante sin cambios en el código.

---

## Paso 4 — Configurar URLs permitidas

Ve a **"Auth" → "Domains & URLs"** y agrega las siguientes URLs:

### Para desarrollo (localhost)
```
http://localhost:3000
http://localhost:3001
```

### Para producción (cuando se despliegue)
```
https://vpscoffee.com
https://admin.vpscoffee.com
```

> Stack Auth valida el origen de las peticiones. Si no agregas estas URLs, el login no funcionará.

---

## Paso 5 — Configurar las URLs de redirección

En **"Auth" → "Domains & URLs"**, sección **"Redirect URLs"**, agrega:

```
http://localhost:3000/handler
http://localhost:3001/handler
https://vpscoffee.com/handler
https://admin.vpscoffee.com/handler
```

Estos son los endpoints del catch-all handler de Stack Auth (`/app/handler/[...stack]/page.tsx`).

---

## Paso 6 — Obtener las API Keys

Ve a **"API Keys"** en el menú lateral del proyecto. Encontrarás tres valores:

| Variable de entorno | Dónde encontrarla en Stack Auth | Empieza con |
|---|---|---|
| `NEXT_PUBLIC_HEXCLAVE_PROJECT_ID` | "Project ID" | `proj_...` |
| `NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY` | "Publishable Client Key" | `pck_...` |
| `HEXCLAVE_SECRET_SERVER_KEY` | "Secret Server Key" | `ssk_...` |

> La **Secret Server Key** (`ssk_...`) nunca debe exponerse al cliente ni committearse al repositorio. Solo va en `.env.local` del servidor.

---

## Paso 7 — Configurar las variables de entorno

### En `apps/web/.env.local`

Abre (o crea) el archivo `apps/web/.env.local` y agrega:

```env
# --- Stack Auth ---
NEXT_PUBLIC_HEXCLAVE_PROJECT_ID=proj_xxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY=pck_xxxxxxxxxxxxxxxxxxxxxxxx
HEXCLAVE_SECRET_SERVER_KEY=ssk_xxxxxxxxxxxxxxxxxxxxxxxx
```

### En `apps/admin/.env.local`

El panel admin también usa Stack Auth. Agrega las **mismas tres variables** en `apps/admin/.env.local`:

```env
# --- Stack Auth ---
NEXT_PUBLIC_HEXCLAVE_PROJECT_ID=proj_xxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY=pck_xxxxxxxxxxxxxxxxxxxxxxxx
HEXCLAVE_SECRET_SERVER_KEY=ssk_xxxxxxxxxxxxxxxxxxxxxxxx
```

> Ambas apps usan el mismo proyecto de Stack Auth, por lo que las variables son idénticas.

---

## Paso 8 — Instalar las dependencias

Desde la raíz del monorepo:

```bash
pnpm install
```

Esto instalará `@stackframe/stack` en `apps/web` y `apps/admin` (ya está declarado en ambos `package.json`).

---

## Paso 9 — Verificar que funciona

Levanta el proyecto:

```bash
pnpm dev
```

Prueba el flujo completo:

1. Ve a `http://localhost:3000/registro` → crea una cuenta
2. Verifica que llega el email de verificación (si está configurado)
3. Ve a `http://localhost:3000/login` → inicia sesión
4. Confirma que redirige a `/mi-cuenta` y muestra tu nombre
5. Haz clic en **"Cerrar sesión"** → debe redirigir a `/`
6. Ve a `http://localhost:3000/mi-cuenta` sin sesión → debe redirigir a `/login`
7. Ve a `http://localhost:3001` → debe redirigir a `/handler/sign-in` sin sesión

---

## Paso 10 — Configuración específica del panel Admin

El panel admin (`apps/admin`) tiene requisitos adicionales en Stack Auth:

### Sign-up en el admin — protegido por código, no por Stack Auth

El admin no permite auto-registro, pero **no** se debe deshabilitar el sign-up en el dashboard de Stack Auth: la web (`apps/web`) y el admin (`apps/admin`) comparten el mismo proyecto de Stack Auth, y los clientes de la web sí necesitan poder registrarse.

El bloqueo de signup en el admin está implementado en dos capas de código:

1. **`middleware.ts`** — redirige `/handler/sign-up` → `/handler/sign-in` antes de que la página cargue
2. **`layout.tsx`** — llama a `getAdminUser()` en cada request; si el email no tiene una fila en `profiles` con rol admin, redirige a `/no-autorizado`

Esto significa que aunque alguien llegara a crear una cuenta Stack Auth con un email no registrado, no tendría acceso al panel.

### Roles y permisos — NO configurar en Stack Auth

> **Importante:** El sistema de roles de VPS Coffee está implementado en Supabase (`profiles.role`), **no** en Stack Auth. No es necesario crear roles, permisos ni equipos en Stack Auth para el panel admin. Stack Auth solo maneja la identidad (quién eres); Supabase maneja la autorización (qué puedes hacer).

Esto es intencional: los roles viven junto a los datos del negocio, son inmediatamente efectivos al cambiar (sin esperar expiración de token) y son auditables directamente en SQL.

### Dominios de confianza para emails del admin

Para que los links de "Restablecer contraseña" que llegan por email apunten correctamente al admin (y no al sitio web):

1. Ve a **"Auth" → "Domains & URLs"**
2. Confirma que `https://admin.vpscoffee.com` y `http://localhost:3001` están en la lista

Sin esto, los nuevos usuarios admin no podrán crear su contraseña desde el link del correo.

---

## Paso 11 — (Opcional) Configurar verificación de email

Por defecto Stack Auth no requiere verificación de email para iniciar sesión. Para habilitarla:

1. Ve a **"Auth" → "Email"** en el panel de Stack Auth
2. Activa **"Require email verification"**
3. Personaliza el template del email de verificación si lo deseas

> Si activas esto en producción, asegúrate de configurar un dominio de email propio en Stack Auth (Settings → Email).

---

## Paso 11 — Despliegue en Vercel

Cuando hagas deploy, agrega las tres variables en cada proyecto de Vercel:

**Proyecto `vps-coffee-web` (Vercel):**
```
NEXT_PUBLIC_HEXCLAVE_PROJECT_ID     → prod value
NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY → prod value
HEXCLAVE_SECRET_SERVER_KEY          → prod value
```

**Proyecto `vps-coffee-admin` (Vercel):**
```
NEXT_PUBLIC_HEXCLAVE_PROJECT_ID     → mismo valor
NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY → mismo valor
HEXCLAVE_SECRET_SERVER_KEY          → mismo valor
```

Ver `DEPLOYMENT.md` para el procedimiento completo de despliegue.

---

## Resumen de archivos de integración

| Archivo | Descripción |
|---|---|
| `apps/web/src/stack.ts` | Instancia `StackServerApp` con URLs custom (login → `/login`, registro → `/registro`) |
| `apps/web/src/middleware.ts` | Protege `/mi-cuenta/*`; sin sesión → `/login?returnTo=...` |
| `apps/web/src/app/layout.tsx` | Envuelve la app en `<StackProvider>` + `<StackTheme>` |
| `apps/web/src/app/handler/[...stack]/page.tsx` | Catch-all para flows internos de Stack (password reset, verificación) |
| `apps/web/src/app/(auth)/login/page.tsx` | Formulario de login branded VPS Coffee |
| `apps/web/src/app/(auth)/registro/page.tsx` | Formulario de registro branded VPS Coffee |
| `apps/web/src/components/auth/LogoutButton.tsx` | Botón de cierre de sesión (`useUser().signOut()`) |
| `apps/web/src/app/api/auth/welcome/route.ts` | API route que envía email de bienvenida vía Resend tras el registro |
| `apps/admin/src/stack.ts` | Instancia `StackServerApp` para el admin |
| `apps/admin/src/middleware.ts` | Protege todas las rutas del admin; sin sesión → `/handler/sign-in` |
| `apps/admin/src/app/layout.tsx` | `StackProvider` + topbar con nombre real del usuario |
| `apps/admin/src/app/handler/[...stack]/page.tsx` | Catch-all handler para el admin |

---

## Troubleshooting

**"Invalid project ID" al arrancar:**
→ Verifica que `NEXT_PUBLIC_HEXCLAVE_PROJECT_ID` esté bien copiado en `.env.local` y que hayas reiniciado el servidor de desarrollo.

**El login redirige a una página en blanco:**
→ Asegúrate de que `http://localhost:3000` esté en la lista de dominios permitidos en el panel de Stack Auth.

**"Unauthorized" al llamar a `/api/auth/welcome`:**
→ El usuario no tiene sesión activa. Esto no debería pasar en flujo normal, pero si ocurre en desarrollo, asegúrate de que la cookie de Stack Auth esté siendo seteada (revisa las DevTools → Application → Cookies).

**El admin siempre redirige a `/handler/sign-in`:**
→ El middleware del admin protege todas las rutas. Inicia sesión primero en `http://localhost:3001/handler/sign-in`. La cuenta es la misma que usas en el sitio web (mismo proyecto Stack Auth).

---

*VPS Coffee Roasting House · Parquesoft TI · Julio 2026*
