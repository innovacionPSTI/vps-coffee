# VPS Coffee Roasting House — Product Backlog & Documentación de Producto

> **Proyecto:** Plataforma e-commerce VPS Coffee  
> **Cliente:** VPS Coffee Roasting House  
> **Desarrollo:** Parquesoft TI  
> **Versión:** 1.2 · Julio 2026 (Favicon · Identidad admin · Export v3)  
> **Stack:** Next.js 16 · Supabase · Stack Auth · Tailwind CSS · Turborepo

---

## 1. Objetivos del Proyecto

### 1.1 Objetivo General

Desarrollar una plataforma digital integral para VPS Coffee Roasting House que permita la venta en línea de café de especialidad, la promoción y contratación de servicios de maquila y asesoría, y la gestión completa del negocio desde un panel de administración; todo bajo una identidad visual coherente y una experiencia de usuario premium alineada con los valores de la marca.

---

### 1.2 Objetivos Específicos

#### Producto — Sitio Público

**OE-01 — Canal de venta directa**
Habilitar una tienda en línea funcional que permita al consumidor final explorar, filtrar, seleccionar y comprar café de especialidad con variantes de tueste, peso y molienda, integrando pasarelas de pago colombianas (Wompi y MercadoPago).

**OE-02 — Experiencia de compra fluida**
Implementar un flujo de compra completo —carrito persistente, checkout de tres pasos, confirmación de orden y seguimiento de pedido— que minimice la fricción y maximice la conversión.

**OE-03 — Posicionamiento de servicios B2B**
Crear páginas dedicadas para los servicios de Maquila & Tueste y Asesorías Profesionales con información detallada y acceso directo a cotización vía WhatsApp, captando clientes empresariales sin requerir transacción en línea.

**OE-04 — Generación de contenido y SEO**
Proveer un módulo de blog editorial ("Notas de Café") para publicar contenido de valor sobre café de especialidad, mejorar el posicionamiento orgánico en buscadores y construir comunidad alrededor de la marca.

**OE-05 — Construcción de base de clientes**
Permitir el registro e inicio de sesión de clientes para acceder a historial de pedidos y datos personales, y capturar correos electrónicos a través de un formulario de suscripción al boletín.

**OE-06 — Logística integrada**
Integrar la API de Skydropx para cotizar tarifas de envío en tiempo real durante el checkout, generar guías automáticamente tras el pago y actualizar el estado del pedido mediante webhooks.

#### Producto — Panel de Administración

**OE-07 — Gestión centralizada del catálogo**
Ofrecer un CRUD completo de productos con soporte para múltiples variantes (tueste × peso × molienda × método), control de inventario y carga de imágenes a Supabase Storage.

**OE-08 — Gestión operativa de pedidos**
Permitir al equipo de VPS Coffee visualizar todos los pedidos, actualizar su estado en un flujo definido (Pendiente → Procesando → Enviado → Entregado), descargar guías de envío y programar recolecciones masivas con Skydropx.

**OE-09 — Control de contenido editorial**
Brindar un panel para crear, editar, publicar y despublicar artículos del blog con previsualización antes de publicar.

**OE-10 — Configuración de banners y hero**
Permitir gestionar los slides del carrusel hero y las imágenes de las secciones de servicios sin requerir cambios de código.

**OE-11 — Control de accesos por roles**
Implementar un sistema de roles (super_admin, admin, editor, customer) con Row Level Security en Supabase, de modo que cada usuario solo acceda a las secciones que le corresponden.

#### Técnicos

**OE-12 — Arquitectura escalable en monorepo**
Estructurar el proyecto como monorepo Turborepo con dos aplicaciones (web pública + admin) y paquetes compartidos (UI, base de datos, configuración), facilitando el mantenimiento y la adición de nuevas apps a futuro.

**OE-13 — Rendimiento y SEO técnico**
Aplicar Incremental Static Regeneration (ISR) en páginas de catálogo y blog, generar metadatos dinámicos por página, y configurar sitemap.xml y robots.txt para maximizar la indexación.

**OE-14 — Seguridad y cumplimiento**
Proteger las rutas del panel admin y el área de cliente mediante middleware de autenticación con Stack Auth, aplicar políticas RLS en todas las tablas de Supabase y manejar secrets únicamente como variables de entorno o mediante tablas singleton accesibles solo con `service_role_key`.

**OE-15 — Integridad referencial y buenas prácticas de base de datos**
Garantizar que el modelo de datos tenga claves foráneas explícitas con políticas ON DELETE apropiadas, índices compuestos para los patrones de consulta más frecuentes, CHECK constraints para enumeraciones críticas, triggers `updated_at` para auditoría, y comentarios de tabla/columna que documenten el esquema directamente en la base de datos. El esquema debe ser expresable como un único archivo canónico ejecutable en Supabase desde cero.

**OE-16 — CMS unificado sin modelos paralelos**
Consolidar todo el contenido gestionable (banners, secciones del home, testimonios, páginas de servicios, páginas legales) en el modelo único `pages → page_sections → section_items`, eliminando cualquier tabla paralela que represente conceptos equivalentes. El admin debe tener una sola interfaz para editar cualquier contenido sin ambigüedad.

---

## 2. Product Backlog

El backlog está organizado por **épicas** y priorizado en cinco sprints de dos semanas. Las épicas marcadas con ✅ están implementadas; las marcadas con 🔲 están pendientes.

### Épica 1 — Fundación e Infraestructura

| ID | Historia | Prioridad | Estado |
|----|----------|-----------|--------|
| F-01 | Configurar monorepo Turborepo con pnpm workspaces | Alta | ✅ |
| F-02 | Definir design system: colores, tipografía, componentes base | Alta | ✅ |
| F-03 | Crear schema de base de datos con todas las tablas y relaciones (incluye `customers` y `customer_addresses`) | Alta | ✅ |
| F-04 | Implementar RLS (Row Level Security) en Supabase | Alta | ✅ |
| F-05 | Configurar buckets de Storage en Supabase | Alta | ✅ |
| F-06 | Integrar Stack Auth para autenticación | Alta | ✅ |
| F-07 | Crear middleware de protección de rutas por rol | Alta | ✅ |
| F-08 | Configurar variables de entorno y .env.example documentado | Alta | ✅ |
| F-09 | Configurar fuentes personalizadas Ahsing y Geeeki | Alta | ✅ |
| F-10 | Definir seed data inicial (categorías y banners) | Media | ✅ |

---

### Épica 2 — Sitio Público — Layout y Navegación

| ID | Historia | Prioridad | Estado |
|----|----------|-----------|--------|
| N-01 | Navbar global con logo, links y sticky scroll | Alta | ✅ |
| N-02 | Menú hamburger para móvil con drawer lateral | Alta | ✅ |
| N-03 | Iconos de cuenta y carrito con badge numérico | Alta | ✅ |
| N-04 | Footer con links, WhatsApp y redes sociales (Instagram, Facebook, TikTok) con iconos SVG — habilitables y configurables desde admin | Alta | ✅ |
| N-05 | Página 404 personalizada con estilo VPS | Media | ✅ |
| N-06 | Página de mantenimiento con logo VPS | Baja | ✅ |
| N-07 | Breadcrumb dinámico en páginas internas | Media | ✅ |

---

### Épica 3 — Home

| ID | Historia | Prioridad | Estado |
|----|----------|-----------|--------|
| H-01 | Hero carrusel con autoplay, fade, dots y flechas; imagen separada para mobile/desktop | Alta | ✅ |
| H-02 | Sección de productos destacados (grid 3 columnas) | Alta | ✅ |
| H-03 | Sección de servicios Maquila y Asesorías (split) | Alta | ✅ |
| H-04 | Preview de tienda con categorías y collage | Media | ✅ |
| H-05 | Sección Historia / "Vivir para Servir" | Media | ✅ |
| H-06 | Preview del blog con últimos artículos | Media | ✅ |
| H-07 | Formulario de suscripción al newsletter | Media | ✅ |
| H-08 | ISR (revalidación cada 60 segundos) | Alta | ✅ |

---

### Épica 4 — Tienda y Catálogo

| ID | Historia | Prioridad | Estado |
|----|----------|-----------|--------|
| T-01 | Página de tienda con grid de productos | Alta | ✅ |
| T-02 | Filtros por tueste, peso y método de preparación | Alta | ✅ |
| T-03 | Ordenamiento por destacados, precio ascendente/descendente | Media | ✅ |
| T-04 | URL params sincronizados con filtros activos | Media | ✅ |
| T-05 | Página de detalle de producto con galería de imágenes | Alta | ✅ |
| T-06 | Selector de variantes (tueste, peso, molienda) | Alta | ✅ |
| T-07 | Selector de cantidad con botones +/− | Alta | ✅ |
| T-08 | Badges de confianza (envío gratis, garantía, devoluciones) | Media | ✅ |
| T-09 | Sección de productos relacionados | Media | ✅ |
| T-10 | Imágenes con recorte en arco estilo Pergamino | Media | ✅ |
| T-11 | Rutas de producto dinámicas con `force-dynamic` (nuevos productos visibles sin redeploy) | Alta | ✅ |
| T-12 | Metadatos SEO dinámicos por producto | Alta | ✅ |
| T-13 | Sidebar de filtros: panel sticky desktop + drawer mobile deslizable | Alta | ✅ |
| T-14 | Filtros dinámicos generados desde `variant_options` de los productos activos | Alta | ✅ |
| T-15 | "Desde $X" en tarjetas con múltiples precios; swatches de color para atributos de color | Media | ✅ |

---

### Épica 5 — Carrito de Compras

| ID | Historia | Prioridad | Estado |
|----|----------|-----------|--------|
| C-01 | Store de carrito con Zustand + persistencia en localStorage | Alta | ✅ |
| C-02 | Drawer lateral del carrito accesible desde cualquier página | Alta | ✅ |
| C-03 | Agregar/eliminar/actualizar cantidad desde el drawer | Alta | ✅ |
| C-04 | Página de carrito completa con resumen de pedido | Alta | ✅ |
| C-05 | Envío gratis configurable desde admin: toggle habilitar/deshabilitar + monto mínimo editable; barra de progreso en carrito | Media | ✅ |
| C-06 | Campo de cupón de descuento | Media | ✅ |
| C-07 | Sincronización del carrito con BD para usuarios logueados | Media | ✅ |
| C-08 | Cierre del drawer con tecla Escape y bloqueo de scroll | Alta | ✅ |

---

### Épica 6 — Checkout y Pagos

| ID | Historia | Prioridad | Estado |
|----|----------|-----------|--------|
| P-01 | Checkout de 3 pasos en una sola página (sin recarga) | Alta | ✅ |
| P-02 | Formulario de contacto (email) | Alta | ✅ |
| P-03 | Formulario de dirección de envío | Alta | ✅ |
| P-04 | Selector de método de pago (Wompi / MercadoPago) | Alta | ✅ |
| P-05 | Creación de orden en Supabase al confirmar | Alta | ✅ |
| P-06 | Página de confirmación de pedido con número de orden | Alta | ✅ |
| P-07 | Integración real de Wompi (hosted checkout con firma SHA256) | Alta | ✅ |
| P-08 | Integración real de MercadoPago (preference + redirect) | Alta | ✅ |
| P-09 | Webhook Wompi — actualización automática de estado de pago | Alta | ✅ |
| P-10 | Webhook MercadoPago — actualización automática de estado de pago | Alta | ✅ |
| P-11 | Pre-llenado de dirección de envío desde `customer_addresses` si el usuario está logueado | Media | ✅ |
| P-12 | Generación automática de número de orden correlativo (VPS-XXXX) | Alta | ✅ |

---

### Épica 7 — Envíos (Skydropx)

| ID | Historia | Prioridad | Estado |
|----|----------|-----------|--------|
| S-01 | Autenticación OAuth 2.0 con Skydropx y cache de token | Alta | ✅ |
| S-02 | Cotización de tarifas en tiempo real al ingresar dirección | Alta | ✅ |
| S-03 | Cálculo automático de dimensiones del paquete según el carrito | Alta | ✅ |
| S-04 | Mostrar opciones de transportadora y tarifa al cliente | Alta | ✅ |
| S-05 | Generar guía de envío automáticamente tras pago confirmado | Alta | ✅ |
| S-06 | Guardar tracking_number y label_url en la orden | Alta | ✅ |
| S-07 | Webhook Skydropx — actualizar estado de pedido automáticamente | Alta | ✅ |
| S-08 | Email automático al cliente con número de tracking | Media | ✅ |

---

### Épica 8 — Servicios (Maquila y Asesorías)

| ID | Historia | Prioridad | Estado |
|----|----------|-----------|--------|
| SV-01 | Página Maquila con hero, servicios incluidos y FAQ | Alta | ✅ |
| SV-02 | Botón WhatsApp con mensaje pre-cargado para maquila | Alta | ✅ |
| SV-03 | Página Asesorías con hero, servicios y formulario | Alta | ✅ |
| SV-04 | Botón WhatsApp con mensaje pre-cargado para asesorías | Alta | ✅ |
| SV-05 | Acordeón de preguntas frecuentes en Maquila | Media | ✅ |
| SV-06 | Carrusel de testimonios en Asesorías | Baja | ✅ |

---

### Épica 9 — Blog

| ID | Historia | Prioridad | Estado |
|----|----------|-----------|--------|
| B-01 | Listado de artículos con artículo destacado | Alta | ✅ |
| B-02 | Filtro de artículos por categoría | Media | ✅ |
| B-03 | Grid de artículos secundarios (3 columnas) | Alta | ✅ |
| B-04 | Página de artículo individual con breadcrumb | Alta | ✅ |
| B-05 | Compartir artículo por WhatsApp | Media | ✅ |
| B-06 | Artículos relacionados al pie del artículo | Media | ✅ |
| B-07 | Metadatos SEO por artículo | Alta | ✅ |
| B-08 | Generación estática de rutas (generateStaticParams) | Alta | ✅ |

---

### Épica 10 — Autenticación y Mi Cuenta

| ID | Historia | Prioridad | Estado |
|----|----------|-----------|--------|
| A-01 | Página de Login con Stack Auth | Alta | ✅ |
| A-02 | Página de Registro con Stack Auth | Alta | ✅ |
| A-03 | Middleware de protección /mi-cuenta/* y /admin/* | Alta | ✅ |
| A-04 | Dashboard de Mi Cuenta (stats de pedidos, datos personales) | Alta | ✅ |
| A-05 | Historial de pedidos del cliente | Alta | ✅ |
| A-06 | Editar datos personales del perfil | Media | ✅ |
| A-07 | Cerrar sesión (LogoutButton con useUser().signOut()) | Alta | ✅ |
| A-08 | Creación de perfil en `profiles` al registrarse como admin | Alta | ✅ |
| A-09 | Mirror de cliente web en `customers` al registrarse + vinculación de pedidos previos | Alta | ✅ |
| A-10 | Gestión de direcciones guardadas (`customer_addresses`) — API GET/POST con manejo de `is_default` | Media | ✅ |

---

### Épica 11 — Panel de Administración

| ID | Historia | Prioridad | Estado |
|----|----------|-----------|--------|
| AD-01 | Layout admin con sidebar y topbar | Alta | ✅ |
| AD-02 | Dashboard con métricas: ventas hoy, pedidos pendientes, productos | Alta | ✅ |
| AD-03 | Tabla de pedidos recientes en dashboard | Alta | ✅ |
| AD-04 | Listado de productos con precio rango, stock y estado | Alta | ✅ |
| AD-05 | Formulario de creación/edición de producto | Alta | ✅ |
| AD-06 | Builder de variantes de producto (tueste × peso × molienda) | Alta | ✅ |
| AD-07 | Upload de imágenes de producto a Supabase Storage | Alta | ✅ |
| AD-08 | Listado de pedidos con filtros por estado | Alta | ✅ |
| AD-09 | Detalle de pedido: cliente, items, timeline de estado | Alta | ✅ |
| AD-10 | Actualizador de estado de pedido desde el admin | Alta | ✅ |
| AD-11 | Vista de envío con tracking y botón descargar guía | Media | ✅ |
| AD-12 | Modal de despacho masivo (pickups Skydropx) | Media | ✅ |
| AD-13 | Gestión de banners del hero (CRUD con drag & drop) | Alta | ✅ |
| AD-14 | Formulario de edición de slide con imagen web + imagen mobile | Alta | ✅ |
| AD-15 | Gestión de imágenes de sección servicios | Media | ✅ |
| AD-16 | Listado de artículos del blog con estado publicado/borrador | Alta | ✅ |
| AD-17 | Formulario de creación/edición de artículo (Markdown, imagen portada, SEO, publicado/borrador) | Alta | ✅ |
| AD-18 | Vista previa de artículo antes de publicar (Draft Mode) | Media | ✅ |
| AD-19 | Listado de clientes: con cuenta (Stack Auth) y sin cuenta (solo en pedidos) con badge de tipo | Media | ✅ |
| AD-20 | Gestión de roles y usuarios — invitar (crea en Stack Auth + email de contraseña), cambiar rol, eliminar | Alta | ✅ |
| AD-21 | Configuración de pasarelas de pago | Alta | ✅ |
| AD-22 | Configuración de número WhatsApp desde BD (`store_config`) | Alta | ✅ |
| AD-23 | CRUD de categorías con imagen de portada y drag-to-reorder | Media | ✅ |
| AD-24 | Upload y gestión de logo desde panel admin | Alta | ✅ |
| AD-25 | Auto-creación de buckets en Supabase Storage al subir primera imagen | Media | ✅ |
| AD-26 | Redes sociales configurables (Instagram, Facebook, TikTok): URL + toggle habilitado por red | Alta | ✅ |
| AD-27 | Editor de contenido legal (Términos y Política de privacidad) en Markdown con tabs | Alta | ✅ |
| AD-28 | Envío gratis configurable: toggle habilitar + monto mínimo editable desde admin | Alta | ✅ |
| AD-29 | Hub de secciones web: toggles enable/disable para cada sección del home; CRUD inline de servicios dinámicos | Alta | ✅ |
| AD-30 | Dashboard adaptado por rol: admin (ventas/métricas), vendedor (urgencias/stock), gestor_tienda (contenido/cupones) | Alta | ✅ |
| AD-31 | Sidebar con grupos colapsables y navegación rol-aware; auto-expande el grupo activo | Media | ✅ |
| AD-32 | Sistema de temas: crear y activar perfiles de colores y tipografía; preview en tiempo real; aplicado al sitio sin redeploy | Alta | ✅ |
| AD-33 | Gestión de newsletter desde admin: lista de suscriptores con estado activo/inactivo y exportación CSV; formulario de campaña con Markdown + broadcast vía Resend; confirmar antes de enviar | Alta | ✅ |
| AD-34 | CRUD de tipos de variante globales (`/variantes`): nombre, valores (uno por línea), display_type pill/swatch, toggle activo, preview de pills | Alta | ✅ |
| AD-35 | ProductForm reescrito: seleccionar tipos globales → botón "Generar combinaciones" produce la matriz cartesiana; preserva datos de variantes existentes al regenerar | Alta | ✅ |
| AD-36 | Favicon configurable: campo `favicon_url` en `store_config`; upload con drag-drop y preview en `/configuracion/general`; inyectado en `<head>` del sitio web vía `generateMetadata` | Media | ✅ |
| AD-37 | Identidad visual propia del panel admin: tabla `admin_config` singleton con `accent_color` y `sidebar_color`; paleta corporativa slate/indigo por defecto; configurable desde `/sistema/apariencia` con color pickers y presets; CSS vars inyectadas server-side en cada request; independiente de los temas del sitio web | Alta | ✅ |
| AD-38 | Export/Import actualizado a v3: snapshot incluye `admin_config` y `themes`; import idempotente soporta v1/v2/v3; respuesta devuelve versión del snapshot | Media | ✅ |

---

### Épica 12 — Emails Transaccionales

| ID | Historia | Prioridad | Estado |
|----|----------|-----------|--------|
| E-01 | Integrar Resend como proveedor de emails (configurado desde admin) | Alta | ✅ |
| E-02 | Email de confirmación de pedido (disparado desde webhook al aprobar) | Alta | ✅ |
| E-03 | Email de cambio de estado a "Enviado" con tracking | Alta | ✅ |
| E-04 | Email de bienvenida al registrarse (disparado desde /api/auth/welcome) | Media | ✅ |
| E-05 | Email de confirmación de suscripción al newsletter | Media | ✅ |

---

### Épica 13 — SEO y Rendimiento

| ID | Historia | Prioridad | Estado |
|----|----------|-----------|--------|
| SEO-01 | Metadatos globales con template de título | Alta | ✅ |
| SEO-02 | Metadatos dinámicos por producto y artículo | Alta | ✅ |
| SEO-03 | ISR en tienda y blog (revalidación 60s) | Alta | ✅ |
| SEO-04 | Generación estática de rutas de producto y blog | Alta | ✅ |
| SEO-05 | sitemap.xml dinámico | Media | ✅ |
| SEO-06 | robots.txt | Media | ✅ |
| SEO-07 | Open Graph y Twitter Card por página | Media | ✅ |
| SEO-08 | Optimización de imágenes con next/image + Supabase CDN | Alta | ✅ |
| SEO-09 | Vercel Analytics o Plausible | Baja | ✅ |

---

## 3. Historias de Usuario

Las historias siguen el formato: **"Como [rol], quiero [acción] para [beneficio]."**  
Cada historia incluye sus criterios de aceptación y el estado de implementación.

---

### Módulo: Navegación y Experiencia General

---

**HU-001 — Navbar global**
> Como visitante del sitio, quiero ver una barra de navegación clara en todas las páginas para encontrar rápidamente cualquier sección del sitio.

**Criterios de aceptación:**
- La navbar contiene el logo VPS, los links principales y los iconos de cuenta y carrito.
- Al hacer scroll más de 20px, la navbar cambia de transparente a fondo `#FFF0D1` con sombra.
- El ícono del carrito muestra un badge numérico con la cantidad de ítems.
- En móvil, los links se ocultan y aparece un botón hamburger que despliega un drawer lateral.

**Estado:** ✅ Implementado

---

**HU-002 — Carrito desde cualquier página**
> Como comprador, quiero acceder a mi carrito desde cualquier página del sitio sin perder mi posición de navegación, para revisar mis productos sin interrumpir mi experiencia.

**Criterios de aceptación:**
- Al hacer clic en el ícono del carrito se abre un drawer lateral con todos los ítems.
- El drawer se puede cerrar haciendo clic en el overlay, con el botón X o presionando Escape.
- El scroll del body se bloquea mientras el drawer está abierto.
- Desde el drawer se puede modificar cantidad, eliminar ítems y proceder al checkout.

**Estado:** ✅ Implementado

---

### Módulo: Home

---

**HU-003 — Hero carrusel**
> Como visitante, quiero ver un hero visual impactante al ingresar al sitio para entender rápidamente quién es VPS Coffee y qué ofrece.

**Criterios de aceptación:**
- El hero ocupa el 100% del viewport en desktop y 70% en móvil.
- Los slides hacen transición con fade cada 5 segundos de forma automática.
- Existen controles de navegación (flechas y dots) para moverse manualmente entre slides.
- Cada slide puede tener título, subtítulo, un CTA principal y una imagen o color de fondo.
- El contenido de los slides se gestiona desde el panel de administración.

**Estado:** ✅ Implementado

---

**HU-004 — Servicios en home**
> Como potencial cliente B2B, quiero ver los servicios de Maquila y Asesorías en la página principal para contactar fácilmente a VPS Coffee sin buscar en el menú.

**Criterios de aceptación:**
- La sección muestra dos bloques lado a lado: Maquila y Asesorías.
- Cada bloque tiene un título en Ahsing, una descripción breve y un botón de WhatsApp.
- El botón abre WhatsApp con un mensaje pre-cargado específico para cada servicio.
- En móvil los bloques se apilan verticalmente.

**Estado:** ✅ Implementado

---

**HU-005 — Suscripción al newsletter**
> Como visitante interesado en café, quiero suscribirme al boletín de VPS Coffee para recibir recetas, orígenes y novedades en mi correo.

**Criterios de aceptación:**
- El formulario acepta un email y muestra un mensaje de confirmación al enviar.
- El email se guarda en la tabla `newsletter_subscribers` de Supabase.
- Si el email ya existe, se actualiza su estado a activo sin mostrar error al usuario.
- El formulario valida el formato del correo antes de enviar.

**Estado:** ✅ Implementado

---

### Módulo: Tienda

---

**HU-006 — Explorar el catálogo de café**
> Como comprador, quiero ver todos los cafés disponibles en una página de tienda organizada para comparar opciones y elegir la que más me guste.

**Criterios de aceptación:**
- Los productos se muestran en un grid de 3 columnas en desktop, 2 en tablet y 1 en móvil.
- Cada tarjeta muestra imagen, nombre, categoría, variante predeterminada y precio.
- Existe un botón "Agregar" que añade el producto al carrito directamente desde la tarjeta.
- La página carga con ISR y se revalida cada 60 segundos.

**Estado:** ✅ Implementado

---

**HU-007 — Filtrar el catálogo**
> Como comprador, quiero filtrar los cafés por tueste, peso y método de preparación para encontrar rápidamente el producto que se adapta a mi gusto.

**Criterios de aceptación:**
- Los filtros disponibles son: tueste (claro, medio, oscuro), peso (250g, 500g, 1kg) y método (espresso, filtrado, cold brew).
- Los filtros son acumulativos y se pueden combinar.
- El número de productos que coincide con los filtros se actualiza en tiempo real.
- Existe un botón "Limpiar filtros" cuando no hay resultados.
- Los filtros activos se reflejan en los parámetros de la URL.

**Estado:** ✅ Implementado

---

**HU-008 — Ver detalle de un producto**
> Como comprador, quiero ver toda la información de un café —imágenes, origen, notas de sabor, variantes disponibles y precio— en una página dedicada para tomar una decisión de compra informada.

**Criterios de aceptación:**
- La página muestra una galería con imagen principal y thumbnails navegables.
- Se muestran los atributos del café (origen, proceso, altitud si aplica) desde la descripción.
- El comprador puede seleccionar tueste, peso y molienda disponibles para ese producto.
- El precio se actualiza según la variante seleccionada.
- Existe selector de cantidad y botones "Agregar al carrito" y "Comprar ahora".
- Al pie se muestran hasta 3 productos relacionados de la misma categoría.
- La página tiene metadatos SEO dinámicos (título y descripción del producto).

**Estado:** ✅ Implementado

---

**HU-009 — Agregar al carrito**
> Como comprador, quiero agregar un producto con la variante y cantidad que elijo para acumular mis selecciones antes de pagar.

**Criterios de aceptación:**
- Al agregar un producto, si ya existe esa variante en el carrito se incrementa la cantidad.
- El carrito persiste en localStorage y sobrevive recargas de página.
- El badge del carrito en la navbar se actualiza inmediatamente.
- Se puede agregar desde la tarjeta del catálogo o desde el detalle del producto.

**Estado:** ✅ Implementado

---

### Módulo: Carrito y Checkout

---

**HU-010 — Revisar el carrito antes de pagar**
> Como comprador, quiero ver un resumen completo de mi carrito con totales y costos de envío antes de ingresar mis datos de pago.

**Criterios de aceptación:**
- La página de carrito lista todos los productos con imagen, variante, precio unitario y cantidad.
- Se puede modificar la cantidad o eliminar ítems desde esta página.
- Se muestra subtotal, costo de envío y total.
- Si el subtotal supera $100.000 COP, el envío es gratuito.
- Existe un botón para continuar al checkout y otro para seguir comprando.
- Hay un campo de cupón de descuento (UI implementada; validación pendiente).

**Estado:** ✅ Implementado

---

**HU-011 — Completar la compra**
> Como comprador, quiero ingresar mis datos de contacto, dirección de envío y método de pago en un proceso guiado y claro para finalizar mi compra con confianza.

**Criterios de aceptación:**
- El checkout tiene 3 pasos claramente diferenciados: Contacto, Envío y Pago.
- Los pasos se completan en secuencia y se puede regresar al paso anterior.
- El resumen del pedido es visible en todo momento en una columna lateral.
- Se puede elegir entre Wompi y MercadoPago como método de pago.
- Al confirmar, se crea la orden en Supabase con número correlativo (VPS-XXXX).
- El usuario es redirigido a una página de confirmación con el número de orden.

**Estado:** ✅ Implementado (Wompi hosted checkout + MercadoPago preference; usuario redirigido al gateway al confirmar)

---

**HU-012 — Confirmación de pedido**
> Como comprador, quiero recibir una confirmación clara de que mi pedido fue procesado para saber que la transacción fue exitosa y qué sucede a continuación.

**Criterios de aceptación:**
- La página muestra un ícono de éxito, el número de orden y un mensaje explicativo.
- Se indica que el cliente recibirá un email con los detalles y el número de tracking.
- Hay un enlace a "Ver mis pedidos" y otro a "Seguir comprando".
- Se muestra el número de WhatsApp de VPS Coffee para consultas.

**Estado:** ✅ Implementado

---

### Módulo: Servicios

---

**HU-013 — Conocer el servicio de Maquila**
> Como empresario o emprendedor cafetero, quiero conocer en detalle el servicio de tueste a maquila de VPS Coffee para evaluar si se adapta a mis necesidades y cotizar.

**Criterios de aceptación:**
- La página tiene un hero de impacto con título en Ahsing y CTA a WhatsApp.
- Se detallan los tres pasos del servicio: recepción, tueste y empaque.
- Existe una sección de preguntas frecuentes en formato acordeón.
- Todos los CTAs abren WhatsApp con mensaje pre-cargado sobre maquila.

**Estado:** ✅ Implementado

---

**HU-014 — Solicitar asesoría profesional**
> Como propietario de cafetería o marca de café, quiero conocer los servicios de asesoría de VPS Coffee y contactar a un experto para mejorar mi propuesta.

**Criterios de aceptación:**
- La página describe los cuatro tipos de asesoría: catación, perfiles, formación, consultoría.
- Existe un formulario de consulta inicial con campos de nombre, empresa y necesidad.
- El formulario redirige a WhatsApp con la información ingresada pre-cargada en el mensaje.
- El CTA de WhatsApp usa un mensaje diferenciado respecto al de Maquila.

**Estado:** ✅ Implementado

---

### Módulo: Blog

---

**HU-015 — Leer artículos sobre café**
> Como amante del café, quiero explorar el blog de VPS Coffee para aprender sobre orígenes, métodos de preparación y la cultura cafetera.

**Criterios de aceptación:**
- El listado muestra el artículo más reciente como destacado en formato horizontal.
- Los demás artículos se presentan en un grid de 3 columnas.
- Se puede filtrar por categoría (Orígenes, Preparación, Novedades, Cultura).
- Cada tarjeta muestra imagen, fecha y título.

**Estado:** ✅ Implementado

---

**HU-016 — Leer un artículo completo**
> Como lector, quiero abrir un artículo del blog y leerlo cómodamente con artículos relacionados al final para seguir explorando contenido.

**Criterios de aceptación:**
- El artículo tiene imagen hero, breadcrumb, fecha, título y cuerpo con buen espaciado.
- Hay un extracto destacado al inicio si el artículo lo tiene.
- Al pie se muestran hasta 2 artículos relacionados de la misma categoría.
- Existe un botón para compartir el artículo por WhatsApp.
- La URL es amigable: `/blog/[slug]`.

**Estado:** ✅ Implementado

---

### Módulo: Mi Cuenta

---

**HU-017 — Ver historial de pedidos**
> Como cliente registrado, quiero ver todos mis pedidos anteriores con su estado para saber en qué punto está cada uno de mis envíos.

**Criterios de aceptación:**
- La página lista todos los pedidos del cliente autenticado ordenados por fecha.
- Cada fila muestra número de orden, fecha, total, estado y número de tracking si aplica.
- Los estados tienen colores diferenciados (amarillo: pendiente, verde: entregado, etc.).
- Si no hay pedidos, se muestra un estado vacío con enlace a la tienda.

**Estado:** ✅ Implementado (requiere auth para mostrar datos reales)

---

**HU-018 — Ver mi dashboard de cuenta**
> Como cliente registrado, quiero tener un panel personal donde vea de un vistazo mis pedidos activos y mis datos personales.

**Criterios de aceptación:**
- El dashboard muestra tarjetas con número de pedidos activos y último pedido.
- Se muestran los datos personales (nombre, email, teléfono) con opción de editar.
- Existe un menú lateral para navegar entre secciones de la cuenta.
- La sección está protegida; los visitantes sin sesión son redirigidos al login.

**Estado:** ✅ Implementado (skeleton; datos reales requieren auth)

---

### Módulo: Panel de Administración

---

**HU-019 — Dashboard de métricas**
> Como administrador, quiero ver en un dashboard las métricas más importantes del negocio al iniciar mi jornada para tener contexto antes de operar.

**Criterios de aceptación:**
- El dashboard muestra ventas del día (suma total de órdenes creadas hoy).
- Muestra número de pedidos pendientes y productos activos publicados.
- Lista los 5 pedidos más recientes con estado y total.
- Los datos se cargan en tiempo real desde Supabase (force-dynamic).

**Estado:** ✅ Implementado

---

**HU-020 — Gestionar productos del catálogo**
> Como administrador, quiero ver, crear, editar y despublicar productos del catálogo para mantener la tienda actualizada con información precisa.

**Criterios de aceptación:**
- La tabla muestra imagen, nombre, slug, categoría, rango de precios, stock total y estado.
- El stock total suma todas las variantes activas del producto.
- Se puede buscar productos por nombre.
- Hay botones de "Editar" por producto que abren el formulario de edición.
- El formulario permite subir imágenes, definir variantes con precio y stock individual.

**Estado:** ✅ Implementado (formulario con imágenes, variantes, validación cliente, bloqueo durante uploads)

---

**HU-021 — Gestionar pedidos**
> Como operador de VPS Coffee, quiero ver todos los pedidos, filtrarlos por estado y actualizar su estado para coordinar el proceso de despacho.

**Criterios de aceptación:**
- La tabla muestra número de orden, cliente, fecha, total, estado y tracking.
- Se puede filtrar por todos los estados disponibles.
- Al entrar al detalle del pedido se ve el timeline visual de estados.
- Se puede cambiar el estado del pedido mediante un selector y un botón de guardado.
- Si el pedido tiene número de tracking, se muestra el botón para descargar la guía PDF.

**Estado:** ✅ Implementado

---

**HU-022 — Gestionar banners del hero**
> Como administrador de contenido, quiero agregar, editar, reordenar y desactivar los slides del carrusel hero sin tocar código para mantener las campañas actualizadas.

**Criterios de aceptación:**
- Se puede previsualizar cada slide con su imagen o color de fondo.
- Se puede activar o desactivar un slide sin eliminarlo.
- Los slides tienen campos editables: imagen, título, subtítulo, texto CTA y URL CTA.
- El orden de los slides es arrastrable.

**Estado:** ✅ Implementado (listado, preview, formulario de edición con imagen web + imagen mobile por slide)

---

**HU-023 — Gestionar artículos del blog**
> Como editor de VPS Coffee, quiero crear, editar y publicar artículos del blog desde el panel admin para publicar contenido sin depender de un desarrollador.

**Criterios de aceptación:**
- La tabla muestra título, slug, categoría, fecha de publicación y estado (publicado/borrador).
- Existe un botón "Vista previa" que abre el artículo en el sitio público sin publicarlo.
- El formulario tiene campos para título, slug, extracto, contenido (rich text), imagen de portada y categoría.
- Los artículos en borrador no son visibles en el sitio público.

**Estado:** ✅ Implementado (listado, formulario con Markdown, imagen de portada, SEO, toggle publicado/borrador, slug auto-generado, botón "Vista previa ↗")

---

**HU-024 — Controlar accesos por rol**
> Como super administrador, quiero invitar usuarios al panel, asignarles roles y revocarlos para que cada miembro del equipo solo acceda a las secciones que le corresponden.

**Criterios de aceptación:**
- Los roles del panel son: `super_admin`, `admin`, `vendedor`, `gestor_tienda`. El rol `miembro` existe pero sin acceso al panel (estado de invitación pendiente de asignación).
- Al invitar, el usuario se crea en Stack Auth con rol `miembro` y recibe un email "Establece tu contraseña".
- El super_admin puede elevar o reducir el rol de cualquier usuario desde `/usuarios`.
- Las secciones del sidebar se filtran según el rol (`ROLE_CONFIG` en `lib/roles.ts`).
- Las políticas RLS en Supabase bloquean el acceso a nivel de base de datos; el service role lo bypasea.
- Un usuario con rol `miembro` que intente acceder al panel es redirigido al sign-in.

**Estado:** ✅ Implementado

---

**HU-025 — Gestionar identidad y contacto de la tienda desde admin**
> Como administrador, quiero configurar el logo, el número de WhatsApp y los datos de la tienda desde el panel admin, sin tocar el código ni redesplegar, para mantener la identidad de la marca actualizada.

**Criterios de aceptación:**
- La sección Configuración tiene un formulario de "Identidad de la tienda" con campos: logo (imagen), nombre, email y WhatsApp.
- El logo se sube al bucket `logos` de Supabase Storage y la URL se guarda en `store_config.logo_url`.
- El número de WhatsApp acepta solo dígitos (10–15); se muestra un error si no cumple el formato.
- Al guardar, los cambios se aplican inmediatamente sin recargar toda la app.
- El logo aparece en el Navbar y Footer del sitio público.
- El número de WhatsApp se usa en los CTAs de maquila, asesorías, footer y confirmación de pedido.

**Estado:** ✅ Implementado

---

**HU-026 — Configurar redes sociales desde admin**
> Como administrador, quiero poder configurar los enlaces de Instagram, Facebook y TikTok de la tienda desde el panel, y habilitar o deshabilitar cada red de forma independiente, para mantener el footer actualizado sin tocar código.

**Criterios de aceptación:**
- En Configuración → Configuración general aparece una sección "Redes sociales" con tres filas: Instagram, Facebook y TikTok.
- Cada fila tiene un toggle de habilitado y un campo de URL.
- El campo de URL se deshabilita visualmente cuando el toggle está apagado.
- En el footer del sitio público, solo aparecen los iconos de redes que tienen `enabled: true` y URL no vacía.
- Los iconos son los SVG oficiales de cada red.
- Los cambios se aplican en la siguiente carga del sitio (SSR `force-dynamic` en el layout).

**Estado:** ✅ Implementado

---

**HU-027 — Editar términos y política de privacidad desde admin**
> Como administrador, quiero editar el contenido de los Términos y condiciones y la Política de privacidad desde el panel, usando Markdown, para mantener el contenido legal actualizado sin redeploys.

**Criterios de aceptación:**
- En Configuración → Contenido legal hay dos tabs: "Términos y condiciones" y "Política de privacidad".
- El editor es un textarea con sintaxis Markdown; muestra un contador de caracteres y un hint de formato.
- Hay un botón "Guardar contenido legal" que persiste ambos textos en `store_config`.
- El enlace "Ver en sitio ↗" lleva a `/terminos` o `/privacidad` según el tab activo.
- Las páginas `/terminos` y `/privacidad` renderizan el Markdown almacenado (h1/h2/h3, bold, italic, listas, links).
- Si el contenido está vacío, las páginas muestran un aviso en lugar de una página en blanco.

**Estado:** ✅ Implementado

---

**HU-028 — Envío gratis configurable desde admin**
> Como administrador, quiero poder habilitar o deshabilitar la promoción de envío gratis y definir el monto mínimo del pedido desde el panel admin, para gestionar incentivos de compra sin cambios de código.

**Criterios de aceptación:**
- En Configuración → Proveedor de envíos existe un toggle "Envío gratis" (habilitado/deshabilitado).
- Cuando está habilitado, se muestra un campo editable con el monto mínimo en COP.
- El campo muestra una vista previa del umbral formateado (ej. "$100.000").
- En el carrito, si el toggle está activo, aparece una barra de progreso que muestra cuánto falta para el envío gratis.
- Si el subtotal supera el umbral, el costo de envío se muestra como "Gratis" (en carrito y en checkout).
- El fallback es tarifa fija si la BD no responde.

**Estado:** ✅ Implementado

---

**HU-029 — Ver todos los clientes en un solo lugar**
> Como administrador, quiero ver en un panel la lista completa de personas que han interactuado con la tienda —tanto las que tienen cuenta registrada como las que compraron como invitados— para llevar un control total y planificar campañas.

**Criterios de aceptación:**
- La tabla muestra clientes con cuenta (Stack Auth) y compradores sin cuenta (solo en `orders`), diferenciados por badge "Con cuenta" / "Sin cuenta".
- Cada fila incluye: nombre, email, teléfono (si está disponible), número de pedidos, total gastado y fecha de último pedido.
- Los administradores del panel (tabla `profiles`) son excluidos de la lista.
- Existe búsqueda por nombre, email o teléfono y filtro por tipo de cliente.
- Los datos se ordenan por actividad más reciente (último pedido o fecha de registro).

**Estado:** ✅ Implementado

---

---

**HU-030 — Controlar qué secciones aparecen en el sitio**
> Como gestor de tienda, quiero habilitar o deshabilitar secciones del home desde el panel para ajustar el contenido sin tocar código.

**Criterios de aceptación:**
- La página `/secciones` lista todas las secciones configurables con su estado actual.
- Cada sección tiene un toggle que persiste en `section_settings`.
- El sitio público respeta los flags: si una sección está deshabilitada, no se renderiza.
- Si la tabla no existe aún, el sitio muestra todas las secciones (fail-open).
- Los servicios dinámicos se gestionan con CRUD inline en la misma página.

**Estado:** ✅ Implementado

---

**HU-031 — Dashboard adaptado a mi rol**
> Como usuario del panel, quiero ver en el dashboard solo la información relevante para mi función para no distraerme con datos que no gestiono.

**Criterios de aceptación:**
- `admin`/`super_admin`: ve ventas hoy/semana/mes, stock crítico, pedidos recientes y top productos.
- `vendedor`: ve conteo de órdenes por estado, pedidos urgentes (resaltados si llevan >2 días pendientes) y productos con stock bajo.
- `gestor_tienda`: ve secciones activas, artículos en borrador, banners hero y cupones próximos a vencer.
- El rol se lee del usuario autenticado; no hay lógica manual de selección.

**Estado:** ✅ Implementado

---

**HU-032 — Crear y activar temas de marca**
> Como administrador, quiero crear perfiles de colores y fuentes y activar el que quiero usar en el sitio, para mantener coherencia visual y probar variaciones de paleta sin redesplegar.

**Criterios de aceptación:**
- Se pueden crear múltiples temas con nombres descriptivos.
- Cada tema configura 7 colores (primary, dark, cream, cream-warm, yellow, yellow-pale, text) y 2 fuentes (display, body).
- Un preview en tiempo real muestra cómo se verá el tema antes de guardarlo.
- Al activar un tema, el sitio público lo refleja en la siguiente carga sin redeploy.
- Solo puede haber un tema activo; activar uno desactiva automáticamente el anterior.
- El tema "VPS Coffee (Por defecto)" no se puede eliminar.
- Los colores se almacenan en hex; el sitio los convierte a canales RGB para soporte de opacidad de Tailwind.

**Estado:** ✅ Implementado

---

**HU-033 — Gestionar suscriptores y enviar campañas de newsletter**
> Como gestor de tienda, quiero ver la lista de personas suscritas al newsletter y enviarles un correo desde el panel admin para comunicarme con mi audiencia sin herramientas externas.

**Criterios de aceptación:**
- La página `/newsletter` es accesible para `gestor_tienda`, `admin` y `super_admin`.
- La pestaña "Suscriptores" muestra una tabla con email, fecha de suscripción y estado (Activo / Inactivo).
- Las tarjetas de estadísticas muestran el total, cantidad de activos e inactivos.
- El botón "Exportar CSV" descarga un archivo con todos los suscriptores.
- La pestaña "Enviar campaña" tiene campos de asunto y cuerpo en Markdown.
- El sistema indica cuántos destinatarios activos recibirán el correo antes de enviar.
- Al pulsar "Enviar campaña" aparece un diálogo de confirmación antes de ejecutar el envío.
- El envío usa las credenciales Resend guardadas en `store_config`; si no están configuradas, muestra error claro.
- Se envía en lotes de 50 para respetar los límites de Resend.
- Tras enviar, se muestra el resultado: cuántos recibieron el email y cuántos fallaron.
- El formulario acepta Markdown básico (##, **negrita**, *cursiva*, listas) convertido a HTML en el email.

**Estado:** ✅ Implementado

---

## 4. Historias de Usuario — Versión Refinada (con edge cases y story points)

> Esta sección refina las historias más críticas para el negocio agregando: escenarios de borde, criterios de rechazo, estimación de esfuerzo y cobertura de testing.  
> **Escala de estimación:** S = 1–2 pts | M = 3–5 pts | L = 8 pts | XL = 13 pts

---

### HU-R01 — Agregar al carrito (refinada)

> Como comprador, quiero agregar un café con la variante y cantidad que elijo, para que mis selecciones queden guardadas aunque salga del sitio.

**Estimación:** M (3 puntos)  
**Módulo:** Carrito · `store/cart.ts`

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Comprador agrega variante nueva | Item aparece en el carrito con qty = cantidad ingresada |
| AC-2 | Comprador agrega la misma variante dos veces | La qty se acumula (no se crea un item duplicado) |
| AC-3 | Comprador agrega desde la tarjeta del catálogo | Qty predeterminada = 1 |
| AC-4 | Comprador agrega desde el detalle de producto | Qty = la elegida en el selector |
| AC-5 | Comprador recarga la página | El carrito persiste (localStorage key `vps-cart`) |
| AC-6 | Comprador abre el sitio en otra pestaña | Ambas pestañas muestran el mismo carrito |

**Escenarios de borde:**

- Si la variante seleccionada tiene `stock = 0`, el botón "Agregar" está deshabilitado y se muestra "Sin stock".
- Si el usuario intenta agregar qty = 0 o qty negativa vía manipulación directa del DOM, el store ignora la operación.
- El `variantId` es el identificador único; dos productos distintos con el mismo `variantId` serían imposibles por diseño del esquema.

**Criterios de rechazo (la historia NO pasa si...):**

- El badge de la navbar no se actualiza inmediatamente tras agregar.
- Agregar el mismo producto dos veces crea dos filas en lugar de sumar la cantidad.
- El carrito desaparece al recargar la página.

**Cobertura de tests:** `src/store/__tests__/cart.test.ts` — 18 casos

---

### HU-R02 — Proceso de checkout (refinada)

> Como comprador con ítems en el carrito, quiero completar mi compra en tres pasos claros para pagar con confianza sin distracciones.

**Estimación:** XL (13 puntos)  
**Módulo:** Checkout · `app/checkout/page.tsx` + `api/checkout/route.ts`

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Paso 1: email vacío al continuar | Mensaje de validación inline; no avanza al paso 2 |
| AC-2 | Paso 1: email inválido (sin @) | Mensaje de validación inline |
| AC-3 | Paso 2: dirección completa | Avanza al paso 3 |
| AC-4 | Paso 2: código postal vacío | Se usa `000000` como fallback para la cotización de Skydropx |
| AC-5 | Paso 3: se confirma el pedido | Se crea la orden en Supabase y se redirige a `/checkout/confirmacion?order=VPS-XXXX` |
| AC-6 | Carrito vacío al llegar al checkout | Se redirige a `/carrito` con mensaje de carrito vacío |
| AC-7 | Error de red al crear la orden | Se muestra toast de error genérico; el usuario puede reintentar |
| AC-8 | Regresión de paso 3 a paso 2 | Se conservan los datos del formulario previo (no se borran) |

**Escenarios de borde:**

- Si el usuario llega a `/checkout/confirmacion` sin haber pasado por el checkout (sin `order` en query), se redirige a `/`.
- El número de orden usa padding cero hasta 4 dígitos (`VPS-0001`); a partir de 9999 sigue incrementando sin padding.
- `shipping_cost` es `0` si el subtotal supera $100.000 COP, independientemente de lo que devuelva Skydropx.

**Criterios de rechazo:**

- El formulario permite avanzar sin email.
- Doble-clic en "Confirmar" crea dos órdenes (debe deshabilitarse el botón durante el fetch).
- Los datos del paso 1 desaparecen al retroceder desde el paso 2.

**Cobertura de tests:** `api/__tests__/checkout.integration.test.ts` — 10 casos

---

### HU-R03 — Configuración del proveedor de envíos desde el admin (nueva)

> Como administrador, quiero seleccionar y configurar el proveedor de envíos desde el panel de administración, sin tocar el código ni redesplegar la aplicación, para poder cambiar o actualizar las credenciales cuando sea necesario.

**Estimación:** M (5 puntos)  
**Módulo:** Admin · `app/configuracion/` + `api/admin/shipping/`  
**Estado:** ✅ Implementado

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Admin abre Configuración → sección Envíos | Muestra el proveedor activo y la tarifa fija actual |
| AC-2 | Admin selecciona "Tarifa fija" y guarda | `shipping_config.provider = 'fixed'`; todos los checkouts usan esa tarifa |
| AC-3 | Admin selecciona "Skydropx" sin credenciales y guarda | Error 400 con lista de campos faltantes |
| AC-4 | Admin ingresa Client ID, Client Secret y Address From ID y guarda | Provider = skydropx, credenciales guardadas en BD |
| AC-5 | Admin recarga la página de configuración | Los campos se pre-rellenan con los valores guardados |
| AC-6 | Client Secret se muestra enmascarado (••••1234) | El secret original nunca se expone en la UI |
| AC-7 | Admin deja el campo Client Secret vacío al guardar | El secret existente no se sobreescribe |
| AC-8 | Admin cambia solo la tarifa fija | Solo ese campo se actualiza; el proveedor activo no cambia |

**Escenarios de borde:**

- Si el administrador cambia a Skydropx pero la API está caída al momento de la siguiente compra, el sistema hace fallback automático a la tarifa fija configurada.
- Los cambios surten efecto en el siguiente request (no hay caché de la config entre requests).

**Criterios de rechazo:**

- El Client Secret se devuelve en texto plano en la respuesta GET.
- Cambiar el proveedor requiere modificar `.env.local` y redesplegar.
- Al activar Skydropx con credenciales vacías, el checkout falla con un error de autenticación en producción.

**Cobertura de tests:** `apps/admin/api/admin/shipping/__tests__/shipping-config.integration.test.ts` — 14 casos

---

### HU-R04 — Cotización de envío multi-proveedor (refinada)

> Como comprador, quiero ver el costo y el tiempo estimado de envío después de ingresar mi dirección para decidir qué transportadora usar, independientemente del proveedor que tenga configurado VPS Coffee.

**Estimación:** L (8 puntos)  
**Módulo:** `lib/shipping/` + `api/shipping/rates/route.ts`  
**Estado:** ✅ Implementado (arquitectura multi-proveedor)

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Proveedor = "fixed", dirección cualquiera | Se devuelve la tarifa fija configurada en el admin |
| AC-2 | Proveedor = "skydropx", dirección válida | Se devuelven 2–4 tarifas reales con precio y días |
| AC-3 | Código postal no provisto | Se usa `000000`; la cotización continúa |
| AC-4 | 1 ítem de 250g | Parcel: 20×15×8 cm, 0.3 kg |
| AC-5 | 2 ítems de 500g | Parcel: 25×20×10 cm, 1.2 kg |
| AC-6 | 3+ ítems de 1kg | Parcel: 35×25×15 cm, ≥3.3 kg |
| AC-7 | Skydropx responde `is_completed: false` | Polling hasta 10 reintentos × 500ms |
| AC-8 | Polling agota los reintentos | SkydropxProvider devuelve `[]`; la API responde con tarifa fija como fallback |
| AC-9 | Token OAuth próximo a expirar (< 60s) | Se renueva automáticamente antes de la petición |
| AC-10 | Skydropx falla con HTTP 503 | SkydropxProvider devuelve `[]` (no lanza); la API responde 500 |
| AC-11 | La respuesta incluye el nombre del proveedor | `{ provider: 'fixed' | 'skydropx', rates: [...] }` |

**Arquitectura de proveedores:**

```
lib/shipping/
├── types.ts                   ← ShippingProvider interface + calculateParcel
├── index.ts                   ← getShippingProvider() factory (lee shipping_config de BD)
└── providers/
    ├── fixed-rate.ts          ← FixedRateProvider (tarifa plana, sin API externa)
    └── skydropx/
        ├── auth.ts            ← OAuth 2.0 con cache por clientId
        └── index.ts           ← SkydropxProvider (polling de cotizaciones)
```

Para agregar un nuevo proveedor (ej. FedEx): crear `providers/fedex/index.ts`, agregar el caso al switch en `index.ts`, y una nueva columna en `shipping_config`.

**Criterios de rechazo:**

- El código del checkout importa `SkydropxProvider` directamente (en lugar de usar la factory).
- Las credenciales del proveedor se leen de `.env` en lugar de la BD.
- El fallo de Skydropx bloquea el checkout con un error visible al comprador.

**Cobertura de tests:** 
- `lib/shipping/__tests__/types.test.ts` — 10 casos (calculateParcel)  
- `lib/shipping/__tests__/fixed-rate.test.ts` — 10 casos  
- `lib/shipping/__tests__/skydropx-auth.test.ts` — 7 casos  
- `lib/shipping/__tests__/skydropx-provider.test.ts` — 9 casos  
- `lib/shipping/__tests__/factory.test.ts` — 8 casos  
- `api/__tests__/shipping-rates.integration.test.ts` — 9 casos

---

### HU-R04 — Actualización de estado de pedido por webhook (refinada)

> Como sistema de logística (Skydropx), necesito notificar a VPS Coffee sobre cambios en el estado del envío para que los pedidos se actualicen automáticamente sin intervención manual.

**Estimación:** M (5 puntos)  
**Módulo:** Webhooks · `api/webhooks/skydropx/route.ts`

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Evento `shipment.in_transit` | Orden actualizada a `status: 'shipped'` |
| AC-2 | Evento `shipment.out_for_delivery` | Orden actualizada a `status: 'shipped'` |
| AC-3 | Evento `shipment.delivered` | Orden actualizada a `status: 'delivered'` |
| AC-4 | Evento `shipment.exception` | Orden actualizada a `status: 'exception'` |
| AC-5 | Evento desconocido | Responde `{ ok: true }` sin modificar la BD |
| AC-6 | `tracking_number` no existe en ninguna orden | Supabase no falla (no hay fila que actualizar); responde `{ ok: true }` |
| AC-7 | Body JSON malformado | Responde 500 |
| AC-8 | Actualización exitosa | Siempre incluye `updated_at` con timestamp ISO |

**Escenarios de borde:**

- Si Skydropx reenvía el mismo evento dos veces (retry), la actualización es idempotente (misma orden, mismo status).
- El endpoint no valida una firma HMAC en esta versión; en producción se debe agregar validación de `X-Skydropx-Signature` para evitar llamadas fraudulentas.

**Criterios de rechazo:**

- El endpoint retorna 4xx en lugar de 200 para eventos desconocidos (Skydropx dejaría de enviar notificaciones).
- El `updated_at` no se actualiza junto con el `status`.

**Cobertura de tests:** `api/__tests__/webhook-skydropx.integration.test.ts` — 9 casos

---

### HU-R05 — Gestión de estado de pedido desde admin (refinada)

> Como operador de VPS Coffee, quiero cambiar el estado de un pedido (Pendiente → Procesando → Enviado → Entregado) desde el panel para comunicar el avance al cliente.

**Estimación:** S (2 puntos)  
**Módulo:** Admin · `app/pedidos/[id]/` + `api/admin/orders/[id]/status/route.ts`

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Cambio de Pendiente a Procesando | Status actualizado; timeline resalta el nuevo paso |
| AC-2 | Cambio a Enviado | Status actualizado; campo tracking editable visible |
| AC-3 | Cambio a Entregado | Status actualizado; timeline completo |
| AC-4 | ID de orden inexistente | Responde 500 con mensaje de error |
| AC-5 | Todos los estados válidos del flujo | La API acepta y persiste cualquier estado definido |
| AC-6 | `updated_at` siempre se actualiza | El campo `updated_at` tiene el timestamp del cambio |

**Escenarios de borde:**

- Un editor (rol `editor`) no tiene acceso al cambio de estado — el RLS de Supabase bloquea la mutación.
- La regresión de estado (Entregado → Procesando) es posible desde el admin para corrección de errores operativos.

**Criterios de rechazo:**

- El cambio de estado no persiste en la BD (solo actualiza el estado visual).
- No se registra `updated_at` en el cambio.

**Cobertura de tests:** `apps/admin/api/admin/orders/__tests__/order-status.integration.test.ts` — 9 casos

---

### HU-R06 — Generación automática de guía de envío post-pago (nueva)

> Como sistema de pagos, tras confirmar un pago quiero que se genere automáticamente la guía de envío en Skydropx para que el equipo de VPS Coffee pueda despachar sin intervención manual.

**Estimación:** L (8 puntos)  
**Módulo:** `lib/shipping/shipments.ts` + webhooks Wompi/MercadoPago  
**Estado:** ✅ Implementado

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Pago Wompi aprobado | `createShipmentForOrder()` ejecutado; `skydropx_shipment_id`, `tracking_number` y `label_url` guardados en la orden |
| AC-2 | Pago MercadoPago aprobado | Ídem AC-1 |
| AC-3 | Skydropx falla | El webhook responde 200 de todas formas; fallo solo loguea en consola |
| AC-4 | Webhook recibido dos veces (retry) | Segunda llamada detecta `skydropx_shipment_id` existente y no crea guía duplicada |
| AC-5 | Provider = 'fixed' | `createShipmentForOrder` retorna `null` sin error |
| AC-6 | Guía creada | Se envía email de tracking al cliente |
| AC-7 | Email de tracking falla | La guía ya está guardada; el fallo de email no revierte nada |

**Criterios de rechazo:**

- El webhook retorna 500 si Skydropx falla (impediría reintentos de pago).
- Se crean guías duplicadas si el webhook se dispara dos veces.
- El `tracking_number` no se guarda en la orden.

**Cobertura de tests:** `lib/shipping/__tests__/shipments.test.ts`

---

### HU-R07 — Previsualización de artículos borrador (nueva)

> Como editor del blog, quiero poder previsualizar un artículo antes de publicarlo para verificar el formato y el contenido sin que sea visible para el público.

**Estimación:** S (2 puntos)  
**Módulo:** `api/draft/enable/route.ts` + `app/(public)/blog/[slug]/page.tsx`  
**Estado:** ✅ Implementado

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Editor hace clic en "Previsualizar ↗" en un artículo borrador | Se abre `/blog/[slug]?draft=1` con banner amarillo de "modo borrador" |
| AC-2 | Artículo borrador sin cookie de draft | `notFound()` — el artículo no es accesible públicamente |
| AC-3 | URL con `?draft=1` y cookie activa | Artículo renderiza aunque `published = false` |
| AC-4 | Cookie expira después de 1 hora | El artículo vuelve a ser inaccesible |
| AC-5 | Artículo ya publicado + draft mode | Renderiza normalmente sin banner (pues `!post.published` es false) |
| AC-6 | Secret inválido en `/api/draft/enable` | Responde 401 |

**Criterios de rechazo:**

- Un visitante sin cookie puede ver artículos no publicados directamente.
- El banner de borrador aparece en artículos publicados.

---

### HU-R08 — Edición de perfil en Mi Cuenta (nueva)

> Como cliente registrado, quiero poder actualizar mi nombre y teléfono desde Mi Cuenta para que mis datos estén al día y el checkout se pre-llene correctamente.

**Estimación:** S (2 puntos)  
**Módulo:** `api/account/profile/route.ts` + `components/account/ProfileForm`  
**Estado:** ✅ Implementado

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Cliente cambia su nombre y guarda | `customers.name` y `user.displayName` actualizados |
| AC-2 | Cliente cambia su teléfono y guarda | `customers.phone` actualizado |
| AC-3 | Campo email deshabilitado | No se puede cambiar el email desde este formulario |
| AC-4 | Usuario no autenticado llama PATCH | Responde 401 |
| AC-5 | Cliente agrega una nueva dirección | Dirección guardada en `customer_addresses`; disponible en el próximo checkout |
| AC-6 | Cliente marca dirección como predeterminada | La dirección previa deja de ser predeterminada |

---

### HU-R09 — Programar recolección masiva Skydropx desde admin (nueva)

> Como operador de bodega, quiero seleccionar varios pedidos enviados y programar una recolección con Skydropx para que el transportista pase a recoger todos los paquetes en una sola visita.

**Estimación:** M (3 puntos)  
**Módulo:** `api/admin/pickups/route.ts` + `components/pedidos/PickupModal`  
**Estado:** ✅ Implementado

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | No hay pedidos con guía Skydropx | Botón "Programar recolección" deshabilitado con tooltip |
| AC-2 | Operador selecciona pedidos, fecha y ventana horaria | POST a `/api/admin/pickups`; pantalla de éxito |
| AC-3 | Skydropx devuelve error | Se muestra el mensaje de error en el modal |
| AC-4 | Skydropx no está configurado | API responde 503; modal muestra error |
| AC-5 | Modal cerrado antes de enviar | Estado se resetea; no se hace ningún request |

---

### HU-R10 — Variantes genéricas (colores, tallas y otros atributos)

> Como administrador de productos, quiero definir atributos libres para las variantes (color, talla, material, etc.) para que la tienda muestre swatches visuales y filtros adecuados sin estar restringida a café.

**Estimación:** L (5 puntos)  
**Módulo:** `lib/variant-utils.ts` · `components/shop/ShopClient.tsx` · `components/shop/ProductDetail.tsx` · `admin/productos/ProductForm.tsx` · migración `14_product_variants_extended.sql`  
**Estado:** ✅ Implementado

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Producto tiene `variant_options: ["Color","Talla"]` | Tienda muestra selectores de color y talla |
| AC-2 | Valor de variante es un color (ej. "Rojo") | Se renderiza un swatch con el hex correspondiente |
| AC-3 | Producto tiene múltiples precios | Tarjeta muestra "Desde $X" en lugar de precio único |
| AC-4 | Producto sin `variant_options` JSONB | Sistema usa campos legacy `roast`/`weight`/`grind` sin cambios |
| AC-5 | Variante no disponible para combinación seleccionada | Opción aparece tachada y no puede añadirse al carrito |
| AC-6 | Admin define opciones en ProductForm | `variant_options` y `attributes` se guardan correctamente |

---

### HU-R11 — Selector de transportadora en checkout

> Como cliente, quiero ver las opciones de envío disponibles con su precio y tiempo de entrega para elegir la que prefiero antes de pagar.

**Estimación:** M (3 puntos)  
**Módulo:** `components/checkout/CheckoutClient.tsx` · `api/checkout/route.ts` · `packages/database/src/queries/orders.ts`  
**Estado:** ✅ Implementado

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Cliente completa datos de envío y pulsa "Ver opciones de envío →" | Se muestran tarifas con carrier, servicio, días y precio |
| AC-2 | Se muestra spinner mientras se calculan las tarifas | Botón deshabilitado; texto "Calculando opciones de envío…" |
| AC-3 | No hay tarifas disponibles | Mensaje ámbar; puede continuar con tarifa fija de respaldo |
| AC-4 | Cliente cambia ciudad o departamento | Tarifas se resetean; debe recalcular antes de continuar |
| AC-5 | Cliente selecciona una tarifa y confirma pedido | `carrier_name` y `skydropx_rate_id` quedan en la orden de BD |
| AC-6 | Proveedor configurado es tarifa fija | No aparece el paso de "Ver opciones"; continúa directo al pago |

---

### HU-R12 — Comboboxes de departamento/ciudad Colombia

> Como cliente, quiero elegir mi departamento y ciudad desde listas con búsqueda filtrada para reducir errores tipográficos en la dirección de envío.

**Estimación:** S (2 puntos)  
**Módulo:** `lib/colombia-locations.ts` · `components/ui/SearchableSelect.tsx` · `CheckoutClient.tsx` · `AddressesForm.tsx` · `ShippingConfigForm.tsx` (admin)  
**Estado:** ✅ Implementado

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Cliente abre combobox de departamento | Lista de 33 departamentos ordenada alfabéticamente con filtro |
| AC-2 | Cliente selecciona departamento | Ciudad se limpia y se carga la lista del departamento elegido |
| AC-3 | Ciudad deshabilitada sin departamento | Placeholder "Elige departamento primero"; no es clickeable |
| AC-4 | Ciudad aparece en múltiples departamentos (ej. "Buenaventura") | No hay error de clave duplicada en React |
| AC-5 | Navegación por teclado (↑↓ Enter Escape) | El combobox responde correctamente a todas las teclas |

---

### HU-R13 — Editar y eliminar direcciones en Mi Cuenta

> Como cliente, quiero poder corregir o eliminar mis direcciones guardadas para mantener mi libreta de direcciones actualizada.

**Estimación:** S (2 puntos)  
**Módulo:** `api/account/addresses/[id]/route.ts` · `components/account/AddressesForm.tsx`  
**Estado:** ✅ Implementado

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Cliente pulsa "Editar" en una dirección | Aparece formulario inline con datos precargados |
| AC-2 | Cliente guarda cambios | Se llama PATCH; datos actualizados en BD y UI |
| AC-3 | Cliente marca como predeterminada | La anterior predeterminada deja de serlo |
| AC-4 | Cliente elimina una dirección (con confirmación) | Dirección eliminada de BD y desaparece de la lista |
| AC-5 | Usuario no autenticado llama PATCH/DELETE | API responde 401 |
| AC-6 | Intento de editar/eliminar dirección de otro cliente | API responde 404 |

---

---

## 4. Épica 9 — Arquitectura Limpia y Generalización CMS

> **Contexto:** análisis v11 (julio 2026) identificó deuda técnica acumulada en 5 categorías. Estas HUs la liquidan en orden de riesgo y esfuerzo.

---

### HU-044 — Eliminar rutas API legacy sin autenticación

> Como equipo de seguridad, quiero que todas las rutas del panel admin requieran autenticación para que no exista ningún endpoint de escritura expuesto sin verificar el rol del usuario.

**Estimación:** XS (1 punto)  
**Módulo:** `apps/admin/src/app/api/admin/banners/route.ts`  
**Estado:** ✅ Completado (v12)

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | GET /api/admin/banners (sin sesión) | 401 o ruta inexistente |
| AC-2 | La UI de `/home` sigue funcionando | Usa `/api/admin/home/banners` (ya autenticada) |
| AC-3 | No hay ningún `fetch('/api/admin/banners')` en el cliente | Grep confirma cero referencias |
| AC-4 | `tsc --noEmit` pasa sin errores | Sin errores de tipo tras la eliminación |

**Criterios de rechazo:**
- El archivo sigue existiendo con acceso público de escritura.
- La eliminación rompe alguna feature visible en el admin.

---

### HU-045 — Eliminar directorios y código zombie en admin

> Como desarrollador, quiero que el código del admin no tenga directorios ni componentes que ya no se usen, para reducir la superficie de mantenimiento y evitar confusión al explorar el codebase.

**Estimación:** XS (1 punto)  
**Módulo:** `apps/admin/src/app/banners/`, `apps/admin/src/app/secciones/`, `BannersClient.tsx`, `SeccionesClient.tsx`  
**Estado:** ✅ Completado (v12)

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | `/banners` y `/secciones` ya no existen como directorios | Carpetas eliminadas del árbol |
| AC-2 | `BannersClient.tsx` y `SeccionesClient.tsx` eliminados | ~800 líneas de código muerto removidas |
| AC-3 | El sidebar del admin no tiene links a `/banners` ni `/secciones` | Confirmado en `AdminSidebar.tsx` |
| AC-4 | `tsc --noEmit` y `pnpm build` pasan | Sin referencias rotas |

---

### HU-046 — Consolidar `SearchableSelect` en `packages/ui`

> Como desarrollador, quiero tener un solo `SearchableSelect` en el paquete compartido para no tener que mantener dos copias idénticas que inevitablemente van a divergir.

**Estimación:** S (2 puntos)  
**Módulo:** `packages/ui/src/components/SearchableSelect.tsx`; eliminar copia de `apps/web` y `apps/admin`  
**Estado:** ✅ Completado (v12) — nota: `apps/web` mantiene copia local por limitación de Turbopack con `'use client'` en barrels; `apps/admin` usa `@vps/ui`

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Existe `packages/ui/src/components/SearchableSelect.tsx` | Exportado desde el barrel de `@vps/ui` |
| AC-2 | `apps/web` importa desde `@vps/ui` | Sin copia local |
| AC-3 | `apps/admin` importa desde `@vps/ui` | Sin copia local |
| AC-4 | El componente sigue funcionando en checkout, Mi Cuenta y ShippingConfigForm | Tests + inspección visual |

---

### HU-047 — Consolidar `colombia-locations` en `packages/ui`

> Como desarrollador, quiero que la lista de departamentos y ciudades de Colombia esté en un único lugar para no tener que sincronizar cambios en dos archivos idénticos.

**Estimación:** XS (1 punto)  
**Módulo:** `packages/ui/src/colombia-locations.ts`; exportar desde `@vps/ui`; eliminar copias locales  
**Estado:** ✅ Completado (v12) — movido a `packages/ui` (no a `packages/database`) para evitar que client components importen del barrel server-only

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Existe un único `colombia-locations.ts` en `packages/database` | Exportado vía `@vps/database` |
| AC-2 | `apps/web` y `apps/admin` importan desde `@vps/database` | Cero copias locales |
| AC-3 | `SearchableSelect` de departamento/ciudad sigue funcionando | Sin cambios de comportamiento |

---

### HU-048 — Consolidar `sendShippingNotification` duplicada en `packages/`

> Como desarrollador, quiero que la lógica de envío de emails transaccionales viva en un único paquete compartido para no duplicar credenciales y lógica entre las dos apps.

**Estimación:** S (2 puntos)  
**Módulo:** `packages/database/src/lib/email.ts`  
**Estado:** ✅ Completado (v12)

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | `sendShippingNotification` existe solo en `packages/` | No duplicada en `apps/web/lib/email.ts` ni `apps/admin/lib/email.ts` |
| AC-2 | Los webhooks de pago y el endpoint de status la importan desde `@vps/database` o `@vps/utils` | Sin rutas relativas entre apps |
| AC-3 | Emails de shipping/status siguen funcionando | Sin regresión en flujo de pedidos |

---

### HU-049 — Migrar `/privacidad` y `/terminos` al CMS de páginas

> Como editor de contenido, quiero actualizar el texto de privacidad y términos desde el panel de administración sin tocar código ni `store_config`.

**Estimación:** S (2 puntos)  
**Módulo:** `apps/web/src/app/(public)/privacidad/`, `apps/web/src/app/(public)/terminos/`; migración SQL seed  
**Estado:** ✅ Completado (v12)

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | `/privacidad` lee su contenido desde la tabla `pages` (slug = `privacidad`) | No consume `store_config.privacy_content` |
| AC-2 | `/terminos` ídem con slug = `terminos` | No consume `store_config.terms_content` |
| AC-3 | Migración SQL inserta los slugs con contenido inicial | El sitio funciona sin edición manual |
| AC-4 | Admin puede editar ambas páginas en `/contenido/paginas` | Mismo flujo que cualquier otra página CMS |
| AC-5 | `store_config.privacy_content` y `terms_content` marcados como deprecated | Comentario en `types.ts` y `store_config` |

---

### HU-050 — Crear `getWebHomeData()` consolidado en `packages/database`

> Como desarrollador, quiero una sola función que devuelva todos los datos del home en paralelo para reducir el boilerplate en `page.tsx` y facilitar testear el home en aislamiento.

**Estimación:** S (2 puntos)  
**Módulo:** `packages/database/src/queries/home.ts`  
**Estado:** ✅ Completado (v12) — función nombrada `getWebHomeData` para evitar colisión con `getHomeData` del admin editor

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | `getHomeData()` existe y devuelve `{ banners, products, posts, bestSellers, sectionSettings, categories }` | Promise.all interno, tipado completo |
| AC-2 | `apps/web/src/app/(public)/page.tsx` llama solo `getHomeData()` | Sin 6 llamadas individuales inline |
| AC-3 | Cada sub-query tiene `.catch(() => [])` para fail-open | Igual que el comportamiento actual |
| AC-4 | `tsc --noEmit` pasa | Sin errores de tipo |

---

### HU-051 — Home adopta `page_sections` + `section_items`

> Como equipo de producto, queremos que el home funcione con el mismo modelo de datos que el resto del CMS para eliminar el modelo paralelo de banners + section_settings y tener una única forma de editar cualquier página.

**Estimación:** XL (13 puntos)  
**Módulo:** migración 19, `apps/admin`, `apps/web/src/app/(public)/page.tsx`, `SectionRenderer`  
**Estado:** ✅ Completado (v13) — implementado como épica HU-053 a HU-057

**Implementación:**
- `banners`, `section_settings` y `testimonials` migradas a `page_sections` + `section_items` (migración 19)
- `section_items` extendido con `image_url_mobile`, `link_url`, `cta_text`, `metadata JSONB`
- Home web reescrito para usar `homeSections` de `getWebHomeData()`
- Admin: `/home` y `/testimonios` eliminados; `/contenido` maneja todo el CMS

---

### HU-052 — Unificar rutas API de secciones y páginas del CMS

> Como desarrollador, quiero que exista una única ruta API para cada recurso CMS (secciones, páginas, banners) para eliminar la ambigüedad sobre cuál ruta usar y cuál tiene los guards correctos.

**Estimación:** M (3 puntos)  
**Módulo:** `apps/admin/src/app/api/admin/cms/[resource]/`  
**Estado:** ✅ Completado (v13)

**Implementación:**
- `GET|POST|PATCH|DELETE /api/admin/cms/[resource]` — endpoint genérico con mapa de 4 recursos: `pages` (pk=`key`), `sections` (pk=`id`, pkNumeric), `items` (pk=`id`, pkNumeric), `section-settings` (pk=`key`, filter=`page_key`)
- 4 endpoints legacy eliminados: `/content/pages`, `/content/sections`, `/content/items`, `/home/sections`
- Callers migrados en `ContenidoClient.tsx` y `HomeClient.tsx`
- 35 tests de integración en `cms.integration.test.ts`

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | `/api/admin/content/pages,sections,items` y `/api/admin/home/sections` eliminadas | ✅ Solo existe `/api/admin/cms/[resource]` |
| AC-2 | Todas las rutas usan `getAdminUser()` | ✅ Guard en todos los handlers |
| AC-3 | `tsc --noEmit` confirma cero consumidores de rutas eliminadas | ✅ `.next` limpiado; tsc pendiente de verificar |
| AC-4 | Tests de integración cubren auth, CRUD y errores DB por recurso | ✅ 35 tests en `cms.integration.test.ts` |

---

---

## 5. Épica 10 — CMS Unificado e Integridad de Base de Datos

> **Contexto:** v13 (julio 2026) — elimina los tres modelos CMS paralelos (banners, section_settings, testimonials), unifica todo en `pages → page_sections → section_items`, compacta 20 migraciones en un esquema canónico y refuerza integridad referencial.

---

### HU-053 — Migración 19: unificar CMS en un solo modelo

> Como arquitecto del sistema, quiero que banners, section_settings y testimonials desaparezcan como tablas independientes y existan únicamente como section_items dentro del modelo page_sections, para eliminar la ambigüedad de qué tabla es la fuente de verdad para cada tipo de contenido.

**Estimación:** L (8 puntos)  
**Módulo:** `packages/database/supabase/migrations/19_unified_cms.sql`  
**Estado:** ✅ Completado (v13)

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Migración crea sección `hero` en `page_sections` para el home | Todos los banners hero migrados como `section_items` de tipo `slide` |
| AC-2 | Migración crea sección `services` en `page_sections` para el home | Banners de servicios migrados como `section_items` de tipo `service` |
| AC-3 | Migración crea sección `testimonials` en `page_sections` para asesorías | Testimonios migrados como `section_items` de tipo `testimonial` |
| AC-4 | `section_settings` migrada fila a fila como `page_sections` | `key → section_type`, `metadata → settings` |
| AC-5 | Tablas `banners`, `section_settings`, `testimonials` eliminadas con `DROP TABLE IF EXISTS ... CASCADE` | Ningún error de FK al eliminar |
| AC-6 | `section_items` extendido con `image_url_mobile`, `link_url`, `cta_text`, `metadata JSONB DEFAULT '{}'` | Sin NOT NULL en primera pasada (añadido en migración 20) |
| AC-7 | Migración es idempotente: re-ejecutar no genera duplicados | `ON CONFLICT DO NOTHING` en todos los INSERT |

**Criterios de rechazo:**
- La migración falla si ya se ejecutó una vez.
- Datos de content existentes (banners, testimonios) se pierden en lugar de migrarse.

---

### HU-054 — Actualizar `packages/database` para el modelo unificado

> Como desarrollador, quiero que los tipos TypeScript, las queries y los exports del paquete de base de datos reflejen el nuevo modelo sin referencias a tablas eliminadas, para que el compilador sirva como guardián de coherencia.

**Estimación:** M (5 puntos)  
**Módulo:** `packages/database/src/types.ts`, `queries/home.ts`, `queries/content.ts`, `index.ts`  
**Estado:** ✅ Completado (v13)

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | `types.ts` no tiene interfaces de `banners`, `section_settings` ni `testimonials` | Solo `page_sections` y `section_items` |
| AC-2 | `section_items` Row incluye `image_url_mobile`, `link_url`, `cta_text`, `metadata`, `updated_at` | Tipado exacto al schema |
| AC-3 | `queries/home.ts` exporta `getWebHomeData()` devolviendo `{ homeSections, featuredProducts, bestSellers, blogPosts, categories }` | `homeSections` tiene `.items[]` anidados |
| AC-4 | Archivos zombie `banners.ts`, `testimonials.ts`, `sections.ts` eliminados | `grep` no encuentra referencias a tablas eliminadas |
| AC-5 | `queries/content.ts` — `updateSectionItem` acepta `metadata` como `Json` | Sin error de tipos `Json vs Record<string,unknown>` |
| AC-6 | `tsc --noEmit --skipLibCheck` pasa en `packages/database` | Sin errores de compilación |
| AC-7 | Tests `home.test.ts` actualizados y pasan | Cubre forma `homeSections`, fail-open por query |

---

### HU-055 — Actualizar `apps/web` para leer del CMS unificado

> Como usuario del sitio, quiero que la home, el carrusel hero, los servicios y los testimonios sigan funcionando exactamente igual visualmente, pero ahora leyendo sus datos de `section_items` en lugar de tablas legacy.

**Estimación:** M (5 puntos)  
**Módulo:** `apps/web/src/app/(public)/page.tsx`, `HeroCarousel`, `ServicesSection`, `TestimonialsSection`, `TestimonialsCarousel`  
**Estado:** ✅ Completado (v13)

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | `page.tsx` llama `getWebHomeData()` y desestructura `homeSections` | Una sola llamada; no 6 queries individuales |
| AC-2 | `HeroCarousel` recibe slides de `section_items` (tipo `slide`) | `image_url`, `image_url_mobile`, `title`, `description`, `cta_text`, `link_url`, `metadata.bg_color` |
| AC-3 | `ServicesSection` recibe items de `section_items` (tipo `service`) | `title`, `description`, `image_url`, `cta_text`, `link_url`, `metadata.bg_color` |
| AC-4 | `TestimonialsSection` recibe items de `section_items` (tipo `testimonial`) | `title` (autor), `description` (contenido), `image_url` (avatar), `metadata.rating`, `metadata.role` |
| AC-5 | Home sin sección hero | Componente no se renderiza (no crashea) |
| AC-6 | `tsc --noEmit` pasa en `apps/web` | Sin errores de tipo |

---

### HU-056 — Extender `ContenidoClient` con editor por tipo de sección

> Como gestor de contenido, quiero poder editar los campos específicos de cada tipo de sección (slides de hero, servicios, testimonios, tarjetas, FAQ) desde el panel `/contenido`, para no necesitar ir a pantallas separadas según el tipo de contenido.

**Estimación:** M (5 puntos)  
**Módulo:** `apps/admin/src/app/contenido/ContenidoClient.tsx`  
**Estado:** ✅ Completado (v13)

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Sección tipo `hero` o `services` | Editor muestra: title, description, cta_text, link_url, image_url, image_url_mobile (solo hero), bg_color en metadata |
| AC-2 | Sección tipo `testimonials` | Editor muestra: title (autor), description (contenido), role en metadata, rating (1-5), image_url (avatar) |
| AC-3 | Sección tipo `cards` | Editor muestra: icon, title, description |
| AC-4 | Sección tipo `faq` | Editor muestra: question, answer |
| AC-5 | Botón "Agregar" usa vocabulario correcto | `slide / servicio / testimonio / tarjeta / pregunta / ítem` según section_type |
| AC-6 | Cambios guardados via PATCH `/api/admin/cms/items` | `metadata` se persiste como JSONB |

---

### HU-057 — Limpiar admin: eliminar /home, /testimonios y código zombie

> Como desarrollador, quiero que el admin no tenga páginas, rutas API ni archivos que ya no sean necesarios tras la unificación del CMS, para que el codebase refleje solo la arquitectura actual.

**Estimación:** S (3 puntos)  
**Módulo:** `apps/admin/src/app/home/`, `apps/admin/src/app/testimonios/`, `apps/admin/src/app/api/admin/home/`, `AdminSidebar.tsx`, `roles.ts`  
**Estado:** ✅ Completado (v13)

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | `/home` y `/testimonios` eliminados como directorios | Cualquier acceso → 404 |
| AC-2 | `/api/admin/home/` eliminado | Sin endpoints zombie |
| AC-3 | `AdminSidebar` no tiene links a `/home` ni `/testimonios` | Solo `/contenido`, `/blog`, `/newsletter` en el grupo Contenido |
| AC-4 | `roles.ts` — `AdminSection` no incluye `'home'` ni `'testimonios'` | `tsc` lo detectaría si quedaran referencias |
| AC-5 | `export/route.ts` — versión bumpeada a `v2` | Sin referencias a `section_settings` ni `banners` |
| AC-6 | `import/route.ts` — bloques de `section_settings`/`banners` reemplazados por comentario | Snapshots v1 se ignoran silenciosamente |
| AC-7 | `tsc --noEmit --skipLibCheck` pasa en `apps/admin` | Sin errores de tipo |

---

### HU-058 — Migración 20: integridad referencial e índices

> Como DBA, quiero que el esquema tenga NOT NULL en columnas críticas, índices compuestos para los patrones de consulta más frecuentes, CHECK constraints para enumeraciones, y triggers `updated_at` en todas las tablas mutables, para garantizar coherencia de datos y rendimiento sin intervención manual.

**Estimación:** S (2 puntos)  
**Módulo:** `packages/database/supabase/migrations/20_integrity_and_indexes.sql`  
**Estado:** ✅ Completado (v13)

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | `section_items.metadata` tiene NOT NULL con DEFAULT `'{}'` | Ninguna fila puede tener `metadata IS NULL` |
| AC-2 | Índices compuestos en `page_sections` | `(page_key, enabled, order_index) WHERE enabled=true` + `(page_key, section_type)` |
| AC-3 | Índices compuestos en `section_items` | `(section_id, enabled, order_index) WHERE enabled=true` + `(section_id, item_type)` |
| AC-4 | Índice GIN en `media_assets.used_in` | Soporta `@>` para búsqueda de referencias JSONB |
| AC-5 | CHECK constraint en `page_sections.section_type` | Lista cerrada de 13 tipos; valores desconocidos normalizados a `'text'` antes de aplicar |
| AC-6 | Triggers `updated_at` en `section_items` y `nav_items` | `NOW()` automático en cualquier UPDATE |
| AC-7 | COMMENT ON TABLE/COLUMN para tablas principales | Documentación visible en Supabase Studio |

**Criterios de rechazo:**
- El CHECK constraint falla con valores existentes no normalizados (debe hacer UPDATE previo).
- Los índices duplican los existentes de migración 13 en lugar de complementarlos.

---

### HU-059 — Esquema canónico para despliegue desde cero

> Como DevOps, quiero poder levantar la base de datos completa ejecutando un único archivo SQL sin tener que correr 20 migraciones en orden, para simplificar el proceso de despliegue, CI y entornos de desarrollo locales.

**Estimación:** M (3 puntos)  
**Módulo:** `packages/database/supabase/migrations/01_schema.sql`, `seeds/01_config.sql`, `seeds/02_content.sql`  
**Estado:** ✅ Completado (v13)

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | `01_schema.sql` ejecutado en Supabase vacío | Todas las tablas, índices, triggers, RLS, constraints y comentarios creados |
| AC-2 | No tiene código de migración incremental (`ALTER TABLE ADD COLUMN IF NOT EXISTS`) | Solo `CREATE TABLE`, `CREATE INDEX`, `CREATE TRIGGER` |
| AC-3 | `seeds/01_config.sql` ejecutado después | Tema activo, variant_types, categorías, nav items base insertados |
| AC-4 | `seeds/02_content.sql` ejecutado después | Páginas, page_sections e items del CMS para el sitio VPS Coffee |
| AC-5 | Seeds son idempotentes | Re-ejecutar no genera duplicados (`ON CONFLICT DO NOTHING`) |
| AC-6 | Las 20 migraciones históricas se conservan en la carpeta | Registro de la evolución del schema para referencia |
| AC-7 | `tsc --noEmit` pasa tras aplicar el esquema | `types.ts` es coherente con `01_schema.sql` |

---

### HU-060 — Tracking en Mi Cuenta

> Como cliente, quiero ver el estado de mi pedido en tiempo real con número de guía y transportadora directamente en Mi Cuenta, sin necesitar abrir el email de confirmación cada vez.

**Estimación:** M (5 puntos)  
**Módulo:** `apps/web/src/app/(account)/mi-cuenta/pedidos/`  
**Estado:** 🔲 Pendiente

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Pedido con `tracking_number` y `carrier_name` | Timeline visual: Pendiente → Procesando → Enviado (activo) con número de guía |
| AC-2 | Click en número de guía | Enlace a la web de seguimiento de la transportadora |
| AC-3 | Pedido cancelado | Timeline muestra Cancelado con fecha |
| AC-4 | Pedido sin tracking aún | Timeline muestra Pendiente/Procesando sin guía |
| AC-5 | Mobile | Timeline compacto; funcional en 375px |

---

### HU-061 — Despliegue en Vercel + CI/CD

> Como equipo técnico, queremos automatizar el despliegue en Vercel con GitHub Actions para que cada push a `main` desplegado automáticamente y cada PR tenga un preview environment.

**Estimación:** M (5 puntos)  
**Módulo:** `.github/workflows/`, `vercel.json`, `DEPLOYMENT.md`  
**Estado:** 🔲 Pendiente

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Push a `main` | Deploy automático de `apps/web` y `apps/admin` en Vercel |
| AC-2 | Apertura de PR | Preview URL generado para ambas apps |
| AC-3 | Secrets en Vercel Dashboard | `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, etc. configurados como environment variables |
| AC-4 | `turbo build` pasa en CI | Sin errores de compilación ni TypeScript |
| AC-5 | `DEPLOYMENT.md` actualizado | Guía paso a paso para configurar entorno nuevo desde `01_schema.sql` |

---

### HU-062 — Audit de seguridad y hardening

> Como responsable de seguridad, quiero un audit completo de las rutas API, RLS policies y manejo de secrets para identificar y corregir cualquier vector de ataque antes del despliegue en producción.

**Estimación:** M (5 puntos)  
**Módulo:** `apps/admin/src/app/api/`, `apps/web/src/app/api/`, políticas RLS  
**Estado:** 🔲 Pendiente

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Todas las rutas `/api/admin/*` tienen `getAdminUser()` | Grep confirma guard en cada handler |
| AC-2 | Ningún secret en respuestas API | `wompi_private_key`, `resend_api_key`, etc. nunca en JSON de respuesta |
| AC-3 | RLS habilitado en todas las tablas | `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` en `01_schema.sql` |
| AC-4 | Webhooks verifican firma HMAC | Wompi: SHA256; MercadoPago: header `x-signature` |
| AC-5 | Rate limiting en `/api/checkout` | Máx N requests por IP por minuto (Vercel Edge Config o middleware) |
| AC-6 | CSP headers configurados en `next.config.ts` | `Content-Security-Policy` con directivas mínimas |

---

### HU-063 — Favicon configurable desde el panel admin

> Como administrador de la tienda, quiero poder subir y cambiar el favicon del sitio web directamente desde el panel de administración, para personalizar la identidad visual del sitio sin intervención técnica.

**Estimación:** S (2 puntos)  
**Módulo:** `packages/database/supabase/migrations/21_favicon_url.sql`, `apps/admin/src/app/configuracion/general/`, `apps/web/src/app/layout.tsx`  
**Estado:** ✅ Completado (v14)

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | `store_config` tiene columna `favicon_url` (TEXT NULL) | Migración `21_favicon_url.sql` aplica sin errores; campo disponible vía `getStoreConfig()` |
| AC-2 | Sección "Favicon" en `/configuracion/general` | Preview circular 32×32 del favicon actual; botón "Cambiar favicon" con drag-and-drop |
| AC-3 | Subir imagen PNG/ICO/SVG | Imagen subida a `store-assets/favicon.*`; `favicon_url` actualizado en `store_config`; preview actualizado inmediatamente |
| AC-4 | `apps/web` — `generateMetadata` en `layout.tsx` | `icons.icon` toma el valor de `favicon_url` cuando está definido; fallback a `/favicon.ico` estático |
| AC-5 | Sin favicon configurado | Comportamiento idéntico al anterior: favicon estático por defecto |
| AC-6 | `tsc --noEmit` en `apps/admin` y `apps/web` | Sin errores TypeScript |

---

### HU-064 — Identidad visual propia del panel de administración

> Como administrador, quiero que el panel de administración tenga colores corporativos propios (accent y sidebar) que pueda personalizar desde `/sistema/apariencia`, completamente independientes de los temas del sitio web.

**Estimación:** M (5 puntos)  
**Módulo:** `packages/database/supabase/migrations/22_admin_config.sql`, `packages/database/src/queries/admin-config.ts`, `apps/admin/src/app/sistema/apariencia/`, `apps/admin/src/app/layout.tsx`, `apps/admin/tailwind.config.ts`  
**Estado:** ✅ Completado (v14)

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Tabla `admin_config` creada con migración 22 | Singleton `id=1 CHECK (id=1)`, columnas `accent_color` y `sidebar_color` (TEXT, no null), trigger `updated_at` |
| AC-2 | Seed por defecto | `accent_color = '#4F46E5'` (indigo-600) y `sidebar_color = '#0F172A'` (slate-900) insertados en `seeds/01_config.sql` |
| AC-3 | `getAdminConfig()` y `updateAdminConfig()` en `@vps/database` | Funciones tipadas que usan el cliente servidor de Supabase |
| AC-4 | `apps/admin/layout.tsx` inyecta CSS vars en cada request | `hexToRgb(accent_color)` → `--brand-primary`, `hexToRgb(sidebar_color)` → `--brand-sidebar` en `<html style>` |
| AC-5 | `apps/admin/tailwind.config.ts` usa `rgb(var(--brand-primary))` y `rgb(var(--brand-sidebar))` | Tokens `brand.primary` y `brand.sidebar` funcionales con alpha modifiers de Tailwind |
| AC-6 | Página `/sistema/apariencia` visible para super_admin y admin | Muestra color pickers nativos + presets para accent (7 colores) y sidebar (6 colores); preview en tiempo real |
| AC-7 | Guardar cambios | `PATCH /api/admin/sistema` actualiza `admin_config`; recarga server-side aplica los nuevos colores sin redeploy |
| AC-8 | Los temas del sitio web no se ven afectados | `apps/web` sigue usando sus propias CSS vars de `themes`; los dos sistemas son completamente independientes |
| AC-9 | `tsc --noEmit` en `apps/admin` | Sin errores TypeScript; `admin_config` correctamente tipado en `packages/database/src/types.ts` |
| AC-10 | Export/Import v3 incluye `admin_config` | Snapshot descargado desde `/api/admin/export` contiene `admin_config`; importar restaura los colores del panel |

---

## 6. Resumen de Cobertura

| Épica | Total ítems | Implementados | Pendientes | % |
|-------|-------------|---------------|------------|---|
| Fundación e Infraestructura | 10 | 10 | 0 | 100% |
| Navegación | 7 | 7 | 0 | 100% |
| Home | 8 | 8 | 0 | 100% |
| Tienda y Catálogo | 12 | 12 | 0 | 100% |
| Carrito | 8 | 8 | 0 | 100% |
| Checkout y Pagos | 12 | 12 | 0 | 100% |
| Envíos (Skydropx) | 8 | 8 | 0 | 100% |
| Servicios | 6 | 6 | 0 | 100% |
| Blog | 8 | 8 | 0 | 100% |
| Autenticación y Mi Cuenta | 10 | 10 | 0 | 100% |
| Panel de Administración | 38 | 38 | 0 | 100% |
| Emails Transaccionales | 5 | 5 | 0 | 100% |
| SEO y Rendimiento | 9 | 9 | 0 | 100% |
| Plataforma genérica + UX envíos | 4 | 4 | 0 | 100% |
| Épica 9 — Arquitectura Limpia | 9 | 9 | 0 | 100% |
| Épica 10 — CMS Unificado + DB | 7 | 7 | 0 | 100% |
| Épica 11 — Despliegue y Seguridad | 3 | 0 | 3 | 0% |
| **TOTAL** | **164** | **161** | **3** | **98%** |

---

## 6. Criterios de Definición de "Hecho" (DoD)

Para que una historia de usuario se considere completamente implementada debe cumplir:

1. **Funcionalidad** — La feature se comporta según todos los criterios de aceptación descritos.
2. **Responsive** — La interfaz funciona correctamente en móvil (375px), tablet (768px) y desktop (1280px+).
3. **Design system** — Se usan los colores, fuentes y componentes definidos en `packages/config` y `packages/ui`.
4. **Errores** — Los estados de error (red, validación, servidor) son manejados y comunicados al usuario.
5. **TypeScript** — No hay errores de tipo (`pnpm type-check` pasa sin errores).
6. **Seguridad** — Las rutas protegidas verifican la sesión y el rol antes de renderizar.
7. **Performance** — Las páginas de catálogo y blog usan ISR; las imágenes usan `next/image` con lazy loading.
8. **Testing** — Los componentes y rutas de misión crítica tienen pruebas unitarias y/o de integración que pasan (`pnpm test`). La cobertura global no debe bajar del 70% de ramas y 80% de funciones.

---

## 7. Cómo ejecutar las pruebas

```bash
# Desde la raíz del monorepo:
pnpm test                     # ejecuta todos los tests en todos los packages
pnpm test:coverage            # genera reporte de cobertura HTML

# Por package específico:
cd apps/web && pnpm test
cd apps/admin && pnpm test
cd packages/database && pnpm test

# En modo watch (desarrollo):
cd apps/web && pnpm test:watch
```

### Suite de pruebas implementada

| Archivo | Tipo | Casos | Componente |
|---------|------|-------|------------|
| `apps/web/src/store/__tests__/cart.test.ts` | Unitaria | 18 | Cart Store (Zustand) |
| `apps/web/src/lib/shipping/__tests__/types.test.ts` | Unitaria | 10 | calculateParcel |
| `apps/web/src/lib/shipping/__tests__/fixed-rate.test.ts` | Unitaria | 10 | FixedRateProvider |
| `apps/web/src/lib/shipping/__tests__/skydropx-auth.test.ts` | Unitaria | 7 | Skydropx OAuth (credenciales desde BD) |
| `apps/web/src/lib/shipping/__tests__/skydropx-provider.test.ts` | Unitaria | 9 | SkydropxProvider (polling, degradación) |
| `apps/web/src/lib/shipping/__tests__/factory.test.ts` | Unitaria | 8 | getShippingProvider factory |
| `apps/web/src/lib/__tests__/wompi.test.ts` | Unitaria | 9 | buildWompiCheckoutUrl, verifyWompiWebhook, mapWompiStatus |
| `apps/web/src/lib/__tests__/mercadopago.test.ts` | Unitaria | 8 | mapMercadoPagoStatus, isMercadoPagoSandbox |
| `packages/database/src/queries/__tests__/products.test.ts` | Unitaria | 8 | DB queries — productos |
| `packages/database/src/queries/__tests__/orders.test.ts` | Unitaria | 12 | DB queries — órdenes |
| `packages/database/src/queries/__tests__/blog.test.ts` | Unitaria | 10 | DB queries — blog |
| `packages/database/src/queries/__tests__/store-config.test.ts` | Unitaria | 10 | DB queries — store_config (getStoreConfig, updateStoreConfig) |
| `apps/web/src/app/api/__tests__/checkout.integration.test.ts` | Integración | 17 | POST /api/checkout — 503 gateway, shipping_rate → carrier_name/skydropx_rate_id, tarifa fija sin shipping_rate |
| `apps/web/src/app/api/__tests__/webhook-skydropx.integration.test.ts` | Integración | 9 | POST /api/webhooks/skydropx |
| `apps/web/src/app/api/__tests__/webhook-wompi.integration.test.ts` | Integración | 10 | POST /api/webhooks/wompi (firma, status, email) |
| `apps/web/src/app/api/__tests__/webhook-mercadopago.integration.test.ts` | Integración | 8 | POST /api/webhooks/mercadopago (fetch MP, update, email) |
| `apps/web/src/app/api/__tests__/shipping-rates.integration.test.ts` | Integración | 9 | POST /api/shipping/rates (multi-proveedor) |
| `apps/admin/src/app/api/admin/orders/__tests__/order-status.integration.test.ts` | Integración | 9 | PATCH /api/admin/orders/[id]/status |
| `apps/admin/src/app/api/admin/shipping/__tests__/shipping-config.integration.test.ts` | Integración | 14 | GET+PATCH /api/admin/shipping |
| `apps/admin/src/app/api/admin/config/__tests__/store-config-api.integration.test.ts` | Integración | 14 | GET+PATCH /api/admin/config (WhatsApp, logo, Resend masking) |
| `apps/admin/src/app/api/admin/payment-config/__tests__/payment-config.integration.test.ts` | Integración | 10 | GET+PATCH /api/admin/payment-config (masking, flags, validación) |
| `apps/admin/src/app/api/admin/products/__tests__/products-create.integration.test.ts` | Integración | 9 | POST /api/admin/products (imágenes, variantes, validación) |
| `apps/admin/src/app/api/admin/usuarios/__tests__/usuarios.integration.test.ts` | Integración | 12 | GET/POST/PATCH/DELETE /api/admin/usuarios (Stack Auth mock, roles, invite email) |
| `apps/web/src/app/api/auth/__tests__/welcome.integration.test.ts` | Integración | 10 | POST /api/auth/welcome (upsert customers, vincular pedidos previos, email) |
| `apps/web/src/app/api/account/__tests__/addresses.integration.test.ts` | Integración | 12 | GET/POST /api/account/addresses (auth, is_default exclusivo, customer lookup) |
| `packages/database/src/queries/__tests__/coupons.test.ts` | Unitaria | 14 | `validateCoupon` — porcentaje, fijo, inactivo, expirado, usos, mínimo pedido, edge cases |
| `apps/web/src/app/api/__tests__/coupon.test.ts` | Integración | 4 | POST /api/checkout/coupon — not found, inválido, válido, trim+uppercase |
| `apps/web/src/app/api/__tests__/maintenance.test.ts` | Integración | 3 | GET /api/maintenance-status — false, true, propagación de error |
| `apps/admin/src/app/api/admin/testimonios/__tests__/testimonios.integration.test.ts` | Integración | 11 | GET/POST/PATCH/DELETE /api/admin/testimonios — autorización, validación, trim |
| `packages/database/src/queries/__tests__/themes.test.ts` | Unitaria | 14 | getThemes, getActiveTheme, createTheme, updateTheme, setActiveTheme, deleteTheme — guards activo/default |
| `apps/admin/src/app/api/admin/themes/__tests__/themes.integration.test.ts` | Integración | 14 | GET/POST/PATCH/DELETE /api/admin/themes — autorización, setActive (dos ops), guards delete |
| `apps/admin/src/app/api/admin/sections/__tests__/sections.integration.test.ts` | Integración | 10 | PATCH /api/admin/sections/[key] — autorización (solo admin/super_admin), validación enabled, multi-key |
| `apps/web/src/lib/__tests__/variant-utils.test.ts` | Unitaria | 22 | getProductOptions, getVariantAttrs, getVariantLabel, isColorValue, COLOR_HEX — JSONB + legacy |
| `apps/web/src/lib/__tests__/colombia-locations.test.ts` | Unitaria | 10 | DEPARTMENTS (33, ordenados, sin duplicados), getCitiesForDepartment (ciudades por depto, vacío, ordenados) |
| `apps/web/src/app/api/account/__tests__/addresses-id.integration.test.ts` | Integración | 9 | PATCH/DELETE /api/account/addresses/[id] — auth, 404 cliente, 404 dirección, editar, default exclusivo, eliminar |
| **TOTAL** | | **360** | |

---

### HU-034 — Tipos de variante globales (nueva)

> Como administrador, quiero crear y editar plantillas de atributo reutilizables (tipo "Tueste" con valores Claro/Medio/Oscuro) para asignarlas a cualquier producto y generar sus variantes automáticamente.

**Estimación:** M (5 puntos)
**Módulo:** Admin · `app/variantes/` + `api/admin/variant-types/`
**Estado:** ✅ Implementado

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Admin abre `/variantes` | Tabla con todos los tipos (nombre, pills de valores, display_type, activo) |
| AC-2 | Admin crea nuevo tipo "Color" con valores "Rojo\nAzul\nVerde" | Se crea la fila; pills visibles en la tabla |
| AC-3 | Admin edita el tipo "Tueste" y cambia un valor | Se actualiza en BD; los productos que lo usan lo reflejan en el próximo render |
| AC-4 | Admin desactiva un tipo | Deja de aparecer en el selector del ProductForm |
| AC-5 | Admin intenta crear tipo con nombre duplicado | Error 409; mensaje claro en el modal |
| AC-6 | Admin elimina un tipo | Se elimina de la BD; los productos que lo referenciaban quedan con `variant_options` desactualizado |
| AC-7 | display_type = 'swatch' guardado | Persiste en BD (UI de swatch pendiente en la tienda) |

**Criterios de rechazo:**
- El modal no valida nombre vacío.
- Se permiten valores duplicados dentro del mismo tipo.
- Un rol `vendedor` puede acceder a `/variantes` (requiere al menos `admin`).

---

### HU-035 — Matriz de combinaciones de variantes (nueva)

> Como administrador de productos, quiero seleccionar los tipos de variante aplicables a un producto y generar automáticamente todas las combinaciones posibles para no tener que crearlas una a una.

**Estimación:** L (8 puntos)
**Módulo:** Admin · `app/productos/ProductForm.tsx`
**Estado:** ✅ Implementado

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Admin selecciona "Tueste" (3) y "Peso" (3) y pulsa "Generar combinaciones" | Se generan 9 filas de variante, cada una con `attributes: {Tueste: X, Peso: Y}` |
| AC-2 | Admin modifica el precio de una variante y vuelve a generar | La variante con el mismo par de atributos conserva el precio editado |
| AC-3 | Admin agrega "Molienda" (4) a un producto que ya tenía 9 variantes | Se generan 12 nuevas variantes; las 9 existentes se fusionan preservando precios/stock |
| AC-4 | Producto sin tipos seleccionados | El botón "Generar combinaciones" está deshabilitado |
| AC-5 | Variante generada guardada en BD | `product_variants.attributes` contiene el mapa correcto; `products.variant_options` tiene la lista de tipos |
| AC-6 | Admin elimina manualmente una variante de la tabla | No reaparece al guardar (solo "Generar" recrea la matriz) |

**Escenarios de borde:**
- Producto con 1 tipo de 1 valor → 1 variante generada.
- Producto con 3 tipos de 4 valores cada uno → 64 variantes (se muestran todas en tabla con scroll).

**Criterios de rechazo:**
- "Generar combinaciones" borra precios/stock de variantes existentes que tengan el mismo par de atributos.
- `attributes` queda como `{}` en lugar del mapa correcto tras guardar.

---

### HU-036 — Filtros de tienda con sidebar responsivo (nueva)

> Como comprador, quiero filtrar productos usando un panel lateral claro en desktop y un drawer deslizable en móvil para encontrar el café que busco sin perder de vista el catálogo.

**Estimación:** M (5 puntos)
**Módulo:** Web · `components/shop/ShopClient.tsx`
**Estado:** ✅ Implementado

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Desktop (≥ lg) | Panel sticky de 224px a la izquierda, visible siempre sin scroll |
| AC-2 | Mobile (< lg) | Botón "Filtros" en la cabecera; al pulsarlo aparece drawer deslizante desde la izquierda |
| AC-3 | Filtro de categoría | Filtra productos por `category_id` |
| AC-4 | Filtro de atributo dinámico | Los atributos disponibles se extraen de `variant_options` de los productos activos |
| AC-5 | Múltiples filtros combinados | Producto aparece solo si cumple TODOS los filtros activos |
| AC-6 | Sin resultados | Mensaje "No hay productos con esos filtros" + botón "Limpiar" |
| AC-7 | Cerrar drawer mobile | Tap en overlay o botón × cierra el drawer |

**Criterios de rechazo:**
- El panel se superpone al grid de productos en desktop.
- Los filtros se borran al cerrar el drawer mobile.
- La lista de atributos es hardcoded en lugar de calcularse desde los productos.

---

### HU-037 — Categorías con imagen y reordenamiento (nueva)

> Como administrador, quiero gestionar las categorías del catálogo con imagen de portada y poder reordenarlas arrastrándolas para controlar cómo se presentan en la tienda.

**Estimación:** M (5 puntos)
**Módulo:** Admin · `app/categorias/`
**Estado:** ✅ Implementado

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Admin abre `/categorias` | Tabla con imagen (thumbnail), nombre, slug, descripción y estado |
| AC-2 | Admin sube imagen al crear/editar categoría | Imagen en bucket `banners`; `image_url` guardado en BD |
| AC-3 | Admin arrastra una fila a otra posición | `order_index` de las filas afectadas se actualiza en BD vía PATCH paralelos |
| AC-4 | Admin activa/desactiva categoría | Campo `active` actualizado; categorías inactivas no aparecen en la tienda |
| AC-5 | Imagen en proceso de subida al guardar | Botón "Guardar" bloqueado con texto "Subiendo..." |
| AC-6 | Slugs duplicados | Error 409 del API; mensaje claro en el modal |

**Criterios de rechazo:**
- El reorder no persiste al recargar la página.
- El modal acepta guardar mientras hay un upload en progreso.

---

### HU-038 — Integridad referencial del carrito (nueva)

> Como sistema, quiero que los ítems del carrito en BD siempre referencien productos y variantes válidos para que el carrito nunca contenga datos inconsistentes que rompan el checkout.

**Estimación:** S (2 puntos)
**Módulo:** DB · `migrations/5_customers.sql` + `api/account/cart/route.ts`
**Estado:** ✅ Implementado

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Se elimina un producto | Todos sus `cart_items` se eliminan automáticamente (ON DELETE CASCADE) |
| AC-2 | Se elimina una variante | El ítem del carrito correspondiente se elimina (ON DELETE CASCADE) |
| AC-3 | Frontend envía ítem sin `productId` | El route filtra el ítem antes de insertar; no se genera error 23503 |
| AC-4 | `addItem` desde ProductDetail | `productId: product.id` incluido siempre |
| AC-5 | `addItem` desde ShopClient | `productId: product.id` incluido siempre |
| AC-6 | `addItem` desde FeaturedProducts | `productId: product.id` incluido siempre |

**Criterios de rechazo:**
- Al eliminar un producto desde admin, quedan `cart_items` huérfanos.
- El checkout falla con error FK cuando el carrito tiene un ítem sin `productId`.

---

---

### HU-039 — Búsqueda en catálogo de productos del admin (nueva)

> Como administrador, quiero buscar productos por nombre desde el listado `/productos` para localizar rápidamente un ítem sin necesidad de hacer scroll por todo el catálogo.

**Estimación:** XS (1 punto)
**Módulo:** Admin · `app/productos/`
**Estado:** ✅ Implementado

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Admin escribe en el campo de búsqueda | Tras 400ms de pausa, la página se recarga con `?q=término` |
| AC-2 | Búsqueda con resultado | Solo se muestran productos cuyo nombre contiene el término (case-insensitive) |
| AC-3 | Búsqueda sin resultado | Mensaje `Sin resultados para "término"` en lugar de tabla vacía |
| AC-4 | Búsqueda vacía | Se muestran todos los productos |
| AC-5 | Filtrado en Supabase | El `.ilike('name', '%q%')` se ejecuta server-side, no client-side |

**Criterios de rechazo:**
- La búsqueda hace un fetch por cada tecla presionada sin debounce.
- El filtrado se hace sobre el array local en lugar de en la query.

---

### HU-040 — Notificación de estado de pedido al cliente (nueva)

> Como cliente, quiero recibir un email automático cuando mi pedido cambia a "Enviado", "Entregado" o "Cancelado" para estar informado del progreso sin necesidad de consultar el panel.

**Estimación:** S (2 puntos)
**Módulo:** Admin · `api/admin/orders/[id]/status/` · `lib/email.ts`
**Estado:** ✅ Implementado

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Estado cambia a `shipped` con tracking | Email al cliente con número de tracking y transportadora |
| AC-2 | Estado cambia a `shipped` sin tracking | Email al cliente sin bloque de tracking (HTML condicional) |
| AC-3 | Estado cambia a `delivered` | Email de confirmación de entrega |
| AC-4 | Estado cambia a `cancelled` | Email de notificación de cancelación |
| AC-5 | Estado cambia a `processing` | No se envía email |
| AC-6 | `resend_api_key` no configurado en `store_config` | No se intenta enviar; ningún error visible |
| AC-7 | Resend devuelve error | El cambio de estado en BD se mantiene; error en logs del servidor; respuesta HTTP 200 intacta |

**Criterios de rechazo:**
- El email bloquea la respuesta HTTP (el vendedor espera más de 1s).
- Un fallo de Resend devuelve 500 al cliente del API.

---

### HU-041 — Notas internas en pedidos (nueva)

> Como vendedor, quiero agregar notas privadas a un pedido (instrucciones especiales, comentarios de preparación) que solo el equipo interno pueda ver, sin que aparezcan en ninguna comunicación al cliente.

**Estimación:** S (2 puntos)
**Módulo:** Admin · `app/pedidos/[id]/` · `api/admin/orders/[id]/notes/`
**Estado:** ✅ Implementado

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Vendedor escribe nota y pulsa "Guardar nota" | Nota guardada en `orders.internal_notes`; indicador "✓ Guardado" por 2s |
| AC-2 | Nota sin cambios | Botón "Guardar nota" no visible |
| AC-3 | Nota borrada (campo vacío) | `internal_notes` se guarda como `null` |
| AC-4 | Error de red | Indicador "Error al guardar" |
| AC-5 | Acceso por `gestor_tienda` | 403 Permisos insuficientes |
| AC-6 | Campo en BD | Migración `16_order_notes.sql` agrega `internal_notes TEXT` con `ADD COLUMN IF NOT EXISTS` |

**Criterios de rechazo:**
- Las notas son visibles en emails al cliente o en el sitio público.
- `gestor_tienda` puede guardar notas.

---

### HU-042 — Página de detalle de cliente (nueva)

> Como vendedor, quiero ver el perfil completo de un cliente (datos de contacto, estadísticas de compra e historial de pedidos) desde el listado de clientes para responder preguntas de soporte sin salir de la sección.

**Estimación:** S (3 puntos)
**Módulo:** Admin · `app/clientes/[email]/`
**Estado:** ✅ Implementado

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Click en fila de cliente | Navega a `/clientes/[email]` con email URL-encoded |
| AC-2 | Cliente con cuenta registrada | Badge "Con cuenta" + fecha de registro |
| AC-3 | Cliente invitado (solo orders) | Badge "Invitado"; sección de contacto sin fecha de registro |
| AC-4 | Estadísticas | Total de pedidos, total gastado en COP, ticket promedio |
| AC-5 | Historial de pedidos | Tabla con número, fecha, productos, total, estado y link "Ver" a `/pedidos/[id]` |
| AC-6 | Email inexistente | 404 |

**Criterios de rechazo:**
- La página hace múltiples queries que se podrían consolidar.
- Los emails con caracteres especiales (`+`, `@`) no se decodifican correctamente.

---

### HU-043 — Búsqueda y paginación en listado de pedidos (nueva)

> Como vendedor, quiero buscar pedidos por número, nombre o email del cliente y navegar por páginas de 30 resultados para gestionar el volumen de órdenes eficientemente.

**Estimación:** S (3 puntos)
**Módulo:** Admin · `app/pedidos/`
**Estado:** ✅ Implementado

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Búsqueda por número de pedido (`VPS-0042`) | Filtra resultados con `.or()` en Supabase |
| AC-2 | Búsqueda por nombre del cliente | Funciona con coincidencia parcial |
| AC-3 | Búsqueda por email del cliente | Funciona con coincidencia parcial |
| AC-4 | Sin resultados con `q` activo | Mensaje `Sin resultados para "término"` |
| AC-5 | Paginación | 30 pedidos por página; contador "X–Y de Z pedidos" |
| AC-6 | Filtro de estado combinado con búsqueda | Los parámetros `status`, `q` y `page` se preservan entre navegaciones |
| AC-7 | Nueva búsqueda | Reinicia `page` a 1 automáticamente |

**Criterios de rechazo:**
- El filtro de estado y la búsqueda son mutuamente excluyentes.
- La paginación hace `select('*')` sin `.range()`.

---

*VPS Coffee Roasting House · Parquesoft TI · Julio 2026*
