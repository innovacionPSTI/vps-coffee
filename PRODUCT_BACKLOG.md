# VPS Coffee Roasting House — Product Backlog & Documentación de Producto

> **Proyecto:** Plataforma e-commerce VPS Coffee  
> **Cliente:** VPS Coffee Roasting House  
> **Desarrollo:** Parquesoft TI  
> **Versión:** 1.0 · Julio 2026  
> **Stack:** Next.js 15 · Supabase · Tailwind CSS · Turborepo

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
Proteger las rutas del panel admin y el área de cliente mediante middleware de autenticación con Stack Auth, aplicar políticas RLS en todas las tablas de Supabase y manejar secrets únicamente como variables de entorno.

---

## 2. Product Backlog

El backlog está organizado por **épicas** y priorizado en cinco sprints de dos semanas. Las épicas marcadas con ✅ están implementadas; las marcadas con 🔲 están pendientes.

### Épica 1 — Fundación e Infraestructura

| ID | Historia | Prioridad | Estado |
|----|----------|-----------|--------|
| F-01 | Configurar monorepo Turborepo con pnpm workspaces | Alta | ✅ |
| F-02 | Definir design system: colores, tipografía, componentes base | Alta | ✅ |
| F-03 | Crear schema de base de datos con todas las tablas y relaciones | Alta | ✅ |
| F-04 | Implementar RLS (Row Level Security) en Supabase | Alta | ✅ |
| F-05 | Configurar buckets de Storage en Supabase | Alta | ✅ |
| F-06 | Integrar Stack Auth para autenticación | Alta | 🔲 |
| F-07 | Crear middleware de protección de rutas por rol | Alta | 🔲 |
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
| N-04 | Footer con links, redes sociales y WhatsApp | Alta | ✅ |
| N-05 | Página 404 personalizada con estilo VPS | Media | 🔲 |
| N-06 | Página de mantenimiento con logo VPS | Baja | 🔲 |
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

---

### Épica 5 — Carrito de Compras

| ID | Historia | Prioridad | Estado |
|----|----------|-----------|--------|
| C-01 | Store de carrito con Zustand + persistencia en localStorage | Alta | ✅ |
| C-02 | Drawer lateral del carrito accesible desde cualquier página | Alta | ✅ |
| C-03 | Agregar/eliminar/actualizar cantidad desde el drawer | Alta | ✅ |
| C-04 | Página de carrito completa con resumen de pedido | Alta | ✅ |
| C-05 | Cálculo automático de envío gratis (+$100.000) | Media | ✅ |
| C-06 | Campo de cupón de descuento | Media | 🔲 |
| C-07 | Sincronización del carrito con BD para usuarios logueados | Media | 🔲 |
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
| P-07 | Integración real del widget Wompi embebido | Alta | 🔲 |
| P-08 | Integración real de MercadoPago Brick | Alta | 🔲 |
| P-09 | Webhook Wompi — actualización automática de estado de pago | Alta | 🔲 |
| P-10 | Webhook MercadoPago — actualización automática de estado de pago | Alta | 🔲 |
| P-11 | Pre-llenado de datos si el usuario está logueado | Media | 🔲 |
| P-12 | Generación automática de número de orden correlativo (VPS-XXXX) | Alta | ✅ |

---

### Épica 7 — Envíos (Skydropx)

| ID | Historia | Prioridad | Estado |
|----|----------|-----------|--------|
| S-01 | Autenticación OAuth 2.0 con Skydropx y cache de token | Alta | ✅ |
| S-02 | Cotización de tarifas en tiempo real al ingresar dirección | Alta | ✅ |
| S-03 | Cálculo automático de dimensiones del paquete según el carrito | Alta | ✅ |
| S-04 | Mostrar opciones de transportadora y tarifa al cliente | Alta | 🔲 |
| S-05 | Generar guía de envío automáticamente tras pago confirmado | Alta | 🔲 |
| S-06 | Guardar tracking_number y label_url en la orden | Alta | 🔲 |
| S-07 | Webhook Skydropx — actualizar estado de pedido automáticamente | Alta | ✅ |
| S-08 | Email automático al cliente con número de tracking | Media | 🔲 |

---

### Épica 8 — Servicios (Maquila y Asesorías)

| ID | Historia | Prioridad | Estado |
|----|----------|-----------|--------|
| SV-01 | Página Maquila con hero, servicios incluidos y FAQ | Alta | ✅ |
| SV-02 | Botón WhatsApp con mensaje pre-cargado para maquila | Alta | ✅ |
| SV-03 | Página Asesorías con hero, servicios y formulario | Alta | ✅ |
| SV-04 | Botón WhatsApp con mensaje pre-cargado para asesorías | Alta | ✅ |
| SV-05 | Acordeón de preguntas frecuentes en Maquila | Media | ✅ |
| SV-06 | Carrusel de testimonios en Asesorías | Baja | 🔲 |

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
| A-01 | Página de Login con Stack Auth | Alta | 🔲 |
| A-02 | Página de Registro con Stack Auth | Alta | 🔲 |
| A-03 | Middleware de protección /mi-cuenta/* | Alta | 🔲 |
| A-04 | Dashboard de Mi Cuenta (stats de pedidos, datos personales) | Alta | ✅ |
| A-05 | Historial de pedidos del cliente | Alta | ✅ |
| A-06 | Editar datos personales del perfil | Media | 🔲 |
| A-07 | Cerrar sesión | Alta | 🔲 |
| A-08 | Trigger automático: crear perfil al registrarse | Alta | ✅ |

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
| AD-12 | Modal de despacho masivo (pickups Skydropx) | Media | 🔲 |
| AD-13 | Gestión de banners del hero (CRUD con drag & drop) | Alta | ✅ |
| AD-14 | Formulario de edición de slide con imagen web + imagen mobile | Alta | 🔲 |
| AD-15 | Gestión de imágenes de sección servicios | Media | ✅ |
| AD-16 | Listado de artículos del blog con estado publicado/borrador | Alta | ✅ |
| AD-17 | Formulario de creación/edición de artículo con rich text | Alta | 🔲 |
| AD-18 | Vista previa de artículo antes de publicar (Draft Mode) | Media | 🔲 |
| AD-19 | Listado de clientes registrados | Media | 🔲 |
| AD-20 | Gestión de roles y usuarios (solo super_admin) | Alta | 🔲 |
| AD-21 | Configuración de pasarelas de pago | Alta | ✅ |
| AD-22 | Configuración de número WhatsApp desde BD (`store_config`) | Alta | ✅ |
| AD-23 | CRUD de categorías | Media | ✅ |
| AD-24 | Upload y gestión de logo desde panel admin | Alta | ✅ |
| AD-25 | Auto-creación de buckets en Supabase Storage al subir primera imagen | Media | ✅ |

---

### Épica 12 — Emails Transaccionales

| ID | Historia | Prioridad | Estado |
|----|----------|-----------|--------|
| E-01 | Integrar Resend como proveedor de emails | Alta | 🔲 |
| E-02 | Email de confirmación de pedido (al cliente) | Alta | 🔲 |
| E-03 | Email de cambio de estado a "Enviado" con tracking | Alta | 🔲 |
| E-04 | Email de bienvenida al registrarse | Media | 🔲 |
| E-05 | Email de confirmación de suscripción al newsletter | Media | 🔲 |

---

### Épica 13 — SEO y Rendimiento

| ID | Historia | Prioridad | Estado |
|----|----------|-----------|--------|
| SEO-01 | Metadatos globales con template de título | Alta | ✅ |
| SEO-02 | Metadatos dinámicos por producto y artículo | Alta | ✅ |
| SEO-03 | ISR en tienda y blog (revalidación 60s) | Alta | ✅ |
| SEO-04 | Generación estática de rutas de producto y blog | Alta | ✅ |
| SEO-05 | sitemap.xml dinámico | Media | 🔲 |
| SEO-06 | robots.txt | Media | 🔲 |
| SEO-07 | Open Graph y Twitter Card por página | Media | 🔲 |
| SEO-08 | Optimización de imágenes con next/image + Supabase CDN | Alta | 🔲 |
| SEO-09 | Vercel Analytics o Plausible | Baja | 🔲 |

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

**Estado:** ✅ Implementado (integración real de pagos pendiente)

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

**Estado:** ✅ Listado/preview implementado; soporte de imagen web + imagen mobile por slide | 🔲 Formulario de edición de slide pendiente

---

**HU-023 — Gestionar artículos del blog**
> Como editor de VPS Coffee, quiero crear, editar y publicar artículos del blog desde el panel admin para publicar contenido sin depender de un desarrollador.

**Criterios de aceptación:**
- La tabla muestra título, slug, categoría, fecha de publicación y estado (publicado/borrador).
- Existe un botón "Vista previa" que abre el artículo en el sitio público sin publicarlo.
- El formulario tiene campos para título, slug, extracto, contenido (rich text), imagen de portada y categoría.
- Los artículos en borrador no son visibles en el sitio público.

**Estado:** ✅ Listado implementado | 🔲 Formulario pendiente

---

**HU-024 — Controlar accesos por rol**
> Como super administrador, quiero asignar roles a los usuarios del panel (admin, editor) para que cada miembro del equipo solo acceda a las secciones que le corresponden.

**Criterios de aceptación:**
- Los roles disponibles son: super_admin, admin, editor, customer.
- El super_admin puede gestionar roles de otros usuarios desde `/admin/usuarios`.
- Las políticas RLS en Supabase bloquean el acceso a nivel de base de datos según el rol.
- Los editores solo pueden ver pedidos (no modificarlos) y no acceden a pagos ni usuarios.

**Estado:** ✅ RLS implementado | 🔲 UI de gestión de usuarios pendiente

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

## 5. Resumen de Cobertura

| Épica | Total ítems | Implementados | Pendientes | % |
|-------|-------------|---------------|------------|---|
| Fundación e Infraestructura | 10 | 8 | 2 | 80% |
| Navegación | 7 | 6 | 1 | 86% |
| Home | 8 | 8 | 0 | 100% |
| Tienda y Catálogo | 12 | 12 | 0 | 100% |
| Carrito | 8 | 6 | 2 | 75% |
| Checkout y Pagos | 12 | 5 | 7 | 42% |
| Envíos (Skydropx) | 8 | 4 | 4 | 50% |
| Servicios | 6 | 5 | 1 | 83% |
| Blog | 8 | 8 | 0 | 100% |
| Autenticación y Mi Cuenta | 8 | 3 | 5 | 38% |
| Panel de Administración | 25 | 17 | 8 | 68% |
| Emails Transaccionales | 5 | 0 | 5 | 0% |
| SEO y Rendimiento | 9 | 5 | 4 | 56% |
| **TOTAL** | **126** | **87** | **39** | **69%** |

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
| `packages/database/src/queries/__tests__/products.test.ts` | Unitaria | 8 | DB queries — productos |
| `packages/database/src/queries/__tests__/orders.test.ts` | Unitaria | 12 | DB queries — órdenes |
| `packages/database/src/queries/__tests__/blog.test.ts` | Unitaria | 10 | DB queries — blog |
| `packages/database/src/queries/__tests__/store-config.test.ts` | Unitaria | 10 | DB queries — store_config (getStoreConfig, updateStoreConfig) |
| `apps/web/src/app/api/__tests__/checkout.integration.test.ts` | Integración | 10 | POST /api/checkout |
| `apps/web/src/app/api/__tests__/webhook-skydropx.integration.test.ts` | Integración | 9 | POST /api/webhooks/skydropx |
| `apps/web/src/app/api/__tests__/shipping-rates.integration.test.ts` | Integración | 9 | POST /api/shipping/rates (multi-proveedor) |
| `apps/admin/src/app/api/admin/orders/__tests__/order-status.integration.test.ts` | Integración | 9 | PATCH /api/admin/orders/[id]/status |
| `apps/admin/src/app/api/admin/shipping/__tests__/shipping-config.integration.test.ts` | Integración | 14 | GET+PATCH /api/admin/shipping |
| `apps/admin/src/app/api/admin/config/__tests__/store-config-api.integration.test.ts` | Integración | 11 | GET+PATCH /api/admin/config (WhatsApp validation, logo) |
| `apps/admin/src/app/api/admin/products/__tests__/products-create.integration.test.ts` | Integración | 9 | POST /api/admin/products (imágenes, variantes, validación) |
| **TOTAL** | | **163** | |

---

*VPS Coffee Roasting House · Parquesoft TI · Julio 2026*
