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
 * Returns the attribute map for a variant.
 * Uses JSONB attributes when set, falls back to legacy fields.
 */
export function getVariantAttrs(variant: ProductVariant, options: string[]): Record<string, string> {
  if (
    variant.attributes &&
    typeof variant.attributes === 'object' &&
    !Array.isArray(variant.attributes) &&
    Object.keys(variant.attributes as object).length > 0
  ) {
    return variant.attributes as Record<string, string>
  }
  // Legacy coffee fields
  const legacy: Record<string, string> = {}
  if (variant.roast) legacy['Tueste'] = variant.roast
  if (variant.weight) legacy['Peso'] = variant.weight
  if (variant.grind) legacy['Molienda'] = variant.grind
  return legacy
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
