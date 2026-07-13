/**
 * Tests for variant-utils.ts
 * Covers: getProductOptions, getVariantAttrs, getVariantLabel, isColorValue, COLOR_HEX
 */

import {
  getProductOptions,
  getVariantAttrs,
  getVariantLabel,
  isColorValue,
  COLOR_HEX,
} from '../variant-utils'
import type { ProductVariant, ProductWithVariants } from '@vps/database'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeVariant(overrides: Partial<ProductVariant> = {}): ProductVariant {
  return {
    id: 1,
    product_id: 1,
    sku: 'SKU-1',
    price: 30000,
    stock: 10,
    active: true,
    roast: null,
    weight: null,
    grind: null,
    brew_method: null,
    image_url: null,
    attributes: null,
    weight_kg: null,
    length_cm: null,
    width_cm: null,
    height_cm: null,
    created_at: new Date().toISOString(),
    ...overrides,
  } as ProductVariant
}

function makeProduct(
  variants: ProductVariant[],
  variant_options?: string[]
): ProductWithVariants {
  return {
    id: 1,
    slug: 'test-product',
    name: 'Test Product',
    description: null,
    category: null,
    active: true,
    featured: false,
    images: [],
    variant_options: variant_options ?? null,
    created_at: new Date().toISOString(),
    variants,
  } as unknown as ProductWithVariants
}

// ─── getProductOptions ─────────────────────────────────────────────────────────

describe('getProductOptions', () => {
  it('returns variant_options JSONB when set', () => {
    const product = makeProduct([], ['Color', 'Talla'])
    expect(getProductOptions(product)).toEqual(['Color', 'Talla'])
  })

  it('falls back to legacy coffee fields when variant_options is empty array', () => {
    const variants = [
      makeVariant({ roast: 'Medio', weight: '250g', grind: 'Molido' }),
    ]
    const product = makeProduct(variants, [])
    expect(getProductOptions(product)).toEqual(['Tueste', 'Peso', 'Molienda'])
  })

  it('falls back when variant_options is null', () => {
    const variants = [makeVariant({ weight: '500g' })]
    const product = makeProduct(variants, undefined)
    expect(getProductOptions(product)).toEqual(['Peso'])
  })

  it('only includes options that are actually used by at least one variant', () => {
    const variants = [makeVariant({ roast: 'Oscuro' })] // no weight or grind
    const product = makeProduct(variants, undefined)
    expect(getProductOptions(product)).toEqual(['Tueste'])
  })

  it('returns empty array when no JSONB and no legacy fields', () => {
    const product = makeProduct([makeVariant()])
    expect(getProductOptions(product)).toEqual([])
  })
})

// ─── getVariantAttrs ──────────────────────────────────────────────────────────

describe('getVariantAttrs', () => {
  it('returns JSONB attributes when set', () => {
    const variant = makeVariant({ attributes: { Color: 'Rojo', Talla: 'M' } as never })
    expect(getVariantAttrs(variant, ['Color', 'Talla'])).toEqual({ Color: 'Rojo', Talla: 'M' })
  })

  it('falls back to legacy fields when attributes is null', () => {
    const variant = makeVariant({ roast: 'Claro', weight: '250g', grind: 'Entero' })
    expect(getVariantAttrs(variant, ['Tueste', 'Peso', 'Molienda'])).toEqual({
      Tueste: 'Claro',
      Peso: '250g',
      Molienda: 'Entero',
    })
  })

  it('falls back to legacy fields when attributes is empty object', () => {
    const variant = makeVariant({ attributes: {} as never, roast: 'Medio' })
    expect(getVariantAttrs(variant, ['Tueste'])).toEqual({ Tueste: 'Medio' })
  })

  it('ignores null legacy fields', () => {
    const variant = makeVariant({ roast: 'Oscuro' }) // weight and grind are null
    const attrs = getVariantAttrs(variant, ['Tueste', 'Peso'])
    expect(attrs).toEqual({ Tueste: 'Oscuro' })
    expect(attrs['Peso']).toBeUndefined()
  })
})

// ─── getVariantLabel ──────────────────────────────────────────────────────────

describe('getVariantLabel', () => {
  it('uses JSONB attributes in option order', () => {
    const variant = makeVariant({ attributes: { Color: 'Azul', Talla: 'L' } as never })
    expect(getVariantLabel(variant, ['Color', 'Talla'])).toBe('Azul · L')
  })

  it('falls back to legacy join for coffee variants', () => {
    const variant = makeVariant({ weight: '250g', grind: 'Molido', roast: 'Medio' })
    expect(getVariantLabel(variant, ['Peso', 'Molienda', 'Tueste'])).toBe('250g · Molido · Medio')
  })

  it('skips missing options from label', () => {
    const variant = makeVariant({ attributes: { Color: 'Verde' } as never })
    expect(getVariantLabel(variant, ['Color', 'Talla'])).toBe('Verde')
  })

  it('uses final legacy fallback when no options match', () => {
    const variant = makeVariant({ weight: '500g', roast: 'Oscuro' })
    expect(getVariantLabel(variant, [])).toBe('500g · Oscuro')
  })
})

// ─── isColorValue ─────────────────────────────────────────────────────────────

describe('isColorValue', () => {
  it('detects 6-digit hex', () => expect(isColorValue('#ff0000')).toBe(true))
  it('detects 3-digit hex', () => expect(isColorValue('#f00')).toBe(true))
  it('detects 8-digit hex with alpha', () => expect(isColorValue('#ff000088')).toBe(true))

  it.each(['rojo', 'azul', 'verde', 'negro', 'blanco', 'amarillo', 'naranja',
    'morado', 'violeta', 'gris', 'rosa', 'café', 'beige', 'crema',
    'dorado', 'plateado', 'turquesa', 'coral', 'menta', 'lavanda'])(
    'recognises Spanish color name "%s"', (name) => {
      expect(isColorValue(name)).toBe(true)
    }
  )

  it('is case-insensitive for color names', () => {
    expect(isColorValue('Rojo')).toBe(true)
    expect(isColorValue('AZUL')).toBe(true)
  })

  it('returns false for non-color strings', () => {
    expect(isColorValue('M')).toBe(false)
    expect(isColorValue('250g')).toBe(false)
    expect(isColorValue('Medio')).toBe(false)
    expect(isColorValue('')).toBe(false)
    expect(isColorValue('rgb(255,0,0)')).toBe(false) // only hex or Spanish names
  })
})

// ─── COLOR_HEX ────────────────────────────────────────────────────────────────

describe('COLOR_HEX', () => {
  it('has a hex value for every Spanish color name isColorValue recognises', () => {
    const names = ['rojo','azul','verde','negro','blanco','amarillo','naranja',
      'morado','violeta','gris','rosa','café','beige','crema',
      'dorado','plateado','turquesa','coral','menta','lavanda']
    names.forEach((name) => {
      expect(COLOR_HEX[name]).toMatch(/^#[0-9a-fA-F]{3,8}$/)
    })
  })
})
