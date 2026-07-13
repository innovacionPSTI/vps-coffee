-- ============================================================
-- Migración 14: Extensiones de product_variants y products
--
-- 14a · Dimensiones físicas de envío en product_variants
--   Agrega campos opcionales de peso y dimensiones para que la API
--   de Skydropx (y cualquier proveedor) pueda cotizar con datos reales
--   en lugar de estimaciones. Todos son NULLABLE — los productos
--   existentes no se ven afectados. Si un campo está vacío,
--   calculateParcel() hace fallback a rangos de peso por defecto.
--
-- 14b · Sistema de variantes genérico
--   Agrega variant_options en products (array ordenado de nombres de
--   atributo) y attributes en product_variants (mapa clave-valor).
--   Retrocompatible con los campos heredados roast/weight/grind.
-- ============================================================

-- 14a — Dimensiones físicas
ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS weight_kg   NUMERIC(8,3),  -- Peso real en kg (ej: 0.350 para 350 g)
  ADD COLUMN IF NOT EXISTS length_cm   NUMERIC(8,2),  -- Largo del paquete empacado en cm
  ADD COLUMN IF NOT EXISTS width_cm    NUMERIC(8,2),  -- Ancho del paquete empacado en cm
  ADD COLUMN IF NOT EXISTS height_cm   NUMERIC(8,2);  -- Alto del paquete empacado en cm

COMMENT ON COLUMN product_variants.weight_kg IS
  'Peso real del producto empacado en kilogramos. Se usa para cotizar envíos con Skydropx.';
COMMENT ON COLUMN product_variants.length_cm IS
  'Largo del paquete empacado (cm). Si es NULL se usan rangos de peso por defecto.';
COMMENT ON COLUMN product_variants.width_cm IS
  'Ancho del paquete empacado (cm).';
COMMENT ON COLUMN product_variants.height_cm IS
  'Alto del paquete empacado (cm).';

-- 14b — Sistema de variantes genérico
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS variant_options JSONB DEFAULT '[]';
  -- Array ordenado de nombres de atributo, ej: ["Color", "Talla"] o ["Tueste", "Peso"]

ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{}';
  -- Mapa clave-valor que corresponde a variant_options, ej: {"Color": "Rojo", "Talla": "M"}

COMMENT ON COLUMN products.variant_options IS
  'Lista ordenada de nombres de atributo para las variantes del producto. '
  'Ej: ["Color", "Talla"]. Array vacío = usar campos heredados roast/weight/grind.';
COMMENT ON COLUMN product_variants.attributes IS
  'Mapa clave-valor que corresponde a products.variant_options. '
  'Ej: {"Color": "Rojo", "Talla": "M"}. Cae en campos heredados cuando está vacío.';
