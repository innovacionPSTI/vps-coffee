import { createServerClient } from '@vps/database'
import type { Metadata } from 'next'
import ClientesClient from './ClientesClient'
import type { ClientRow } from './ClientesClient'

export const metadata: Metadata = { title: 'Clientes' }
export const dynamic = 'force-dynamic'

export default async function ClientesPage() {
  const supabase = createServerClient()

  // ── 1. Emails de administradores (excluir del listado de clientes) ──────────
  const { data: adminProfiles } = await supabase
    .from('profiles')
    .select('email')

  const adminEmails = new Set(
    (adminProfiles ?? []).map((p) => p.email).filter(Boolean) as string[],
  )

  // ── 2. Clientes registrados con cuenta (tabla customers) ─────────────────────
  // customers se pobla desde /api/auth/welcome al momento del registro.
  // Reemplaza el recorrido paginado de Stack Auth API — una sola query SQL.
  const { data: registeredCustomers } = await supabase
    .from('customers')
    .select('id, email, name, phone, stack_id, created_at')
    .order('created_at', { ascending: false })

  const registeredEmailSet = new Set(
    (registeredCustomers ?? []).map((c) => c.email),
  )

  // ── 3. Estadísticas de pedidos por email ─────────────────────────────────────
  const { data: orders } = await supabase
    .from('orders')
    .select('customer_email, customer_name, customer_phone, total, created_at')
    .order('created_at', { ascending: false })

  type OrderStats = {
    name: string | null
    phone: string | null
    totalOrders: number
    totalSpent: number
    lastOrderAt: string
  }

  const orderStatsByEmail = new Map<string, OrderStats>()

  for (const order of orders ?? []) {
    const email = order.customer_email
    if (!email) continue

    const existing = orderStatsByEmail.get(email)
    if (existing) {
      existing.totalOrders += 1
      existing.totalSpent += order.total ?? 0
      // orders viene desc → el primer registro es el más reciente (ya guardado)
    } else {
      orderStatsByEmail.set(email, {
        name: order.customer_name ?? null,
        phone: order.customer_phone ?? null,
        totalOrders: 1,
        totalSpent: order.total ?? 0,
        lastOrderAt: order.created_at,
      })
    }
  }

  // ── 4. Construir lista combinada ──────────────────────────────────────────────
  const clients: ClientRow[] = []

  // 4a. Clientes con cuenta (tabla customers) — tengan o no pedidos
  for (const c of registeredCustomers ?? []) {
    if (adminEmails.has(c.email)) continue
    const stats = orderStatsByEmail.get(c.email)
    clients.push({
      email: c.email,
      name: c.name ?? stats?.name ?? null,
      phone: c.phone ?? stats?.phone ?? null,
      type: 'con_cuenta',
      signedUpAt: c.created_at,
      totalOrders: stats?.totalOrders ?? 0,
      totalSpent: stats?.totalSpent ?? 0,
      lastOrderAt: stats?.lastOrderAt ?? null,
    })
  }

  // 4b. Compradores sin cuenta (solo en orders, no en customers ni admins)
  for (const [email, stats] of orderStatsByEmail.entries()) {
    if (registeredEmailSet.has(email)) continue
    if (adminEmails.has(email)) continue

    clients.push({
      email,
      name: stats.name,
      phone: stats.phone,
      type: 'sin_cuenta',
      signedUpAt: null,
      totalOrders: stats.totalOrders,
      totalSpent: stats.totalSpent,
      lastOrderAt: stats.lastOrderAt,
    })
  }

  // Ordenar: más recientes primero (último pedido o fecha de registro)
  clients.sort((a, b) => {
    const aDate = a.lastOrderAt ?? a.signedUpAt ?? ''
    const bDate = b.lastOrderAt ?? b.signedUpAt ?? ''
    return bDate.localeCompare(aDate)
  })

  return <ClientesClient clients={clients} />
}
