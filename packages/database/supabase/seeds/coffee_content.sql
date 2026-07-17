-- =============================================================================
-- seeds/coffee_content.sql
-- Contenido inicial para VPS Coffee Marketplace.
--
-- Ejecutar DESPUÉS de todas las migraciones.
-- No contiene lógica de esquema — solo datos.
-- =============================================================================

-- ── 1. Páginas ────────────────────────────────────────────────────────────────

INSERT INTO pages (key, label, slug, page_type, enabled, show_in_footer, order_index)
VALUES
  ('nosotros',  'Nosotros',  'nosotros',  'about',    true, true,  1),
  ('asesorias', 'Asesorías', 'asesorias', 'services', true, true,  2),
  ('maquila',   'Maquila',   'maquila',   'services', true, true,  3)
ON CONFLICT (key) DO UPDATE SET
  label          = EXCLUDED.label,
  slug           = EXCLUDED.slug,
  page_type      = EXCLUDED.page_type,
  enabled        = EXCLUDED.enabled,
  show_in_footer = EXCLUDED.show_in_footer,
  order_index    = EXCLUDED.order_index;

-- ── 2. Nav items ──────────────────────────────────────────────────────────────

-- Vincular ítems de nav existentes a las páginas (si ya existen por la migración)
UPDATE nav_items SET page_key = 'nosotros'  WHERE href = '/nosotros';
UPDATE nav_items SET page_key = 'asesorias' WHERE href = '/asesorias';
UPDATE nav_items SET page_key = 'maquila'   WHERE href = '/maquila';

-- Insertar nav items si no existen
INSERT INTO nav_items (label, href, page_key, enabled, order_index)
SELECT 'Nosotros',  '/nosotros',  'nosotros',  true, 3
WHERE NOT EXISTS (SELECT 1 FROM nav_items WHERE href = '/nosotros');

INSERT INTO nav_items (label, href, page_key, enabled, order_index)
SELECT 'Asesorías', '/asesorias', 'asesorias', true, 4
WHERE NOT EXISTS (SELECT 1 FROM nav_items WHERE href = '/asesorias');

INSERT INTO nav_items (label, href, page_key, enabled, order_index)
SELECT 'Maquila',   '/maquila',   'maquila',   true, 5
WHERE NOT EXISTS (SELECT 1 FROM nav_items WHERE href = '/maquila');

-- ── 3. Secciones de "Nosotros" ────────────────────────────────────────────────

INSERT INTO page_sections (page_key, section_type, title, subtitle, body, image_url, cta_label, cta_url, enabled, order_index, settings)
VALUES
  (
    'nosotros', 'hero',
    'Somos VPS Coffee',
    'Pasión por el café colombiano desde 2015',
    NULL,
    '/images/nosotros-hero.jpg',
    'Conoce nuestra historia',
    '#historia',
    true, 0, '{}'
  ),
  (
    'nosotros', 'text',
    'Nuestra Historia',
    NULL,
    E'VPS Coffee nació en el corazón del Eje Cafetero colombiano con una misión clara: llevar el mejor café de origen directo a manos de quienes realmente lo aprecian.\n\nTrabajamos directamente con familias caficultoras, garantizando trazabilidad total y precios justos. Cada taza cuenta la historia de quien la cultivó.',
    NULL, NULL, NULL,
    true, 1, '{}'
  ),
  (
    'nosotros', 'cards',
    'Nuestros Valores',
    'Lo que nos define',
    NULL, NULL, NULL, NULL,
    true, 2, '{}'
  ),
  (
    'nosotros', 'testimonials',
    'Lo que dicen nuestros clientes',
    NULL, NULL, NULL, NULL, NULL,
    true, 3, '{"filter_by_page": false}'
  ),
  (
    'nosotros', 'cta',
    '¿Listo para descubrir el café que mereces?',
    NULL, NULL, NULL,
    'Ver nuestra tienda',
    '/tienda',
    true, 4, '{}'
  )
ON CONFLICT DO NOTHING;

-- Items de "Nuestros Valores" (cards)
WITH sec AS (
  SELECT id FROM page_sections
  WHERE page_key = 'nosotros' AND section_type = 'cards' AND title = 'Nuestros Valores'
  LIMIT 1
)
INSERT INTO section_items (section_id, item_type, icon, title, description, enabled, order_index)
SELECT sec.id, 'card', '🌿', 'Sostenibilidad',    'Cultivamos y tostamos con respeto por el medio ambiente.', true, 0 FROM sec
UNION ALL
SELECT sec.id, 'card', '🤝', 'Comercio Justo',    'Pagamos precios justos a los agricultores.',               true, 1 FROM sec
UNION ALL
SELECT sec.id, 'card', '☕', 'Calidad Premium',   'Solo seleccionamos granos de la más alta calidad.',        true, 2 FROM sec
UNION ALL
SELECT sec.id, 'card', '📍', 'Origen Directo',    'Trazabilidad completa desde la finca hasta tu taza.',      true, 3 FROM sec
ON CONFLICT DO NOTHING;

-- ── 4. Secciones de "Asesorías" ───────────────────────────────────────────────

INSERT INTO page_sections (page_key, section_type, title, subtitle, body, image_url, cta_label, cta_url, enabled, order_index, settings)
VALUES
  (
    'asesorias', 'hero',
    'Asesorías en Café',
    'Formamos a baristas, catadores y emprendedores cafeteros',
    NULL,
    '/images/asesorias-hero.jpg',
    'Solicitar asesoría',
    '#contacto',
    true, 0, '{}'
  ),
  (
    'asesorias', 'cards',
    'Nuestros Servicios',
    '¿Qué podemos hacer por ti?',
    NULL, NULL, NULL, NULL,
    true, 1, '{}'
  ),
  (
    'asesorias', 'testimonials',
    'Testimonios de nuestros clientes',
    NULL, NULL, NULL, NULL, NULL,
    true, 2, '{"filter_by_page": true}'
  ),
  (
    'asesorias', 'faq',
    'Preguntas Frecuentes',
    NULL, NULL, NULL, NULL, NULL,
    true, 3, '{}'
  ),
  (
    'asesorias', 'whatsapp',
    '¿Tienes preguntas? Escríbenos',
    'Respondemos en menos de 24 horas',
    NULL, NULL,
    'Chatear por WhatsApp',
    NULL,
    true, 4, '{"message_type": "asesoria"}'
  )
ON CONFLICT DO NOTHING;

-- Items de servicios de asesoría (cards)
WITH sec AS (
  SELECT id FROM page_sections
  WHERE page_key = 'asesorias' AND section_type = 'cards' AND title = 'Nuestros Servicios'
  LIMIT 1
)
INSERT INTO section_items (section_id, item_type, icon, title, description, enabled, order_index)
SELECT sec.id, 'card', '🎓', 'Formación en Barismo',       'Cursos para principiantes y avanzados en preparación de café.',         true, 0 FROM sec
UNION ALL
SELECT sec.id, 'card', '👅', 'Cata y Catación',            'Aprende a identificar perfiles de sabor y defectos en el café.',         true, 1 FROM sec
UNION ALL
SELECT sec.id, 'card', '🏪', 'Consultoría para Cafeterías','Asesoría completa para abrir o mejorar tu negocio de café.',             true, 2 FROM sec
UNION ALL
SELECT sec.id, 'card', '📦', 'Selección de Origen',        'Te ayudamos a escoger los mejores granos según tu perfil de cliente.',   true, 3 FROM sec
ON CONFLICT DO NOTHING;

-- FAQ de asesorías
WITH sec AS (
  SELECT id FROM page_sections
  WHERE page_key = 'asesorias' AND section_type = 'faq' AND title = 'Preguntas Frecuentes'
  LIMIT 1
)
INSERT INTO section_items (section_id, item_type, question, answer, enabled, order_index)
SELECT sec.id, 'faq',
  '¿Necesito experiencia previa para tomar una asesoría?',
  'No. Tenemos programas para todos los niveles, desde quien nunca ha preparado café hasta profesionales que quieren perfeccionar su técnica.',
  true, 0 FROM sec
UNION ALL
SELECT sec.id, 'faq',
  '¿Las asesorías son presenciales o virtuales?',
  'Ofrecemos ambas modalidades. Las prácticas de barismo y cata se recomiendan presenciales; las consultorías de negocio pueden ser virtuales.',
  true, 1 FROM sec
UNION ALL
SELECT sec.id, 'faq',
  '¿Cuánto dura una asesoría?',
  'Depende del programa. Las sesiones individuales duran entre 2 y 4 horas; los cursos completos pueden extenderse varias semanas.',
  true, 2 FROM sec
UNION ALL
SELECT sec.id, 'faq',
  '¿Tienen certificación?',
  'Sí, entregamos certificados de participación avalados por nuestra academia y, en programas avanzados, certificación Q Grader.',
  true, 3 FROM sec
ON CONFLICT DO NOTHING;

-- ── 5. Secciones de "Maquila" ─────────────────────────────────────────────────

INSERT INTO page_sections (page_key, section_type, title, subtitle, body, image_url, cta_label, cta_url, enabled, order_index, settings)
VALUES
  (
    'maquila', 'hero',
    'Maquila de Café',
    'Tostamos y empacamos tu marca privada con estándares de exportación',
    NULL,
    '/images/maquila-hero.jpg',
    'Solicitar cotización',
    '#contacto',
    true, 0, '{}'
  ),
  (
    'maquila', 'text',
    '¿Qué es la Maquila?',
    NULL,
    E'Con nuestro servicio de maquila puedes comercializar café de alta calidad bajo tu propia marca, sin necesidad de invertir en equipos de tostión ni infraestructura.\n\nNosotros nos encargamos de la selección del grano, tostión personalizada, empaque y etiquetado según tus especificaciones.',
    NULL, NULL, NULL,
    true, 1, '{}'
  ),
  (
    'maquila', 'cards',
    'Lo que incluye',
    'Proceso completo de maquila',
    NULL, NULL, NULL, NULL,
    true, 2, '{}'
  ),
  (
    'maquila', 'faq',
    'Preguntas Frecuentes',
    NULL, NULL, NULL, NULL, NULL,
    true, 3, '{}'
  ),
  (
    'maquila', 'whatsapp',
    'Hablemos de tu proyecto',
    'Cuéntanos tu idea y te enviamos una propuesta personalizada',
    NULL, NULL,
    'Contactar por WhatsApp',
    NULL,
    true, 4, '{"message_type": "maquila"}'
  )
ON CONFLICT DO NOTHING;

-- Items del proceso de maquila (cards)
WITH sec AS (
  SELECT id FROM page_sections
  WHERE page_key = 'maquila' AND section_type = 'cards' AND title = 'Lo que incluye'
  LIMIT 1
)
INSERT INTO section_items (section_id, item_type, icon, title, description, enabled, order_index)
SELECT sec.id, 'card', '🌱', 'Selección de Origen',   'Escogemos el grano verde que mejor se adapta a tu perfil deseado.',          true, 0 FROM sec
UNION ALL
SELECT sec.id, 'card', '🔥', 'Tostión Personalizada', 'Perfiles de tueste a medida: suave, medio, oscuro o espresso.',               true, 1 FROM sec
UNION ALL
SELECT sec.id, 'card', '📦', 'Empaque y Etiquetado',  'Bolsas con válvula, etiquetado bajo tu marca y con toda la normatividad.',    true, 2 FROM sec
UNION ALL
SELECT sec.id, 'card', '🚚', 'Logística',             'Coordinamos el despacho a tus bodegas o a los clientes finales.',             true, 3 FROM sec
ON CONFLICT DO NOTHING;

-- FAQ de maquila
WITH sec AS (
  SELECT id FROM page_sections
  WHERE page_key = 'maquila' AND section_type = 'faq' AND title = 'Preguntas Frecuentes'
  LIMIT 1
)
INSERT INTO section_items (section_id, item_type, question, answer, enabled, order_index)
SELECT sec.id, 'faq',
  '¿Cuál es el pedido mínimo para maquila?',
  'El mínimo es de 10 kg por lote. Para marcas privadas con empaque personalizado recomendamos empezar desde 25 kg para amortizar el costo del diseño.',
  true, 0 FROM sec
UNION ALL
SELECT sec.id, 'faq',
  '¿Puedo elegir el origen del grano?',
  'Sí. Trabajamos con granos de diferentes regiones cafeteras de Colombia: Huila, Nariño, Antioquia, Sierra Nevada y más.',
  true, 1 FROM sec
UNION ALL
SELECT sec.id, 'faq',
  '¿Cuánto tiempo tarda la producción?',
  'Entre 5 y 10 días hábiles desde la confirmación del pedido, dependiendo del volumen y disponibilidad de materia prima.',
  true, 2 FROM sec
UNION ALL
SELECT sec.id, 'faq',
  '¿Ofrecen certificaciones orgánicas o de comercio justo?',
  'Trabajamos con fincas certificadas Rainforest Alliance y algunas con certificación orgánica. Consúltanos según el volumen.',
  true, 3 FROM sec
ON CONFLICT DO NOTHING;

-- =============================================================================
-- FIN DEL SEED — VPS Coffee Content
-- =============================================================================
