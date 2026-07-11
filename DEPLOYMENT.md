# VPS Coffee — Guía de Despliegue en Vercel + GitHub

> **Stack:** Next.js 15 · Turborepo · pnpm · Supabase  
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

### Migración 1 — Schema base

```sql
-- packages/database/supabase/migrations/001_initial_schema.sql
-- Crea: profiles, categories, products, product_variants,
--       banners, orders, blog_posts, newsletter_subscribers,
--       RLS policies, trigger on_auth_user_created, buckets de Storage,
--       seed data (categorías y banners iniciales)
```

### Migración 2 — Configuración de envíos

```sql
-- packages/database/supabase/migrations/002_shipping_config.sql
-- Crea: enum shipping_provider_type, tabla shipping_config (singleton)
```

### Migración 3 — Banners con imagen mobile

```sql
-- packages/database/supabase/migrations/003_banners.sql
-- Agrega: columna image_url_mobile a la tabla banners
```

### Migración 4 — Configuración de la tienda

```sql
-- packages/database/supabase/migrations/004_store_config.sql
-- Crea: tabla store_config (singleton id=1)
-- Campos: whatsapp_number, store_name, store_email, logo_url, updated_at
```

### Migración 5 — Columna logo_url (idempotente)

```sql
-- packages/database/supabase/migrations/005_store_config_logo.sql
-- ALTER TABLE store_config ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT NULL;
-- Ejecutar siempre aunque ya hayas aplicado la 004
```

### Verificar el schema

Después de aplicar las migraciones, verificar en el dashboard de Supabase → **Table Editor** que existen:

- `profiles`, `categories`, `products`, `product_variants`
- `orders`, `banners`, `blog_posts`, `newsletter_subscribers`
- `shipping_config` (con una fila id=1)
- `store_config` (con una fila id=1)

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
| **Build Command** | `cd ../.. && pnpm build --filter=web` |
| **Output Directory** | `.next` (dejar por defecto) |
| **Install Command** | `cd ../.. && pnpm install --frozen-lockfile` |
| **Node.js Version** | `20.x` |

> **Nota sobre el Build Command:** Vercel ejecuta los comandos desde el Root Directory configurado. Al hacer `cd ../..` se sube a la raíz del monorepo para que Turborepo resuelva correctamente las dependencias entre packages.

### 5.3 Alternativa — usar vercel.json

Crear `apps/web/vercel.json` en el repositorio:

```json
{
  "buildCommand": "cd ../.. && pnpm turbo build --filter=web",
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
  "framework": "nextjs"
}
```

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
| **Build Command** | `cd ../.. && pnpm build --filter=admin` |
| **Install Command** | `cd ../.. && pnpm install --frozen-lockfile` |
| **Node.js Version** | `20.x` |

### 6.2 Alternativa — vercel.json para admin

Crear `apps/admin/vercel.json`:

```json
{
  "buildCommand": "cd ../.. && pnpm turbo build --filter=admin",
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
  "framework": "nextjs"
}
```

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
    │                           │                           ├── turbo build
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
- [ ] `pnpm test` — todos los 163 tests pasan
- [ ] No hay `console.log` de debug en el código
- [ ] No hay credenciales hardcodeadas en el código

### Supabase (producción)

- [ ] Las 5 migraciones SQL aplicadas correctamente
- [ ] RLS activado en todas las tablas (verificar en **Authentication → Policies**)
- [ ] Buckets de Storage creados: `products`, `banners`, `blog`, `private`
- [ ] Políticas de Storage configuradas (público/privado según la tabla)
- [ ] Service Role Key copiada (necesaria para las API routes del servidor)

### Vercel — vps-coffee-web

- [ ] Root Directory configurado como `apps/web`
- [ ] Build Command: `cd ../.. && pnpm build --filter=web`
- [ ] Node.js 20.x seleccionado
- [ ] Variables de entorno de producción configuradas (todas las de la lista de la sección 15)
- [ ] Primer build exitoso (sin errores en Build Logs)
- [ ] Dominio `vpscoffee.com` agregado y con SSL válido

### Vercel — vps-coffee-admin

- [ ] Root Directory configurado como `apps/admin`
- [ ] Build Command: `cd ../.. && pnpm build --filter=admin`
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

- [ ] Abrir `https://vpscoffee.com` — Home carga correctamente
- [ ] Abrir `https://vpscoffee.com/tienda` — Catálogo visible
- [ ] Abrir `https://admin.vpscoffee.com` — Dashboard accesible
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
│  turbo build --filter=web      turbo build --filter=admin           │
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
│  ├── profiles                  ├── products  (público)              │
│  ├── products                  ├── banners   (público)              │
│  ├── orders                    ├── blog      (público)              │
│  ├── store_config (logo/wa)    ├── logos     (público)              │
│  └── shipping_config           └── private  (privado)              │
└─────────────────────────────────────────────────────────────────────┘
```

---

*VPS Coffee Roasting House · Parquesoft TI · Julio 2026*
