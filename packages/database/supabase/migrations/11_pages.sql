-- ============================================================
-- Migración 11: Páginas y secciones parametrizables
--
-- Permite editar desde el admin el contenido de:
--   /nosotros, /asesorias, /maquila
--
-- Tablas nuevas:
--   pages      : configuración de cada página pública
--   page_items : ítems dentro de una página (cards, FAQ, pasos)
--
-- Alteraciones:
--   testimonials  → añade page_key (asocia testimonios a una página)
--   store_config  → añade flags de visibilidad de columnas en footer
-- ============================================================

-- ─── PAGES ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pages (
  key            TEXT PRIMARY KEY,
  label          TEXT NOT NULL,
  slug           TEXT NOT NULL UNIQUE,
  enabled        BOOLEAN NOT NULL DEFAULT true,
  show_in_footer BOOLEAN NOT NULL DEFAULT true,

  -- Hero
  hero_title     TEXT,
  hero_subtitle  TEXT,
  hero_image_url TEXT,

  -- Contenido principal
  intro_title    TEXT,
  intro_body     TEXT,

  -- CTA
  cta_label      TEXT,
  cta_url        TEXT,

  order_index    INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── PAGE ITEMS ───────────────────────────────────────────────────────────────
-- Ítems configurables dentro de una página: tarjetas de servicio, valores,
-- pasos de proceso, preguntas frecuentes, etc.
CREATE TABLE IF NOT EXISTS page_items (
  id           SERIAL PRIMARY KEY,
  page_key     TEXT NOT NULL REFERENCES pages(key) ON DELETE CASCADE,
  item_type    TEXT NOT NULL DEFAULT 'card',  -- 'card' | 'faq'
  icon         TEXT,          -- emoji o nombre de ícono
  title        TEXT,          -- título del card
  description  TEXT,          -- descripción del card
  question     TEXT,          -- pregunta (FAQ)
  answer       TEXT,          -- respuesta (FAQ)
  enabled      BOOLEAN NOT NULL DEFAULT true,
  order_index  INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS page_items_page_key_idx
  ON page_items (page_key, item_type, order_index);

-- ─── TESTIMONIALS: asociación a página ────────────────────────────────────────
ALTER TABLE testimonials
  ADD COLUMN IF NOT EXISTS page_key TEXT NULL REFERENCES pages(key) ON DELETE SET NULL;

-- ─── STORE CONFIG: visibilidad de columnas del footer ─────────────────────────
ALTER TABLE store_config
  ADD COLUMN IF NOT EXISTS footer_show_store   BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS footer_show_blog    BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS footer_show_legal   BOOLEAN NOT NULL DEFAULT true;

-- ─── SEED: páginas ────────────────────────────────────────────────────────────
INSERT INTO pages (key, label, slug, hero_title, hero_subtitle, intro_title, intro_body, cta_label, cta_url, order_index) VALUES
  ('nosotros', 'Nosotros', 'nosotros',
   'Vivir para Servir',
   'La filosofía que guía nuestra empresa.',
   'Nuestra historia',
   'Nuestra empresa nació del compromiso con la excelencia y el cuidado desde el origen hasta el cliente final. Somos una tostadora artesanal que trabaja directamente con productores colombianos para garantizar la máxima calidad y trazabilidad en cada bolsa.',
   'Ver nuestra tienda', '/tienda', 1),

  ('asesorias', 'Asesorías', 'asesorias',
   'Asesorías Profesionales',
   'Acompañamiento experto en catación, perfiles de tueste y desarrollo de producto para tu negocio.',
   NULL, NULL, NULL, NULL, 2),

  ('maquila', 'Maquila & Tueste', 'maquila',
   'Maquila & Tueste',
   'Tu café verde, nuestro tueste artesanal.',
   NULL, NULL, NULL, NULL, 3)
ON CONFLICT (key) DO NOTHING;

-- ─── SEED: page items — nosotros (valores) ────────────────────────────────────
INSERT INTO page_items (page_key, item_type, icon, title, description, order_index) VALUES
  ('nosotros', 'card', '🫘', 'Trazabilidad',
   'Conocemos el origen de cada grano: la finca, el agricultor y el proceso de beneficio.', 1),
  ('nosotros', 'card', '🎨', 'Artesanía',
   'Cada lote se tuesta a mano con atención al detalle y pasión por el perfil sensorial.', 2),
  ('nosotros', 'card', '🤝', 'Comunidad',
   'Construimos relaciones de largo plazo con productores, baristas y amantes del café.', 3),
  ('nosotros', 'card', '✨', 'Excelencia',
   'Nos exigimos los más altos estándares en cada etapa: selección, tueste y servicio.', 4)
ON CONFLICT DO NOTHING;

-- ─── SEED: page items — asesorias (servicios) ─────────────────────────────────
INSERT INTO page_items (page_key, item_type, icon, title, description, order_index) VALUES
  ('asesorias', 'card', '☕', 'Catación profesional',
   'Sesiones de catación guiadas para entender el perfil sensorial de tu café.', 1),
  ('asesorias', 'card', '🌡️', 'Desarrollo de perfiles',
   'Diseño y ajuste de perfiles de tueste para obtener el mejor potencial de tu café verde.', 2),
  ('asesorias', 'card', '🎓', 'Formación de baristas',
   'Capacitación técnica para baristas en extracción, molienda y servicio de café de especialidad.', 3),
  ('asesorias', 'card', '🏢', 'Consultoría de negocio',
   'Asesoría integral para cafeterías y tostadurías que quieren mejorar su propuesta de valor.', 4)
ON CONFLICT DO NOTHING;

-- ─── SEED: page items — maquila (qué incluye) ─────────────────────────────────
INSERT INTO page_items (page_key, item_type, icon, title, description, order_index) VALUES
  ('maquila', 'card', '🫘', 'Recepción del café verde',
   'Recibimos tu café verde, evaluamos la calidad y lo clasificamos para el tueste óptimo.', 1),
  ('maquila', 'card', '🌡️', 'Perfilado de tueste a medida',
   'Diseñamos un perfil de tueste personalizado según las características de tu café y tu público objetivo.', 2),
  ('maquila', 'card', '📦', 'Empaque y entrega',
   'Empacamos en bolsas con válvula degasificadora y entregamos en nuestra bodega o coordinamos el despacho.', 3)
ON CONFLICT DO NOTHING;

-- ─── SEED: page items — maquila (FAQ) ─────────────────────────────────────────
INSERT INTO page_items (page_key, item_type, question, answer, order_index) VALUES
  ('maquila', 'faq',
   '¿Cuál es la cantidad mínima para maquila?',
   'El mínimo de maquila es de 10 kg de café verde. A partir de este volumen ofrecemos perfilado de tueste personalizado.', 1),
  ('maquila', 'faq',
   '¿Cuánto tiempo tarda el proceso?',
   'Dependiendo del volumen, el tueste y empaque tarda entre 3 y 7 días hábiles. Te avisamos por WhatsApp cuando está listo.', 2),
  ('maquila', 'faq',
   '¿Ofrecen servicio de empaque y etiquetado?',
   'Sí, empacamos en bolsas de papel kraft con válvula degasificadora y realizamos el etiquetado con tu marca si lo requieres.', 3),
  ('maquila', 'faq',
   '¿Cómo me cobran el servicio?',
   'Cotizamos por kilogramo de café verde. El precio varía según el volumen, el tipo de tueste y el nivel de molienda requerido.', 4)
ON CONFLICT DO NOTHING;
