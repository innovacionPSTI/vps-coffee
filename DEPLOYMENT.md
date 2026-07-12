# VPS Coffee — Guía de Despliegue en Vercel + GitHub

> **Stack:** Next.js 16 · Turborepo · pnpm · Supabase  
> **Repositorio:** monorepo con dos apps (`apps/web` y `apps/admin`)  
> **Desarrollado por:** [Parquesoft TI](mailto:produccion@parquesoftti.com)

---

## Tabla de contenido

1. [Resumen de la arquitectura de despliegue](#1-resumen-de-la-arquitectura-de-despliegue)
2. [Requisitos previos](#2-requisitos-previos)
3. [Preparar el repositorio en GitHub](#3-preparar-el-repositorio-en-github)
4. [Migraciones en Supabase (producción)](#4-migraciones-en-supabase-producción)
5. [Crear proyecto Vercel — Sitio público (apps/web)](#5-crear-proyecto-vercel--sitio-público-appsweb)
6. [Crear proyecto Vercel — Panel admin (apps/admin)](#6-crear-proyecto-vercel--panel-admin-appsadmin)
7. [Variables de entorno](#7-variables-de-entorno)
8. [Configuración de dominios y DNS](#8-configuración-de-dominios-y-dns)
9. [Webhooks de Skydropx](#9-webhooks-de-skydropx)
10. [Pipeline CI/CD automático](#10-pipeline-cicd-automático)
11. [Fuentes tipográficas en producción](#11-fuentes-tipográficas-en-producción)
12. [Configuración post-deploy](#12-configuración-post-deploy)
13. [Checklist pre-deploy](#13-checklist-pre-deploy)
14. [Rollback y gestión de incidencias](#14-rollback-y-gestión-de-incidencias)
15. [Variables de entorno — referencia completa](#15-variables-de-entorno--referencia-completa)

---

## 1. Resumen de la arquitectura de despliegue

Este monorepo se despliega como **dos proyectos independientes en Vercel**, cada uno mapeado a su propia app dentro del repositorio.

```
GitHub (monorepo vps-coffee)
         │
         ├── push a main
         │
         ├──▶ Vercel Project: vps-coffee-web   (apps/web)
         │         └── vpscoffee.com
         │
         └──▶ Vercel Project: vps-coffee-admin  (apps/admin)
                   └── admin.vpscoffee.com
```

| Proyecto Vercel | App en el repo | Dominio | Puerto local |
|----------------|----------------|---------|-------------|
| `vps-coffee-web` | `apps/web` | `vpscoffee.com` | 3000 |
| `vps-coffee-admin` | `apps/admin` | `admin.vpscoffee.com` | 3001 |

Vercel detecta automáticamente que es un monorepo y maneja la caché de Turborepo entre builds.

---

## 2. Requisitos previos

Antes de comenzar, tener listos:

- [ ] Cuenta en [Vercel](https://vercel.com) (plan Hobby o Pro)
- [ ] Repositorio creado en GitHub con el código del monorepo
- [ ] Proyecto en [Supabase](https://supabase.com) de **producción** (distinto al de desarrollo)
- [ ] Dominio registrado (ej. `vpscoffee.com`) con acceso al panel DNS
- [ ] Fuentes tipográficas: `typogama-ahsing.otf` y `Geeeki-Regular.otf`

> **Importante:** Usar proyectos Supabase separados para desarrollo y producción. Nunca apuntar producción a la misma BD de desarrollo.

---

## 3. Preparar el repositorio en GitHub

### 3.1 Crear el repositorio

```bash
# En la raíz del monorepo
git init
git add .
git commit -m "chore: initial commit"

# En GitHub: crear repositorio privado "vps-coffee"
git remote add origin https://github.com/<org>/vps-coffee.git
git branch -M main
git push -u origin main
```

### 3.2 Estructura de ramas recomendada

| Rama | Propósito | Deployment automático |
|------|-----------|----------------------|
| `main` | Producción | ✅ sí → `vpscoffee.com` |
| `staging` | Pre-producción / QA | ✅ sí → Preview URL de Vercel |
| `feat/*` | Desarrollo de features | ✅ sí → Preview URL por PR |

### 3.3 Archivos a ignorar en Git

Verificar que `.gitignore` en la raíz incluya:

```gitignore
# Entornos locales — NUNCA subir al repositorio
.env.local
.env.*.local
apps/web/.env.local
apps/admin/.env.local

# Build outputs
.next/
out/
dist/

# Turborepo cache
.turbo/

# Node modules
node_modules/
```

### 3.4 Copiar fuentes al repositorio

Las fuentes **deben estar en el repositorio** para que Vercel pueda servirlas en el build:

```bash
# Copiar ambas fuentes en cada app
cp typogama-ahsing.otf   apps/web/public/fonts/
cp Geeeki-Regular.otf    apps/web/public/fonts/
cp typogama-ahsing.otf   apps/admin/public/fonts/
cp Geeeki-Regular.otf    apps/admin/public/fonts/

git add apps/web/public/fonts/ apps/admin/public/fonts/
git commit -m "chore: add custom fonts for production build"
git push
```

> Si las fuentes tienen licencia que impide subirlas a un repo público, usar un repositorio **privado** en GitHub.

---

## 4. Migraciones en Supabase (producción)

Antes de desplegar, el schema de producción debe estar al día. Ejecutar en el **SQL Editor** del proyecto Supabase de producción, en este orden exacto:

> **Consejo:** Copia el contenido de cada archivo `.sql` y pégalo en el SQL Editor de Supabase → **Run**.

| # | Archivo | Qué hace |
|---|---------|----------|
| 1 | `1_initial_schema.sql` | Tablas base (profiles, products, orders, blog, etc.), RLS, políticas públicas, seed de categorías y banners |
| 2 | `2_shipping_config.sql` | Tabla `shipping_config` (singleton) + RLS |
| 3 | `3_banner_mobile_image.sql` | Columna `image_url_mobile` en banners |
| 4 | `4_store_config.sql` | Tabla `store_config` con `logo_url` (singleton) + RLS |
| 5 | `5_payment_config.sql` | Tabla `payment_config` para credenciales de Wompi y MercadoPago + RLS |
| 6 | `6_email_config.sql` | Campos `resend_api_key` y `resend_from_email` en `store_config` |
| 7 | `7_shipping_profiles.sql` | Tabla `shipping_profiles` (perfil de envío del usuario web) + RLS |
| 8 | `8_customers.sql` | Tabla `customers` (mirror de compradores web desde Stack Auth); FK `orders.customer_id → customers.id` |
| 9 | `9_customer_addresses.sql` | Tabla `customer_addresses` (direcciones guardadas por cliente para pre-llenar checkout) |

### Verificar el schema

Después de aplicar las migraciones, verificar en **Table Editor** que existen:

- `profiles`, `categories`, `products`, `product_variants`
- `orders`, `banners`, `blog_posts`, `newsletter_subscribers`
- `shipping_config` (con una fila id=1)
- `store_config` (con una fila id=1)
- `payment_config` (con una fila id=1)
- `shipping_profiles`
- `customers`, `customer_addresses`

Verificar que RLS esté activo en todas las tablas:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Todas deben mostrar `rowsecurity = true`.

Y en **Storage** que existen los buckets:
- `products` (público)
- `banners` (público)
- `blog` (público)
- `logos` (público — se crea automáticamente al subir el primer logo)
- `private` (privado)

---

## 5. Crear proyecto Vercel — Sitio público (`apps/web`)

### 5.1 Conectar repositorio

1. Ir a [vercel.com/new](https://vercel.com/new)
2. Hacer clic en **"Import Git Repository"**
3. Seleccionar el repo `vps-coffee` de GitHub
4. Autorizar el acceso si se pide

### 5.2 Configurar el proyecto

En la pantalla de configuración del nuevo proyecto:

| Campo | Valor |
|-------|-------|
| **Project Name** | `vps-coffee-web` |
| **Framework Preset** | `Next.js` (detección automática) |
| **Root Directory** | `apps/web` |
| **Build Command** | `cd ../.. && pnpm turbo build --filter=@vps/web` |
| **Output Directory** | `.next` *(relativo a `apps/web` — dejar por defecto)* |
| **Install Command** | `cd ../.. && pnpm install --frozen-lockfile` |
| **Node.js Version** | `20.x` |

> **Por qué Root Directory = `apps/web`:** Vercel detecta la versión de Next.js leyendo el `package.json` del Root Directory. Si se deja en blanco apunta al `package.json` de la raíz del monorepo, que no tiene `next` como dependencia y falla con *"No Next.js version detected"*.

> **Por qué `cd ../..` en los comandos:** Vercel ejecuta los comandos desde el Root Directory (`apps/web`). El `cd ../..` sube a la raíz del monorepo para que `pnpm install` instale todos los `packages/*` del workspace y Turborepo resuelva las dependencias correctamente.

> **Nombre del filtro:** Debe coincidir con `"name"` en `apps/web/package.json` → `@vps/web`.

### 5.3 vercel.json — **método recomendado**

El `vercel.json` en `apps/web/` tiene prioridad sobre cualquier campo configurado en la UI de Vercel. Esto evita que Vercel use sus propios defaults y garantiza que el comando sea siempre el correcto.

El archivo ya está creado en el repositorio en `apps/web/vercel.json`:

```json
{
  "buildCommand": "cd ../.. && pnpm turbo build --filter=@vps/web",
  "outputDirectory": ".next",
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
  "framework": "nextjs"
}
```

> Con este archivo en el repo, los campos **Build Command** e **Install Command** en la UI de Vercel quedan sobreescritos. Se pueden dejar en blanco en la UI.

> **Error frecuente:** `pnpm build --filter=web` falla porque pnpm interpreta `--filter=web` como un filtro de workspace (busca el paquete con `"name": "web"`). El comando correcto invoca `turbo` directamente: `pnpm turbo build --filter=@vps/web`.

### 5.4 Agregar variables de entorno

En la sección **Environment Variables** durante la creación (o luego en Settings → Environment Variables):

Ver la referencia completa en la [sección 15](#15-variables-de-entorno--referencia-completa).

Las mínimas para que la app arranque:

```
NEXT_PUBLIC_SUPABASE_URL          = https://<proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = eyJ...
SUPABASE_SERVICE_ROLE_KEY         = eyJ...
NEXT_PUBLIC_SITE_URL              = https://vpscoffee.com
```

### 5.5 Hacer el primer deploy

Hacer clic en **"Deploy"**. El primer build puede tardar 3–5 minutos.

Si el build falla, revisar el log en la pestaña **Deployments** → clic en el deploy fallido → **Build Logs**.

---

## 6. Crear proyecto Vercel — Panel admin (`apps/admin`)

### 6.1 Crear segundo proyecto

1. Ir a [vercel.com/new](https://vercel.com/new)
2. Importar el **mismo repositorio** `vps-coffee`
3. En la pantalla de configuración:

| Campo | Valor |
|-------|-------|
| **Project Name** | `vps-coffee-admin` |
| **Framework Preset** | `Next.js` |
| **Root Directory** | `apps/admin` |
| **Build Command** | `cd ../.. && pnpm turbo build --filter=@vps/admin` |
| **Output Directory** | `.next` *(relativo a `apps/admin` — dejar por defecto)* |
| **Install Command** | `cd ../.. && pnpm install --frozen-lockfile` |
| **Node.js Version** | `20.x` |

> El filtro `@vps/admin` coincide con `"name": "@vps/admin"` en `apps/admin/package.json`. La misma lógica que el proyecto web: Root Directory apunta a la app para que Vercel detecte Next.js, y los comandos suben a la raíz para instalar todo el workspace.

### 6.2 vercel.json — **método recomendado**

El archivo ya está creado en el repositorio en `apps/admin/vercel.json`:

```json
{
  "buildCommand": "cd ../.. && pnpm turbo build --filter=@vps/admin",
  "outputDirectory": ".next",
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
  "framework": "nextjs"
}
```

> Mismo principio que el proyecto web: el `vercel.json` sobreescribe cualquier campo en la UI de Vercel.

### 6.3 Variables de entorno del admin

Las mínimas para el panel admin:

```
NEXT_PUBLIC_SUPABASE_URL          = https://<proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = eyJ...
SUPABASE_SERVICE_ROLE_KEY         = eyJ...
NEXT_PUBLIC_ADMIN_URL             = https://admin.vpscoffee.com
```

---

## 7. Variables de entorno

### Cómo agregarlas en Vercel

1. Ir al proyecto en Vercel → **Settings** → **Environment Variables**
2. Para cada variable: ingresar **Name**, **Value** y seleccionar los **Environments** (Production, Preview, Development)
3. Hacer clic en **Save**
4. **Redeploy** el proyecto para que tome efecto (Deployments → ··· → Redeploy)

### Entornos de Vercel

| Entorno Vercel | Cuándo aplica | Consejo |
|----------------|---------------|---------|
| **Production** | Push a `main` | Usar keys de producción (Supabase prod) |
| **Preview** | Pull Requests y otras ramas | Usar keys de staging (Supabase staging) |
| **Development** | `vercel dev` en local | No es necesario configurar aquí |

> **Seguridad:** Las variables sin prefijo `NEXT_PUBLIC_` son secretas y solo están disponibles en el servidor. Las que tienen `NEXT_PUBLIC_` son expuestas al navegador. **Nunca poner secrets en variables NEXT_PUBLIC_.**

---

## 8. Configuración de dominios y DNS

### 8.1 Agregar dominio al proyecto web

1. En **vps-coffee-web** → **Settings** → **Domains**
2. Agregar `vpscoffee.com` y `www.vpscoffee.com`
3. Vercel mostrará los registros DNS que debes configurar

### 8.2 Agregar dominio al proyecto admin

1. En **vps-coffee-admin** → **Settings** → **Domains**
2. Agregar `admin.vpscoffee.com`
3. Vercel mostrará el registro DNS para el subdominio

### 8.3 Registros DNS a configurar en tu proveedor

Ir al panel de administración DNS de tu dominio (ej. GoDaddy, Namecheap, Cloudflare, etc.) y crear:

#### Para vpscoffee.com (dominio raíz + www)

| Tipo | Nombre | Valor | TTL |
|------|--------|-------|-----|
| `A` | `@` | `76.76.21.21` | Auto |
| `CNAME` | `www` | `cname.vercel-dns.com` | Auto |

#### Para admin.vpscoffee.com

| Tipo | Nombre | Valor | TTL |
|------|--------|-------|-----|
| `CNAME` | `admin` | `cname.vercel-dns.com` | Auto |

> **Si usas Cloudflare:** Desactivar el proxy (nube naranja → nube gris) para los registros que apuntan a Vercel, ya que Vercel gestiona su propio SSL y el doble proxy puede causar errores.

### 8.4 Verificar SSL

Vercel provee certificados SSL automáticos via Let's Encrypt. La verificación puede tardar hasta 5 minutos tras configurar el DNS. El estado aparece en **Settings → Domains** como ✅ Valid Configuration.

### 8.5 Redirección www → sin www

En **vps-coffee-web** → **Settings** → **Domains**, Vercel redirige automáticamente `www.vpscoffee.com` → `vpscoffee.com` (o viceversa). Seleccionar `vpscoffee.com` como dominio primario.

---

## 9. Webhooks de Skydropx

El endpoint `POST /api/webhooks/skydropx` recibe notificaciones de Skydropx cuando el estado de un envío cambia. Debe registrarse en el dashboard de Skydropx con la URL de producción:

```
https://vpscoffee.com/api/webhooks/skydropx
```

### Configurar en Skydropx

1. Iniciar sesión en el dashboard de Skydropx
2. Ir a **Configuración → Webhooks**
3. Agregar la URL: `https://vpscoffee.com/api/webhooks/skydropx`
4. Seleccionar los eventos:
   - `shipment.in_transit`
   - `shipment.out_for_delivery`
   - `shipment.delivered`
   - `shipment.exception`
5. Guardar

### Eventos y estado resultante

| Evento Skydropx | Status en BD |
|----------------|--------------|
| `shipment.in_transit` | `shipped` |
| `shipment.out_for_delivery` | `shipped` |
| `shipment.delivered` | `delivered` |
| `shipment.exception` | `exception` |

---

## 10. Pipeline CI/CD automático

Una vez conectado el repositorio, Vercel despliega automáticamente en cada push:

```
Developer                    GitHub                      Vercel
    │                           │                           │
    ├── git push origin main ──▶│                           │
    │                           ├── trigger build ─────────▶│
    │                           │                           ├── pnpm install
    │                           │                           ├── turbo build --filter=@vps/web|@vps/admin
    │                           │                           ├── deploy to CDN
    │                           │◀── notify status ─────────┤
    │◀── GitHub check status ───┤                           │
```

### Pull Requests → Preview Deployments

Cada PR abierto contra `main` genera automáticamente una URL de preview:

```
https://vps-coffee-web-git-feat-nueva-feature-<org>.vercel.app
```

Esta URL es única por branch y se actualiza con cada push al PR. Útil para QA antes de mergear.

### Configurar notificaciones de deploy

En **vps-coffee-web** → **Settings** → **Git** → **Deploy Hooks** se puede agregar un webhook para notificar a Slack/Teams cuando el deploy termina.

### Evitar deploys innecesarios

Si solo cambia un archivo de documentación y no se quiere activar un build, agregar `[skip ci]` al mensaje del commit:

```bash
git commit -m "docs: actualizar README [skip ci]"
```

---

## 11. Fuentes tipográficas en producción

Las fuentes `typogama-ahsing.otf` y `Geeeki-Regular.otf` **deben estar en el repositorio** antes del build. Vercel no tiene acceso a archivos locales.

### Verificar que están incluidas

```bash
ls apps/web/public/fonts/
# typogama-ahsing.otf  Geeeki-Regular.otf

ls apps/admin/public/fonts/
# typogama-ahsing.otf  Geeeki-Regular.otf
```

Si el repositorio es público y las fuentes tienen licencia restrictiva, considerar:

1. **Repositorio privado en GitHub** (recomendado)
2. Alojar las fuentes en Supabase Storage o un CDN y actualizar las URLs en `globals.css`

### Referencia en globals.css

```css
/* apps/web/src/app/globals.css */
@font-face {
  font-family: 'Ahsing';
  src: url('/fonts/typogama-ahsing.otf') format('opentype');
  font-display: swap;
}

@font-face {
  font-family: 'Geeeki';
  src: url('/fonts/Geeeki-Regular.otf') format('opentype');
  font-display: swap;
}
```

---

## 12. Configuración post-deploy

Después de que ambas apps estén desplegadas y los dominios configurados:

### 12.0 Crear el primer super_admin

Este es el **primer paso obligatorio** antes de usar el panel. Sin él, nadie puede entrar al admin.

**Paso 1 — Insertar el profile en Supabase**

En el **SQL Editor** de Supabase, ejecuta:

```sql
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  gen_random_uuid(),
  'tu@email.com',   -- el email con el que iniciarás sesión
  'Tu Nombre',
  'super_admin'
);
```

> Reemplaza `tu@email.com` y `Tu Nombre` con tus datos reales. Este email debe ser el mismo que usarás para iniciar sesión en Stack Auth.

**Paso 2 — Crear la cuenta en Stack Auth**

El admin no tiene formulario de registro (está deshabilitado). Para crear la cuenta:

1. Ve a `https://admin.vpscoffee.com/handler/sign-in`
2. Haz clic en **"¿Olvidaste tu contraseña?"**
3. Ingresa el mismo email que pusiste en Supabase
4. Stack Auth enviará un correo para crear/restablecer la contraseña
5. Sigue el link del correo y define tu contraseña

**Paso 3 — Verificar acceso**

Inicia sesión con email y contraseña. Deberías ver el panel completo con la sección **Usuarios** en el menú lateral.

> **¿Por qué este orden?** El middleware verifica primero la sesión de Stack Auth, y luego el layout busca el `email` en `profiles`. Si el profile no existe, el sistema redirige a `/no-autorizado`. El profile debe existir antes del primer login.

**Agregar más usuarios admin (desde el panel)**

Una vez que el super_admin ha ingresado:

1. Ve a `/usuarios` en el panel
2. Clic en **"Agregar usuario"**
3. Ingresa email, nombre y rol (`Admin`, `Vendedor` o `Gestor de Tienda`)
4. El nuevo usuario debe ir a `https://admin.vpscoffee.com/handler/sign-in`, usar "¿Olvidaste tu contraseña?" y crear su contraseña

Los roles disponibles y sus permisos:

| Rol | Acceso |
|-----|--------|
| `Admin` | Todo el panel (sin gestión de usuarios) |
| `Vendedor` | Productos, Categorías, Pedidos, Clientes |
| `Gestor de Tienda` | Banners, Blog, Configuración General |

---

### 12.1 Configurar proveedor de envíos

1. Ir a `https://admin.vpscoffee.com/configuracion`
2. Sección **Proveedor de envíos**
3. Si vas a usar Skydropx: ingresar Client ID, Client Secret y Address From ID
4. Si usas tarifa fija: definir el valor en COP (ej. `8000`)
5. Guardar

### 12.2 Configurar logo y WhatsApp

1. Ir a `https://admin.vpscoffee.com/configuracion`
2. Sección **Identidad de la tienda**
3. Subir el logo (se guardará en el bucket `logos` de Supabase)
4. Ingresar el número de WhatsApp en formato internacional: `573001234567`
5. Guardar

Estos valores se aplican inmediatamente en el sitio público (Navbar, Footer, CTAs de maquila y asesorías).

### 12.3 Crear categorías

1. Ir a `https://admin.vpscoffee.com/categorias`
2. Crear las categorías iniciales (ej. "Café de Especialidad", "Blend", "Microlote")

### 12.4 Crear primeros productos

1. Ir a `https://admin.vpscoffee.com/productos/nuevo`
2. Completar nombre, slug, imágenes, variantes y precios
3. Activar el producto

### 12.5 Configurar banners del hero

1. Ir a `https://admin.vpscoffee.com/banners`
2. Subir imágenes para desktop y mobile en cada slide
3. Definir título, subtítulo y CTA

---

## 13. Checklist pre-deploy

Completar antes de hacer el primer deploy a producción:

### Código

- [ ] `pnpm lint` pasa sin errores en todas las apps
- [ ] `pnpm type-check` pasa sin errores de TypeScript
- [ ] `pnpm test` — todos los 227 tests pasan
- [ ] No hay `console.log` de debug en el código
- [ ] No hay credenciales hardcodeadas en el código

### Supabase (producción)

- [ ] Las 9 migraciones SQL aplicadas correctamente (1 → 9)
- [ ] RLS activado en todas las tablas (verificar en **Authentication → Policies**)
- [ ] Buckets de Storage creados: `products`, `banners`, `blog`, `private`
- [ ] Políticas de Storage configuradas (público/privado según la tabla)
- [ ] Service Role Key copiada (necesaria para las API routes del servidor)

### Vercel — vps-coffee-web

- [ ] Root Directory: `apps/web`
- [ ] Build Command: `cd ../.. && pnpm turbo build --filter=@vps/web`
- [ ] Output Directory: `.next` (por defecto)
- [ ] Install Command: `cd ../.. && pnpm install --frozen-lockfile`
- [ ] Node.js 20.x seleccionado
- [ ] Variables de entorno de producción configuradas (todas las de la lista de la sección 15)
- [ ] Primer build exitoso (sin errores en Build Logs)
- [ ] Dominio `vpscoffee.com` agregado y con SSL válido

### Vercel — vps-coffee-admin

- [ ] Root Directory: `apps/admin`
- [ ] Build Command: `cd ../.. && pnpm turbo build --filter=@vps/admin`
- [ ] Output Directory: `.next` (por defecto)
- [ ] Install Command: `cd ../.. && pnpm install --frozen-lockfile`
- [ ] Node.js 20.x seleccionado
- [ ] Variables de entorno de producción configuradas
- [ ] Primer build exitoso
- [ ] Dominio `admin.vpscoffee.com` agregado y con SSL válido

### DNS

- [ ] Registro `A` para `vpscoffee.com` apuntando a `76.76.21.21`
- [ ] Registro `CNAME` para `www` apuntando a `cname.vercel-dns.com`
- [ ] Registro `CNAME` para `admin` apuntando a `cname.vercel-dns.com`
- [ ] Propagación DNS verificada (puede tardar hasta 24h; normalmente < 30 min)

### Post-deploy

- [ ] **Crear super_admin** — INSERT en `profiles` (ver sección 12.0)
- [ ] Ir a `https://admin.vpscoffee.com/handler/sign-in` → "¿Olvidaste tu contraseña?" con el email del super_admin
- [ ] Confirmar que el link del correo funciona y permite crear contraseña
- [ ] Iniciar sesión como super_admin — dashboard accesible con sección Usuarios visible
- [ ] Abrir `https://vpscoffee.com` — Home carga correctamente
- [ ] Abrir `https://vpscoffee.com/tienda` — Catálogo visible
- [ ] Subir logo desde `/configuracion` — aparece en el sitio
- [ ] Ingresar número de WhatsApp — CTAs funcionan
- [ ] Webhook de Skydropx registrado en el dashboard de Skydropx

---

## 14. Rollback y gestión de incidencias

### Rollback rápido en Vercel

Si un deploy rompe producción:

1. Ir al proyecto en Vercel → **Deployments**
2. Buscar el último deploy estable (estado ✅ Ready)
3. Hacer clic en **···** → **Promote to Production**

Esto redirige el tráfico al deploy anterior en menos de 30 segundos, sin necesidad de hacer un nuevo commit.

### Modo mantenimiento

Para activar la página de mantenimiento sin redesplegar:

1. En Vercel → **Settings** → **Environment Variables**
2. Agregar o editar `MAINTENANCE_MODE = true`
3. Hacer clic en **Save** y luego **Redeploy** (solo el proyecto `web`)

Para desactivar: cambiar a `MAINTENANCE_MODE = false` y redeploy.

### Ver logs en tiempo real

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Ver logs del proyecto web en producción
vercel logs vps-coffee-web --follow

# Ver logs del admin
vercel logs vps-coffee-admin --follow
```

### Alertas de error

Configurar alertas en Vercel → **Observability** → **Alerts** para recibir notificaciones cuando:
- Un deploy falla
- El error rate supera un umbral
- El tiempo de respuesta p99 sube

---

## 15. Variables de entorno — referencia completa

### Supabase (ambas apps — `apps/web` y `apps/admin`)

| Variable | Tipo | Descripción | Ejemplo |
|----------|------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Pública | URL del proyecto Supabase | `https://abcdefgh.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Pública | Clave anónima (anon key) | `eyJhbGci...` |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secreta** | Clave de servicio (service_role) — solo servidor | `eyJhbGci...` |

> Obtener en: Supabase Dashboard → Project Settings → API

### URLs del sitio

| Variable | App | Descripción | Ejemplo |
|----------|-----|-------------|---------|
| `NEXT_PUBLIC_SITE_URL` | web | URL pública del sitio | `https://vpscoffee.com` |
| `NEXT_PUBLIC_ADMIN_URL` | admin | URL del panel admin | `https://admin.vpscoffee.com` |

### Pasarelas de pago — *(pendiente de integrar)*

| Variable | App | Descripción |
|----------|-----|-------------|
| `WOMPI_PUBLIC_KEY` | web | Clave pública de Wompi |
| `WOMPI_PRIVATE_KEY` | web | Clave privada de Wompi (**secreta**) |
| `WOMPI_EVENTS_SECRET` | web | Secret para validar webhooks de Wompi (**secreto**) |
| `MERCADOPAGO_ACCESS_TOKEN` | web | Token de acceso de MercadoPago (**secreto**) |
| `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` | web | Clave pública de MercadoPago |

> Obtener en: [Panel de Wompi](https://comercios.wompi.co) y [Panel de MercadoPago](https://www.mercadopago.com.co/developers)

### Emails con Resend — *(pendiente de integrar)*

| Variable | App | Descripción | Ejemplo |
|----------|-----|-------------|---------|
| `RESEND_API_KEY` | web | Clave de la API de Resend (**secreta**) | `re_...` |
| `RESEND_FROM_EMAIL` | web | Email del remitente | `pedidos@vpscoffee.com` |

> Obtener en: [resend.com/api-keys](https://resend.com/api-keys)

### Modo mantenimiento

| Variable | App | Descripción | Valores |
|----------|-----|-------------|---------|
| `MAINTENANCE_MODE` | web | Activa la página de mantenimiento | `true` / `false` |

### Autenticación Stack Auth — *(pendiente de integrar)*

| Variable | App | Descripción |
|----------|-----|-------------|
| `NEXT_PUBLIC_STACK_PROJECT_ID` | web + admin | ID del proyecto en Stack Auth |
| `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY` | web + admin | Clave pública |
| `STACK_SECRET_SERVER_KEY` | web + admin | Clave secreta (**secreta**) |

> **Nota:** Las credenciales de Skydropx y el número de WhatsApp **NO** son variables de entorno. Se gestionan directamente desde el panel admin en `/configuracion` y se guardan en Supabase.

---

## Diagrama de flujo completo

```
┌─────────────────────────────────────────────────────────────────────┐
│                        GitHub (monorepo)                            │
│                                                                     │
│  main branch                feat/* branches                         │
│      │                           │                                  │
│      │ push                      │ PR abierto                       │
└──────┼───────────────────────────┼──────────────────────────────────┘
       │                           │
       ▼                           ▼
┌──────────────────────────────────────────────────────────────────── ┐
│                          Vercel CI                                  │
│                                                                     │
│  turbo build --filter=@vps/web  turbo build --filter=@vps/admin     │
│         │                               │                           │
│  Production Deploy              Production Deploy                   │
│  vpscoffee.com                  admin.vpscoffee.com                 │
└──────────────────────────────────────────────────────────────────── ┘
       │                           │
       ▼                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Supabase (producción)                       │
│                                                                     │
│  PostgreSQL + RLS              Storage Buckets                      │
│  ├── profiles (admin users)    ├── products  (público)              │
│  ├── customers (web buyers)    ├── banners   (público)              │
│  ├── customer_addresses        ├── blog      (público)              │
│  ├── products / orders         ├── logos     (público)              │
│  ├── store_config (logo/wa)    └── private  (privado)              │
│  └── shipping_config                                                │
└─────────────────────────────────────────────────────────────────────┘
```

---

*VPS Coffee Roasting House · Parquesoft TI · Julio 2026*
