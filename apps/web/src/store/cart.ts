import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface CartItem {
  variantId: number
  productSlug: string
  productName: string
  variantLabel: string  // "500g · Grano · Claro"
  price: number
  qty: number
  imageUrl?: string
  weight: '250g' | '500g' | '1kg'
}

interface CartState {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (variantId: number) => void
  updateQty: (variantId: number, qty: number) => void
  clearCart: () => void
  total: () => number
  subtotal: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          const existing = state.items.find((i) => i.variantId === item.variantId)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.variantId === item.variantId
                  ? { ...i, qty: i.qty + item.qty }
                  : i
              ),
            }
          }
          return { items: [...state.items, item] }
        })
      },

      removeItem: (variantId) => {
        set((state) => ({
          items: state.items.filter((i) => i.variantId !== variantId),
        }))
      },

      updateQty: (variantId, qty) => {
        if (qty <= 0) {
          get().removeItem(variantId)
          return
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.variantId === variantId ? { ...i, qty } : i
          ),
        }))
      },

      clearCart: () => set({ items: [] }),

      subtotal: () =>
        get().items.reduce((acc, i) => acc + i.price * i.qty, 0),

      total: () => get().subtotal(), // shipping se calcula en checkout
    }),
    {
      name: 'vps-cart',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
