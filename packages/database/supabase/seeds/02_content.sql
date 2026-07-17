-- ============================================================
-- seeds/02_content.sql — Contenido CMS inicial
-- ============================================================
-- Ejecutar DESPUÉS de 01_schema.sql y 01_config.sql.
-- Crea páginas, secciones e ítems para el sitio de VPS Coffee.
-- Idempotente: usa ON CONFLICT DO NOTHING en todo.
-- ============================================================

-- ── Páginas ──────────────────────────────────────────────────────────────────

INSERT INTO pages (key, label, slug, page_type, enabled, show_in_footer, order_index) VALUES
  ('nosotros',   'Nosotros',               'nosotros',   'about',   true, true,  1),
  ('asesorias',  'Asesorías',              'asesorias',  'services',true, true,  2),
  ('maquila',    'Maquila & Tueste',       'maquila',    'services',true, true,  3),
  ('privacidad', 'Política de privacidad', 'privacidad', 'custom',  true, false, 90),
  ('terminos',   'Términos y condiciones', 'terminos',   'custom',  true, false, 91)
ON CONFLICT (key) DO NOTHING;

-- Vincular nav items a páginas
UPDATE nav_items SET page_key = 'nosotros'  WHERE href = '/nosotros';
UPDATE nav_items SET page_key = 'asesorias' WHERE href = '/asesorias';
UPDATE nav_items SET page_key = 'maquila'   WHERE href = '/maquila';

-- ── HOME — secciones del carrusel y servicios ─────────────────────────────────

INSERT INTO page_sections (page_key, section_type, title, enabled, order_index, settings) VALUES
  ('home', 'hero',             'Carrusel principal',   true,  0, '{}'),
  ('home', 'featured_products','Productos Destacados',  true, 10, '{}'),
  ('home', 'services',         'Servicios',             true, 20, '{}'),
  ('home', 'best_sellers',     'Más Vendidos',          true, 30, '{}'),
  ('home', 'historia',         'Historia / Nosotros',   true, 40,
   '{"title":"Vivir para Servir","subtitle":"Cada taza que preparamos lleva el compromiso de la excelencia y el cuidado desde el origen hasta tu mesa.","cta_text":"Conoce nuestra historia →","cta_url":"/nosotros"}'::jsonb),
  ('home', 'blog_preview',     'Del Blog',              true, 50, '{}'),
  ('home', 'newsletter',       'Newsletter',            true, 60, '{}')
ON CONFLICT DO NOTHING;

-- Hero slides
WITH sec AS (SELECT id FROM page_sections WHERE page_key='home' AND section_type='hero' LIMIT 1)
INSERT INTO section_items
  (section_id, item_type, title, description, cta_text, link_url, enabled, order_index, metadata)
SELECT sec.id,'slide','Café de Especialidad Colombiano',
  'Trazabilidad completa desde el origen hasta tu taza','Comprar ahora','/tienda',true,1,
  '{"bg_color":"#614A2A"}'::jsonb FROM sec
UNION ALL
SELECT sec.id,'slide','Maquila & Tueste Artesanal',
  'Tu café verde, nuestro tueste de especialidad a tu medida','Cotizar','/maquila',true,2,
  '{"bg_color":"#604B30"}'::jsonb FROM sec
ON CONFLICT DO NOTHING;

-- Services items
WITH sec AS (SELECT id FROM page_sections WHERE page_key='home' AND section_type='services' LIMIT 1)
INSERT INTO section_items
  (section_id, item_type, title, description, cta_text, link_url, enabled, order_index, metadata)
SELECT sec.id,'service','Maquila & Tueste',
  'Tostamos y empacamos tu marca privada con estándares de exportación.',
  'Solicitar cotización','/maquila',true,1,'{"bg_color":"#614A2A"}'::jsonb FROM sec
UNION ALL
SELECT sec.id,'service','Asesorías en Café',
  'Formación para baristas, catadores y emprendedores cafeteros.',
  'Ver asesorías','/asesorias',true,2,'{"bg_color":"#604B30"}'::jsonb FROM sec
ON CONFLICT DO NOTHING;

-- ── NOSOTROS ─────────────────────────────────────────────────────────────────

INSERT INTO page_sections
  (page_key, section_type, title, subtitle, body, image_url, cta_label, cta_url, enabled, order_index, settings)
VALUES
  ('nosotros','hero','Somos VPS Coffee','Pasión por el café colombiano desde 2015',
   NULL,'/images/nosotros-hero.jpg','Conoce nuestra historia','#historia',true,0,'{}'),
  ('nosotros','text','Nuestra Historia',NULL,
   E'VPS Coffee nació en el corazón del Eje Cafetero colombiano con una misión clara: llevar el mejor café de origen directo a manos de quienes realmente lo aprecian.\n\nTrabajamos directamente con familias caficultoras, garantizando trazabilidad total y precios justos. Cada taza cuenta la historia de quien la cultivó.',
   NULL,NULL,NULL,true,1,'{}'),
  ('nosotros','cards','Nuestros Valores','Lo que nos define',NULL,NULL,NULL,NULL,true,2,'{}'),
  ('nosotros','testimonials','Lo que dicen nuestros clientes',NULL,NULL,NULL,NULL,NULL,true,3,'{"filter_by_page":false}'),
  ('nosotros','cta','¿Listo para descubrir el café que mereces?',NULL,NULL,NULL,'Ver nuestra tienda','/tienda',true,4,'{}')
ON CONFLICT DO NOTHING;

WITH sec AS (SELECT id FROM page_sections WHERE page_key='nosotros' AND section_type='cards' LIMIT 1)
INSERT INTO section_items (section_id,item_type,icon,title,description,enabled,order_index)
SELECT sec.id,'card','🌿','Sostenibilidad','Cultivamos y tostamos con respeto por el medio ambiente.',true,0 FROM sec UNION ALL
SELECT sec.id,'card','🤝','Comercio Justo','Pagamos precios justos a los agricultores.',true,1 FROM sec UNION ALL
SELECT sec.id,'card','☕','Calidad Premium','Solo seleccionamos granos de la más alta calidad.',true,2 FROM sec UNION ALL
SELECT sec.id,'card','📍','Origen Directo','Trazabilidad completa desde la finca hasta tu taza.',true,3 FROM sec
ON CONFLICT DO NOTHING;

-- ── ASESORÍAS ────────────────────────────────────────────────────────────────

INSERT INTO page_sections
  (page_key, section_type, title, subtitle, body, image_url, cta_label, cta_url, enabled, order_index, settings)
VALUES
  ('asesorias','hero','Asesorías en Café','Formamos a baristas, catadores y emprendedores cafeteros',
   NULL,'/images/asesorias-hero.jpg','Solicitar asesoría','#contacto',true,0,'{}'),
  ('asesorias','cards','Nuestros Servicios','¿Qué podemos hacer por ti?',NULL,NULL,NULL,NULL,true,1,'{}'),
  ('asesorias','testimonials','Testimonios de nuestros clientes',NULL,NULL,NULL,NULL,NULL,true,2,'{"filter_by_page":true}'),
  ('asesorias','faq','Preguntas Frecuentes',NULL,NULL,NULL,NULL,NULL,true,3,'{}'),
  ('asesorias','whatsapp','¿Tienes preguntas? Escríbenos','Respondemos en menos de 24 horas',
   NULL,NULL,'Chatear por WhatsApp',NULL,true,4,'{"message_type":"asesoria"}')
ON CONFLICT DO NOTHING;

WITH sec AS (SELECT id FROM page_sections WHERE page_key='asesorias' AND section_type='cards' LIMIT 1)
INSERT INTO section_items (section_id,item_type,icon,title,description,enabled,order_index)
SELECT sec.id,'card','🎓','Formación en Barismo','Cursos para principiantes y avanzados en preparación de café.',true,0 FROM sec UNION ALL
SELECT sec.id,'card','👅','Cata y Catación','Aprende a identificar perfiles de sabor y defectos en el café.',true,1 FROM sec UNION ALL
SELECT sec.id,'card','🏪','Consultoría para Cafeterías','Asesoría completa para abrir o mejorar tu negocio de café.',true,2 FROM sec UNION ALL
SELECT sec.id,'card','📦','Selección de Origen','Te ayudamos a escoger los mejores granos según tu perfil de cliente.',true,3 FROM sec
ON CONFLICT DO NOTHING;

WITH sec AS (SELECT id FROM page_sections WHERE page_key='asesorias' AND section_type='faq' LIMIT 1)
INSERT INTO section_items (section_id,item_type,question,answer,enabled,order_index)
SELECT sec.id,'faq',
  '¿Necesito experiencia previa para tomar una asesoría?',
  'No. Tenemos programas para todos los niveles, desde quien nunca ha preparado café hasta profesionales que quieren perfeccionar su técnica.',
  true,0 FROM sec UNION ALL
SELECT sec.id,'faq',
  '¿Las asesorías son presenciales o virtuales?',
  'Ofrecemos ambas modalidades. Las prácticas de barismo y cata se recomiendan presenciales; las consultorías de negocio pueden ser virtuales.',
  true,1 FROM sec UNION ALL
SELECT sec.id,'faq',
  '¿Cuánto dura una asesoría?',
  'Depende del programa. Las sesiones individuales duran entre 2 y 4 horas; los cursos completos pueden extenderse varias semanas.',
  true,2 FROM sec UNION ALL
SELECT sec.id,'faq',
  '¿Tienen certificación?',
  'Sí, entregamos certificados de participación. En programas avanzados ofrecemos certificación Q Grader.',
  true,3 FROM sec
ON CONFLICT DO NOTHING;

-- Testimonios de asesorías
WITH sec AS (SELECT id FROM page_sections WHERE page_key='asesorias' AND section_type='testimonials' LIMIT 1)
INSERT INTO section_items (section_id,item_type,title,description,enabled,order_index,metadata)
SELECT sec.id,'testimonial','María González',
  'Excelente asesoría para nuestra cafetería. Logramos mejorar nuestros perfiles de extracción y la calidad en taza se nota.',
  true,0,'{"rating":5,"role":"Barista profesional"}'::jsonb FROM sec UNION ALL
SELECT sec.id,'testimonial','Carlos Rodríguez',
  'El curso de catación me abrió los ojos a un mundo de sabores que no sabía que existían. 100% recomendado.',
  true,1,'{"rating":5,"role":"Entusiasta del café"}'::jsonb FROM sec UNION ALL
SELECT sec.id,'testimonial','Ana Martínez',
  'La consultoría para nuestra tostadora fue invaluable. Mejoramos procesos y reducimos costos sin sacrificar calidad.',
  true,2,'{"rating":5,"role":"Propietaria de tostadora"}'::jsonb FROM sec
ON CONFLICT DO NOTHING;

-- ── MAQUILA ──────────────────────────────────────────────────────────────────

INSERT INTO page_sections
  (page_key, section_type, title, subtitle, body, image_url, cta_label, cta_url, enabled, order_index, settings)
VALUES
  ('maquila','hero','Maquila de Café','Tostamos y empacamos tu marca privada con estándares de exportación',
   NULL,'/images/maquila-hero.jpg','Solicitar cotización','#contacto',true,0,'{}'),
  ('maquila','text','¿Qué es la Maquila?',NULL,
   E'Con nuestro servicio de maquila puedes comercializar café de alta calidad bajo tu propia marca, sin necesidad de invertir en equipos de tostión ni infraestructura.\n\nNosotros nos encargamos de la selección del grano, tostión personalizada, empaque y etiquetado según tus especificaciones.',
   NULL,NULL,NULL,true,1,'{}'),
  ('maquila','cards','Lo que incluye','Proceso completo de maquila',NULL,NULL,NULL,NULL,true,2,'{}'),
  ('maquila','faq','Preguntas Frecuentes',NULL,NULL,NULL,NULL,NULL,true,3,'{}'),
  ('maquila','whatsapp','Hablemos de tu proyecto','Cuéntanos tu idea y te enviamos una propuesta personalizada',
   NULL,NULL,'Contactar por WhatsApp',NULL,true,4,'{"message_type":"maquila"}')
ON CONFLICT DO NOTHING;

WITH sec AS (SELECT id FROM page_sections WHERE page_key='maquila' AND section_type='cards' LIMIT 1)
INSERT INTO section_items (section_id,item_type,icon,title,description,enabled,order_index)
SELECT sec.id,'card','🌱','Selección de Origen','Escogemos el grano verde que mejor se adapta a tu perfil deseado.',true,0 FROM sec UNION ALL
SELECT sec.id,'card','🔥','Tostión Personalizada','Perfiles de tueste a medida: suave, medio, oscuro o espresso.',true,1 FROM sec UNION ALL
SELECT sec.id,'card','📦','Empaque y Etiquetado','Bolsas con válvula, etiquetado bajo tu marca y con toda la normatividad.',true,2 FROM sec UNION ALL
SELECT sec.id,'card','🚚','Logística','Coordinamos el despacho a tus bodegas o a los clientes finales.',true,3 FROM sec
ON CONFLICT DO NOTHING;

WITH sec AS (SELECT id FROM page_sections WHERE page_key='maquila' AND section_type='faq' LIMIT 1)
INSERT INTO section_items (section_id,item_type,question,answer,enabled,order_index)
SELECT sec.id,'faq',
  '¿Cuál es el pedido mínimo para maquila?',
  'El mínimo es de 10 kg por lote. Para marcas privadas con empaque personalizado recomendamos empezar desde 25 kg para amortizar el costo del diseño.',
  true,0 FROM sec UNION ALL
SELECT sec.id,'faq',
  '¿Puedo elegir el origen del grano?',
  'Sí. Trabajamos con granos de diferentes regiones cafeteras de Colombia: Huila, Nariño, Antioquia, Sierra Nevada y más.',
  true,1 FROM sec UNION ALL
SELECT sec.id,'faq',
  '¿Cuánto tiempo tarda la producción?',
  'Entre 5 y 10 días hábiles desde la confirmación del pedido, dependiendo del volumen y disponibilidad de materia prima.',
  true,2 FROM sec UNION ALL
SELECT sec.id,'faq',
  '¿Ofrecen certificaciones orgánicas o de comercio justo?',
  'Trabajamos con fincas certificadas Rainforest Alliance y algunas con certificación orgánica. Consúltanos según el volumen.',
  true,3 FROM sec
ON CONFLICT DO NOTHING;

-- ── PÁGINAS LEGALES ───────────────────────────────────────────────────────────

INSERT INTO page_sections (page_key, section_type, title, body, enabled, order_index)
SELECT 'privacidad','text','Política de privacidad',
$$## Política de privacidad

Esta política describe cómo recopilamos, usamos y protegemos tu información personal.

### Información que recopilamos
Recopilamos la información que nos proporcionas al realizar una compra, registrarte o suscribirte a nuestro boletín: nombre, correo electrónico, dirección de envío y datos de pago.

### Uso de la información
- Procesar y enviar tus pedidos.
- Comunicarnos sobre el estado de tu pedido.
- Enviarte ofertas si te suscribiste al boletín.
- Mejorar nuestra tienda y atención al cliente.

### Compartir información
No vendemos ni cedemos tu información personal a terceros, salvo a los proveedores necesarios para procesar pagos y realizar envíos.

### Seguridad
Tomamos medidas razonables para proteger tu información personal contra accesos no autorizados.

### Contacto
Si tienes preguntas, contáctanos a través de los canales indicados en nuestra tienda.$$,
true,1
WHERE NOT EXISTS (SELECT 1 FROM page_sections WHERE page_key='privacidad');

INSERT INTO page_sections (page_key, section_type, title, body, enabled, order_index)
SELECT 'terminos','text','Términos y condiciones',
$$## Términos y condiciones

Al acceder y usar esta tienda, aceptas los siguientes términos y condiciones.

### Productos y precios
Los precios están expresados en pesos colombianos (COP) e incluyen IVA cuando aplica. Nos reservamos el derecho de modificar precios sin previo aviso.

### Pedidos y pagos
Al realizar un pedido, garantizas que la información proporcionada es verídica y que estás autorizado a usar el método de pago seleccionado.

### Envíos
Los tiempos de entrega son estimados y pueden variar según la zona de destino y disponibilidad del transportador.

### Devoluciones
Aceptamos devoluciones dentro de los primeros 15 días calendario desde la recepción del producto, en su estado original.

### Propiedad intelectual
Todo el contenido de esta tienda (imágenes, textos, logotipos) es propiedad de la empresa.

### Contacto
Para consultas sobre estos términos, contáctanos a través de los canales indicados en nuestra tienda.$$,
true,1
WHERE NOT EXISTS (SELECT 1 FROM page_sections WHERE page_key='terminos');
