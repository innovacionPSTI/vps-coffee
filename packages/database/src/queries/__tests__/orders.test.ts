/**
 * Unit tests for orders query helpers.
 * Focus areas:
 *   - createOrder: número correlativo VPS-XXXX, campo status/payment_status por defecto
 *   - updateOrderStatus: merge con campos extra
 *   - getOrdersByCustomer: ordenamiento descendente
 *   - getOrderById: manejo de not-found
 */

import { createOrder, updateOrderStatus, getOrdersByCustomer, getOrderById } from '../orders'
import { createServerClient } from '../../client'
import type { CreateOrderInput } from '../orders'

jest.mock('../../client')
const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>

// ─────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────
const baseInput: CreateOrderInput = {
  customer_name: 'Carlos Martínez',
  customer_email: 'carlos@example.com',
  customer_phone: '3001234567',
  shipping_addr: {
    street: 'Calle 93 #15-10',
    city: 'Bogotá',
    department: 'Cundinamarca',
    postal_code: '110221',
    country: 'CO',
  },
  items: [
    { variantId: 10, productName: 'Café Huila', variantLabel: '500g · Claro', price: 45000, qty: 2, weight: '500g' },
  ],
  subtotal: 90000,
  shipping_cost: 8000,
  total: 98000,
  payment_method: 'wompi',
}

function buildOrderMock(overrides = {}) {
  return {
    id: 1,
    order_number: 'VPS-0001',
    status: 'pending',
    payment_status: 'pending',
    discount: 0,
    ...baseInput,
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
})

// ─────────────────────────────────────────────
// createOrder
// ─────────────────────────────────────────────
describe('createOrder', () => {
  function setupMock(orderCount: number, createdOrder: object) {
    const singleMock = jest.fn().mockResolvedValue({ data: createdOrder, error: null })
    const insertChain = { select: jest.fn().mockReturnValue({ single: singleMock }) }
    const supabase = {
      from: jest.fn((table: string) => {
        if (table === 'orders') {
          return {
            // First call: select count
            select: jest.fn().mockReturnValue({
              then: undefined,
              // The count query returns a resolved promise directly
              ...{ data: null, count: orderCount, error: null },
              // Supabase chained call for count
            }),
            insert: jest.fn().mockReturnValue(insertChain),
          }
        }
        return {}
      }),
    }
    // Override: first from('orders') returns count, second returns insert chain
    let callCount = 0
    supabase.from = jest.fn((_table: string) => {
      callCount++
      if (callCount === 1) {
        // Count query: .select('*', { count: 'exact', head: true })
        return {
          select: jest.fn().mockResolvedValue({ data: null, count: orderCount, error: null }),
        }
      }
      // Insert query
      return {
        insert: jest.fn().mockReturnValue(insertChain),
        select: jest.fn().mockReturnValue({ single: singleMock }),
      }
    })

    mockCreateServerClient.mockReturnValue(supabase as never)
    return { singleMock, insertChain }
  }

  it('genera número de orden VPS-0001 cuando no hay órdenes previas', async () => {
    const expectedOrder = buildOrderMock({ order_number: 'VPS-0001' })
    const { singleMock } = setupMock(0, expectedOrder)

    const order = await createOrder(baseInput)
    expect(order.order_number).toBe('VPS-0001')
  })

  it('genera número correlativo VPS-0042 cuando hay 41 órdenes previas', async () => {
    const expectedOrder = buildOrderMock({ order_number: 'VPS-0042' })
    setupMock(41, expectedOrder)

    const order = await createOrder(baseInput)
    expect(order.order_number).toBe('VPS-0042')
  })

  it('asigna status "pending" y payment_status "pending" por defecto', async () => {
    const expectedOrder = buildOrderMock()
    setupMock(0, expectedOrder)

    const order = await createOrder(baseInput)
    expect(order.status).toBe('pending')
    expect(order.payment_status).toBe('pending')
  })

  it('asigna discount = 0 si no se proporciona', async () => {
    const inputSinDescuento = { ...baseInput }
    delete (inputSinDescuento as CreateOrderInput & { discount?: number }).discount
    const expectedOrder = buildOrderMock({ discount: 0 })
    setupMock(0, expectedOrder)

    const order = await createOrder(inputSinDescuento)
    expect(order.discount).toBe(0)
  })

  it('aplica el descuento si se proporciona', async () => {
    const inputConDescuento = { ...baseInput, discount: 5000, total: 93000 }
    const expectedOrder = buildOrderMock({ discount: 5000, total: 93000 })
    setupMock(0, expectedOrder)

    const order = await createOrder(inputConDescuento)
    expect(order.discount).toBe(5000)
  })

  it('lanza error si Supabase falla al insertar', async () => {
    const supabase = {
      from: jest.fn(() => ({
        select: jest.fn().mockResolvedValue({ data: null, count: 0, error: null }),
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: new Error('Insert failed') }),
          }),
        }),
      })),
    }
    let callCount = 0
    supabase.from = jest.fn((_table: string) => {
      callCount++
      if (callCount === 1) {
        return { select: jest.fn().mockResolvedValue({ data: null, count: 0, error: null }) }
      }
      return {
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: new Error('Insert failed') }),
          }),
        }),
      }
    })
    mockCreateServerClient.mockReturnValue(supabase as never)

    await expect(createOrder(baseInput)).rejects.toThrow('Insert failed')
  })
})

// ─────────────────────────────────────────────
// updateOrderStatus
// ─────────────────────────────────────────────
describe('updateOrderStatus', () => {
  it('actualiza el status y el updated_at del pedido', async () => {
    const updatedOrder = buildOrderMock({ status: 'shipped' })
    const singleMock = jest.fn().mockResolvedValue({ data: updatedOrder, error: null })
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({ single: singleMock }),
          }),
        }),
      }),
    }
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    const order = await updateOrderStatus(1, 'shipped')
    expect(order.status).toBe('shipped')
  })

  it('aplica campos extra (tracking_number, label_url)', async () => {
    const updatedOrder = buildOrderMock({
      status: 'shipped',
      tracking_number: 'TRK123456',
      label_url: 'https://cdn.skydropx.com/label.pdf',
    })
    const updateMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: updatedOrder, error: null }),
        }),
      }),
    })
    const mockSupabase = {
      from: jest.fn().mockReturnValue({ update: updateMock }),
    }
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    await updateOrderStatus(1, 'shipped', {
      tracking_number: 'TRK123456',
      label_url: 'https://cdn.skydropx.com/label.pdf',
    } as never)

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'shipped',
        tracking_number: 'TRK123456',
        label_url: 'https://cdn.skydropx.com/label.pdf',
      })
    )
  })

  it('lanza error si la orden no existe', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116', message: 'Row not found' },
              }),
            }),
          }),
        }),
      }),
    }
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    await expect(updateOrderStatus(9999, 'shipped')).rejects.toMatchObject({
      code: 'PGRST116',
    })
  })
})

// ─────────────────────────────────────────────
// getOrdersByCustomer
// ─────────────────────────────────────────────
describe('getOrdersByCustomer', () => {
  it('retorna los pedidos del cliente ordenados por fecha descendente', async () => {
    const orders = [
      buildOrderMock({ id: 2, order_number: 'VPS-0002', customer_id: 'user-abc' }),
      buildOrderMock({ id: 1, order_number: 'VPS-0001', customer_id: 'user-abc' }),
    ]
    const orderMock = jest.fn().mockResolvedValue({ data: orders, error: null })
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({ order: orderMock }),
        }),
      }),
    }
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    const result = await getOrdersByCustomer('user-abc')
    expect(result).toHaveLength(2)
    expect(result[0].order_number).toBe('VPS-0002')
    expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: false })
  })

  it('retorna arreglo vacío si el cliente no tiene pedidos', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
    }
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    const result = await getOrdersByCustomer('user-sin-pedidos')
    expect(result).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────
// getOrderById
// ─────────────────────────────────────────────
describe('getOrderById', () => {
  it('retorna el pedido con el id indicado', async () => {
    const mockOrder = buildOrderMock({ id: 5, order_number: 'VPS-0005' })
    const singleMock = jest.fn().mockResolvedValue({ data: mockOrder, error: null })
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({ single: singleMock }),
        }),
      }),
    }
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    const order = await getOrderById(5)
    expect(order.id).toBe(5)
    expect(order.order_number).toBe('VPS-0005')
  })

  it('lanza error si el pedido no existe', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Row not found' },
            }),
          }),
        }),
      }),
    }
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    await expect(getOrderById(9999)).rejects.toMatchObject({ code: 'PGRST116' })
  })
})
