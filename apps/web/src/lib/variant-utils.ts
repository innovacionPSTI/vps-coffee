import type { ProductVariant, ProductWithVariants } from '@vps/database'

/**
 * Returns the ordered list of variant option names for a product.
 * If variant_options JSONB is set, uses it.
 * Otherwise derives from legacy coffee-specific fields.
 */
export function getProductOptions(product: ProductWithVariants): string[] {
  const opts = product.variant_options
  if (Array.isArray(opts) && opts.length > 0) return opts as string[]
  // Legacy fallback: derive from which coffee fields are used
  const options: string[] = []
  if (product.variants.some((v) => v.roast)) options.push('Tueste')
  if (product.variants.some((v) => v.weight)) options.push('Peso')
  if (product.variants.some((v) => v.grind)) options.push('Molienda')
  return options
}

/**
 * Returns the attribute map for a variant, filtered to declared option keys only.
 *
 * Filtering is critical: the attributes JSONB may contain extra fields (e.g. notes,
 * internal SKU annotations, etc.) that are NOT variant dimensions. Including those
 * fields in availability checks would make every variant appear incompatible with
 * every other, causing all options to show as blocked in the selector.
 */
export function getVariantAttrs(variant: ProductVariant, options: string[]): Record<string, string> {
  let raw: Record<string, string> = {}

  if (
    variant.attributes &&
    typeof variant.attributes === 'object' &&
    !Array.isArray(variant.attributes) &&
    Object.keys(variant.attributes as object).length > 0
  ) {
    raw = variant.attributes as Record<string, string>
  } else {
    // Legacy coffee fields
    if (variant.roast) raw['Tueste'] = variant.roast
    if (variant.weight) raw['Peso'] = variant.weight
    if (variant.grind) raw['Molienda'] = variant.grind
  }

  // When options are declared, return only those keys — strip any extra JSONB fields
  // (e.g. sku, notes) that would corrupt the compatibility checks in the selector.
  if (options.length === 0) return raw
  return Object.fromEntries(options.flatMap((o) => (raw[o] ? [[o, raw[o]]] : [])))
}

/**
 * Returns a human-readable label for a variant (for cart display).
 */
export function getVariantLabel(variant: ProductVariant, options: string[]): string {
  const attrs = getVariantAttrs(variant, options)
  const parts = options.map((o) => attrs[o]).filter(Boolean)
  if (parts.length > 0) return parts.join(' · ')
  // Final fallback
  return [variant.weight, variant.grind, variant.roast].filter(Boolean).join(' · ')
}

/**
 * Returns true if the value looks like a CSS color (hex, or common Spanish color name).
 * Used to decide whether to render a color swatch.
 */
export function isColorValue(value: string): boolean {
  if (/^#[0-9a-fA-F]{3,8}$/.test(value)) return true
  const colorNames = [
    'rojo','azul','verde','negro','blanco','amarillo','naranja',
    'morado','violeta','gris','rosa','café','beige','crema',
    'dorado','plateado','turquesa','coral','menta','lavanda',
  ]
  return colorNames.includes(value.toLowerCase())
}

/** Maps Spanish color names to approximate hex values for swatches */
export const COLOR_HEX: Record<string, string> = {
  rojo: '#ef4444', azul: '#3b82f6', verde: '#22c55e', negro: '#111111',
  blanco: '#f9fafb', amarillo: '#eab308', naranja: '#f97316', morado: '#a855f7',
  violeta: '#7c3aed', gris: '#6b7280', rosa: '#ec4899', café: '#92400e',
  beige: '#d4b896', crema: '#fef3c7', dorado: '#d97706', plateado: '#9ca3af',
  turquesa: '#0891b2', coral: '#f43f5e', menta: '#34d399', lavanda: '#c4b5fd',
}
