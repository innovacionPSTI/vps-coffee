/**
 * @jest-environment jsdom
 *
 * Unit tests for the VPS Coffee cart store (Zustand + localStorage persist).
 * Each test gets a fresh store to avoid cross-test contamination.
 */
import { act } from '@testing-library/react'
import { useCartStore } from '../cart'
import type { CartItem } from '../cart'

// ─────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────
const makeItem = (overrides: Partial<CartItem> = {}): CartItem => ({
  variantId: 1,
  productSlug: 'cafe-origen-huila',
  productName: 'Café Origen Huila',
  variantLabel: '500g · Grano · Claro',
  price: 45000,
  qty: 1,
  imageUrl: '/img/huila.jpg',
  weight: '500g',
  ...overrides,
})

// Reset store state between tests
beforeEach(() => {
  act(() => {
    useCartStore.setState({ items: [] })
  })
  localStorage.clear()
})

// ─────────────────────────────────────────────
// addItem
// ─────────────────────────────────────────────
describe('addItem', () => {
  it('agrega un item nuevo al carrito vacío', () => {
    const item = makeItem()
    act(() => { useCartStore.getState().addItem(item) })
    const { items } = useCartStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ variantId: 1, qty: 1, price: 45000 })
  })

  it('incrementa la cantidad si la variante ya existe', () => {
    const item = makeItem({ qty: 2 })
    act(() => { useCartStore.getState().addItem(item) })
    act(() => { useCartStore.getState().addItem(makeItem({ qty: 3 })) })
    const { items } = useCartStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0].qty).toBe(5) // 2 + 3
  })

  it('agrega variantes distintas como items separados', () => {
    act(() => { useCartStore.getState().addItem(makeItem({ variantId: 1 })) })
    act(() => { useCartStore.getState().addItem(makeItem({ variantId: 2, variantLabel: '250g · Molido · Medio' })) })
    expect(useCartStore.getState().items).toHaveLength(2)
  })

  it('preserva todos los campos del item al agregar', () => {
    const item = makeItem({ price: 32000, weight: '250g', imageUrl: '/img/test.jpg' })
    act(() => { useCartStore.getState().addItem(item) })
    expect(useCartStore.getState().items[0]).toMatchObject(item)
  })
})

// ─────────────────────────────────────────────
// removeItem
// ─────────────────────────────────────────────
describe('removeItem', () => {
  it('elimina el item con el variantId indicado', () => {
    act(() => { useCartStore.getState().addItem(makeItem({ variantId: 1 })) })
    act(() => { useCartStore.getState().addItem(makeItem({ variantId: 2 })) })
    act(() => { useCartStore.getState().removeItem(1) })
    const { items } = useCartStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0].variantId).toBe(2)
  })

  it('no falla si el variantId no existe en el carrito', () => {
    act(() => { useCartStore.getState().addItem(makeItem()) })
    expect(() => {
      act(() => { useCartStore.getState().removeItem(999) })
    }).not.toThrow()
    expect(useCartStore.getState().items).toHaveLength(1)
  })

  it('deja el carrito vacío si se elimina el único item', () => {
    act(() => { useCartStore.getState().addItem(makeItem()) })
    act(() => { useCartStore.getState().removeItem(1) })
    expect(useCartStore.getState().items).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────
// updateQty
// ─────────────────────────────────────────────
describe('updateQty', () => {
  it('actualiza la cantidad del item correctamente', () => {
    act(() => { useCartStore.getState().addItem(makeItem({ qty: 1 })) })
    act(() => { useCartStore.getState().updateQty(1, 4) })
    expect(useCartStore.getState().items[0].qty).toBe(4)
  })

  it('elimina el item si la cantidad se actualiza a 0', () => {
    act(() => { useCartStore.getState().addItem(makeItem()) })
    act(() => { useCartStore.getState().updateQty(1, 0) })
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('elimina el item si la cantidad es negativa', () => {
    act(() => { useCartStore.getState().addItem(makeItem()) })
    act(() => { useCartStore.getState().updateQty(1, -5) })
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('no modifica otros items al actualizar uno', () => {
    act(() => { useCartStore.getState().addItem(makeItem({ variantId: 1, qty: 1 })) })
    act(() => { useCartStore.getState().addItem(makeItem({ variantId: 2, qty: 2 })) })
    act(() => { useCartStore.getState().updateQty(1, 10) })
    const { items } = useCartStore.getState()
    expect(items.find((i) => i.variantId === 2)?.qty).toBe(2)
    expect(items.find((i) => i.variantId === 1)?.qty).toBe(10)
  })
})

// ─────────────────────────────────────────────
// clearCart
// ─────────────────────────────────────────────
describe('clearCart', () => {
  it('vacía el carrito completamente', () => {
    act(() => { useCartStore.getState().addItem(makeItem({ variantId: 1 })) })
    act(() => { useCartStore.getState().addItem(makeItem({ variantId: 2 })) })
    act(() => { useCartStore.getState().clearCart() })
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('no falla si el carrito ya está vacío', () => {
    expect(() => {
      act(() => { useCartStore.getState().clearCart() })
    }).not.toThrow()
  })
})

// ─────────────────────────────────────────────
// subtotal / total
// ─────────────────────────────────────────────
describe('subtotal y total', () => {
  it('retorna 0 para carrito vacío', () => {
    expect(useCartStore.getState().subtotal()).toBe(0)
    expect(useCartStore.getState().total()).toBe(0)
  })

  it('calcula subtotal correctamente con un item', () => {
    act(() => { useCartStore.getState().addItem(makeItem({ price: 45000, qty: 2 })) })
    expect(useCartStore.getState().subtotal()).toBe(90000)
  })

  it('suma correctamente múltiples items', () => {
    act(() => { useCartStore.getState().addItem(makeItem({ variantId: 1, price: 45000, qty: 2 })) })
    act(() => { useCartStore.getState().addItem(makeItem({ variantId: 2, price: 32000, qty: 1 })) })
    // 45000 * 2 + 32000 * 1 = 122000
    expect(useCartStore.getState().subtotal()).toBe(122000)
  })

  it('total() es igual a subtotal() (shipping se calcula en checkout)', () => {
    act(() => { useCartStore.getState().addItem(makeItem({ price: 60000, qty: 3 })) })
    const state = useCartStore.getState()
    expect(state.total()).toBe(state.subtotal())
  })

  it('recalcula subtotal después de updateQty', () => {
    act(() => { useCartStore.getState().addItem(makeItem({ price: 45000, qty: 1 })) })
    act(() => { useCartStore.getState().updateQty(1, 3) })
    expect(useCartStore.getState().subtotal()).toBe(135000)
  })

  it('recalcula subtotal después de removeItem', () => {
    act(() => { useCartStore.getState().addItem(makeItem({ variantId: 1, price: 45000, qty: 2 })) })
    act(() => { useCartStore.getState().addItem(makeItem({ variantId: 2, price: 20000, qty: 1 })) })
    act(() => { useCartStore.getState().removeItem(2) })
    expect(useCartStore.getState().subtotal()).toBe(90000)
  })
})

// ─────────────────────────────────────────────
// Persistencia en localStorage
// ─────────────────────────────────────────────
describe('persistencia en localStorage', () => {
  it('guarda el carrito en la clave "vps-cart" de localStorage', () => {
    act(() => { useCartStore.getState().addItem(makeItem()) })
    const raw = localStorage.getItem('vps-cart')
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!)
    expect(parsed.state.items).toHaveLength(1)
  })

  it('el estado persiste el variantId y el precio correctamente', () => {
    act(() => { useCartStore.getState().addItem(makeItem({ variantId: 42, price: 99000 })) })
    const raw = localStorage.getItem('vps-cart')
    const parsed = JSON.parse(raw!)
    expect(parsed.state.items[0].variantId).toBe(42)
    expect(parsed.state.items[0].price).toBe(99000)
  })
})
