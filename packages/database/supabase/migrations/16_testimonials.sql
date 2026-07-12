-- Migración 16: Tabla de testimonios para la página de Asesorías
CREATE TABLE IF NOT EXISTS testimonials (
  id          SERIAL PRIMARY KEY,
  author_name VARCHAR(100) NOT NULL,
  author_role VARCHAR(100) NULL,
  content     TEXT NOT NULL,
  avatar_url  TEXT NULL,
  rating      INTEGER NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para ordenar por posición
CREATE INDEX IF NOT EXISTS testimonials_order_idx ON testimonials (order_index, id);
