import { createServerClient } from '../client'
import type { Order, OrderItem, ShippingAddress } from '../types'

export interface CreateOrderInput {
  customer_id?: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  shipping_addr: ShippingAddress
  items: OrderItem[]
  subtotal: number
  shipping_cost: number
  discount?: number
  total: number
  payment_method?: 'wompi' | 'mercadopago'
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const supabase = createServerClient()

  // Generar número de orden: VPS-XXXX
  const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true })
  const orderNumber = `VPS-${String((count ?? 0) + 1).padStart(4, '0')}`

  const { data, error } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      ...input,
      discount: input.discount ?? 0,
      status: 'pending',
      payment_status: 'pending',
    })
    .select()
    .single()

  if (error) throw error
  return data as unknown as Order
}

export async function getOrdersByCustomer(customerId: string): Promise<Order[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as unknown as Order[]
}

/**
 * Obtiene los pedidos de un cliente por su email.
 * Usado desde /mi-cuenta/pedidos cuando el usuario está autenticado con Stack Auth
 * y sus órdenes históricas se vincularon por email (no por ID de Stack).
 */
export async function getOrdersByCustomerEmail(email: string): Promise<Order[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_email', email.toLowerCase())
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as unknown as Order[]
}

export async function getOrderById(id: number) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as unknown as Order
}

export async function updateOrderStatus(
  id: number,
  status: Order['status'],
  extra?: Partial<Omit<Order, 'id' | 'created_at'>>
) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString(), ...extra })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as unknown as Order
}
