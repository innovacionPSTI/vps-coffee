import type { Metadata } from 'next'
import Link from 'next/link'
import { getAdminUser } from '@/lib/auth'
import { createServerClient } from '@vps/database'
import type { AdminRole } from '@/lib/roles'

export const metadata: Metadata = { title: 'Dashboard' }
export const dynamic = 'force-dynamic'

// ── Formato ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

const fmtNum = (n: number) => new Intl.NumberFormat('es-CO').format(n)

const STATUS_LABEL: Record<string, string> = {
  pending:    'Pendiente',
  processing: 'En proceso',
  shipped:    'Enviado',
  delivered:  'Entregado',
  cancelled:  'Cancelado',
  exception:  'Excepción',
}

const STATUS_COLOR: Record<string, string> = {
  pending:    'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped:    'bg-purple-100 text-purple-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-700',
  exception:  'bg-orange-100 text-orange-700',
}

// ── Queries por rol ───────────────────────────────────────────────────────────

async function getAdminData() {
  const db = createServerClient()
  const now = new Date()

  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0)
  const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay()); startOfWeek.setHours(0, 0, 0, 0)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    todayOrders,
    weekOrders,
    monthOrders,
    pendingCount,
    newCustomers,
    lowStock,
    recentOrders,
    topItems,
  ] = await Promise.all([
    db.from('orders').select('total').gte('created_at', startOfDay.toISOString()),
    db.from('orders').select('total').gte('created_at', startOfWeek.toISOString()),
    db.from('orders').select('total').gte('created_at', startOfMonth.toISOString()),
    db.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    db.from('customers').select('*', { count: 'exact', head: true }).gte('created_at', startOfWeek.toISOString()),
    db.from('product_variants')
      .select('label, stock, product:products(name)')
      .lte('stock', 5)
      .order('stock', { ascending: true })
      .limit(5),
    db.from('orders')
      .select('order_number, customer_name, total, status, created_at')
      .order('created_at', { ascending: false })
      .limit(6),
    db.from('order_items').select('product_id, product_name, qty'),
  ])

  // Top productos
  const productMap = new Map<number, { name: string; total: number }>()
  for (const item of topItems.data ?? []) {
    const pid = item.product_id as number
    const e = productMap.get(pid)
    if (e) e.total += item.qty as number
    else productMap.set(pid, { name: item.product_name as string, total: item.qty as number })
  }
  const topProducts = [...productMap.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  return {
    salesDay:   (todayOrders.data ?? []).reduce((s, o) => s + o.total, 0),
    ordersDay:  todayOrders.data?.length ?? 0,
    salesWeek:  (weekOrders.data ?? []).reduce((s, o) => s + o.total, 0),
    salesMonth: (monthOrders.data ?? []).reduce((s, o) => s + o.total, 0),
    ordersMonth: monthOrders.data?.length ?? 0,
    pendingCount: pendingCount.count ?? 0,
    newCustomers: newCustomers.count ?? 0,
    lowStock: lowStock.data ?? [],
    recentOrders: recentOrders.data ?? [],
    topProducts,
  }
}

async function getVendedorData() {
  const db = createServerClient()
  const now = new Date()
  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0)

  const [pending, processing, shipped, deliveredToday, lowStock, urgentOrders] = await Promise.all([
    db.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    db.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'processing'),
    db.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'shipped'),
    db.from('orders').select('*', { count: 'exact', head: true })
      .eq('status', 'delivered')
      .gte('created_at', startOfDay.toISOString()),
    db.from('product_variants')
      .select('label, stock, product:products(name, slug)')
      .lte('stock', 5)
      .order('stock', { ascending: true })
      .limit(8),
    db.from('orders')
      .select('order_number, customer_name, customer_email, total, status, created_at')
      .in('status', ['pending', 'processing'])
      .order('created_at', { ascending: true }) // los más antiguos primero = más urgentes
      .limit(8),
  ])

  return {
    pendingCount:    pending.count ?? 0,
    processingCount: processing.count ?? 0,
    shippedCount:    shipped.count ?? 0,
    deliveredToday:  deliveredToday.count ?? 0,
    lowStock: lowStock.data ?? [],
    urgentOrders: urgentOrders.data ?? [],
  }
}

async function getGestorData() {
  const db = createServerClient()
  const in7days = new Date(); in7days.setDate(in7days.getDate() + 7)

  const [sections, blogPublished, blogDraft, herobanners, inactiveTestimonials, expiringCoupons] = await Promise.all([
    db.from('section_settings').select('key, label, enabled').order('order_index'),
    db.from('blog_posts').select('*', { count: 'exact', head: true }).eq('published', true),
    db.from('blog_posts').select('*', { count: 'exact', head: true }).eq('published', false),
    db.from('banners').select('*', { count: 'exact', head: true }).eq('section', 'hero').eq('active', true),
    db.from('testimonials').select('author_name, rating').eq('active', false).limit(8),
    db.from('coupons')
      .select('code, expires_at, discount_type, discount_value, current_uses, max_uses')
      .eq('active', true)
      .not('expires_at', 'is', null)
      .lte('expires_at', in7days.toISOString())
      .order('expires_at', { ascending: true })
      .limit(5),
  ])

  return {
    sections: sections.data ?? [],
    blogPublished: blogPublished.count ?? 0,
    blogDraft: blogDraft.count ?? 0,
    heroBanners: herobanners.count ?? 0,
    inactiveTestimonials: inactiveTestimonials.data ?? [],
    expiringCoupons: expiringCoupons.data ?? [],
  }
}

// ── Componentes UI ────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon, href, color = 'bg-white',
}: {
  label: string
  value: string
  sub?: string
  icon: string
  href?: string
  color?: string
}) {
  const inner = (
    <div className={`${color} rounded-2xl p-5 shadow-sm h-full`}>
      <div className="flex items-start justify-between mb-3">
        <p className="font-brand text-sm text-brand-primary/50">{label}</p>
        <span className="text-2xl leading-none">{icon}</span>
      </div>
      <p className="font-brand font-bold text-brand-primary text-2xl leading-tight">{value}</p>
      {sub && <p className="font-brand text-xs text-brand-primary/40 mt-1">{sub}</p>}
      {href && <p className="font-brand text-xs text-brand-primary underline mt-2">Ver →</p>}
    </div>
  )
  return href ? <Link href={href} className="block">{inner}</Link> : inner
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-brand font-semibold text-brand-primary text-base mb-4">{children}</h2>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-2xl shadow-sm overflow-hidden ${className}`}>{children}</div>
}

// ── Vistas por rol ────────────────────────────────────────────────────────────

async function AdminDashboard() {
  const d = await getAdminData().catch(() => null)
  if (!d) return <p className="font-brand text-brand-primary/40">Error cargando datos.</p>

  return (
    <div className="space-y-8">
      {/* Stats financieras */}
      <div>
        <SectionTitle>Resumen de ventas</SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Ventas hoy"     value={fmt(d.salesDay)}   sub={`${d.ordersDay} pedidos`}      icon="💰" />
          <StatCard label="Ventas semana"  value={fmt(d.salesWeek)}  icon="📈" />
          <StatCard label="Ventas mes"     value={fmt(d.salesMonth)} sub={`${d.ordersMonth} pedidos`}    icon="🗓️" />
          <StatCard label="Clientes nuevos (sem.)" value={fmtNum(d.newCustomers)} icon="👥" href="/clientes" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pedidos recientes */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <SectionTitle>Pedidos recientes</SectionTitle>
            <Link href="/pedidos" className="font-brand text-xs text-brand-primary underline">Ver todos</Link>
          </div>
          <Card>
            {d.recentOrders.length === 0 ? (
              <p className="font-brand text-brand-primary/40 text-center py-10 text-sm">Sin pedidos aún</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['#', 'Cliente', 'Total', 'Estado'].map((h) => (
                      <th key={h} className="font-brand text-xs font-semibold text-brand-primary/40 text-left px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(d.recentOrders as any[]).map((o) => (
                    <tr key={o.order_number} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/pedidos/${o.order_number}`} className="font-brand text-xs font-medium text-brand-primary hover:underline">
                          {o.order_number}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-brand text-xs text-brand-primary/70 max-w-[120px] truncate">{o.customer_name}</td>
                      <td className="px-4 py-3 font-brand text-xs font-semibold text-brand-primary">{fmt(o.total)}</td>
                      <td className="px-4 py-3">
                        <span className={`font-brand text-xs font-semibold rounded-full px-2 py-0.5 ${STATUS_COLOR[o.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_LABEL[o.status] ?? o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          {/* Pedidos pendientes */}
          <StatCard
            label="Pedidos pendientes"
            value={fmtNum(d.pendingCount)}
            sub="Requieren procesamiento"
            icon="⏳"
            href="/pedidos?status=pending"
            color={d.pendingCount > 0 ? 'bg-yellow-50' : 'bg-white'}
          />

          {/* Top productos */}
          <div>
            <SectionTitle>Más vendidos</SectionTitle>
            <Card>
              {d.topProducts.length === 0 ? (
                <p className="font-brand text-brand-primary/40 text-center py-8 text-sm">Sin datos de ventas aún</p>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {d.topProducts.map((p, i) => (
                    <li key={p.name} className="flex items-center justify-between px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="font-brand text-xs text-brand-primary/30 w-4">{i + 1}</span>
                        <span className="font-brand text-sm text-brand-primary truncate max-w-[160px]">{p.name}</span>
                      </div>
                      <span className="font-brand text-xs font-semibold text-brand-primary/60">{fmtNum(p.total)} uds.</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          {/* Bajo stock */}
          {d.lowStock.length > 0 && (
            <div>
              <SectionTitle>⚠️ Bajo stock</SectionTitle>
              <Card>
                <ul className="divide-y divide-gray-50">
                  {(d.lowStock as any[]).map((v, i) => (
                    <li key={i} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="font-brand text-sm text-brand-primary">{(v.product as any)?.name}</p>
                        <p className="font-brand text-xs text-brand-primary/40">{v.label}</p>
                      </div>
                      <span className={`font-brand text-xs font-bold rounded-full px-2.5 py-1 ${v.stock === 0 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                        {v.stock === 0 ? 'Sin stock' : `${v.stock} uds.`}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

async function VendedorDashboard() {
  const d = await getVendedorData().catch(() => null)
  if (!d) return <p className="font-brand text-brand-primary/40">Error cargando datos.</p>

  return (
    <div className="space-y-8">
      {/* Stats operacionales */}
      <div>
        <SectionTitle>Estado de pedidos</SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Pendientes"
            value={fmtNum(d.pendingCount)}
            sub="Por procesar"
            icon="⏳"
            href="/pedidos?status=pending"
            color={d.pendingCount > 0 ? 'bg-yellow-50' : 'bg-white'}
          />
          <StatCard label="En proceso"  value={fmtNum(d.processingCount)} sub="Preparando" icon="🔄" href="/pedidos?status=processing" />
          <StatCard label="Enviados"    value={fmtNum(d.shippedCount)}    sub="En camino"  icon="🚚" href="/pedidos?status=shipped" />
          <StatCard label="Entregados hoy" value={fmtNum(d.deliveredToday)} icon="✅" color="bg-green-50" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pedidos urgentes */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <SectionTitle>Pedidos por atender</SectionTitle>
            <Link href="/pedidos" className="font-brand text-xs text-brand-primary underline">Ver todos</Link>
          </div>
          <Card>
            {d.urgentOrders.length === 0 ? (
              <p className="font-brand text-brand-primary/40 text-center py-10 text-sm">¡Todo al día! Sin pedidos pendientes.</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['#', 'Cliente', 'Fecha', 'Estado'].map((h) => (
                      <th key={h} className="font-brand text-xs font-semibold text-brand-primary/40 text-left px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(d.urgentOrders as any[]).map((o) => {
                    const daysAgo = Math.floor((Date.now() - new Date(o.created_at).getTime()) / 86400000)
                    return (
                      <tr key={o.order_number} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <Link href={`/pedidos/${o.order_number}`} className="font-brand text-xs font-medium text-brand-primary hover:underline">
                            {o.order_number}
                          </Link>
                        </td>
                        <td className="px-4 py-3 font-brand text-xs text-brand-primary/70 max-w-[120px] truncate">{o.customer_name}</td>
                        <td className="px-4 py-3">
                          <span className={`font-brand text-xs ${daysAgo >= 2 ? 'text-red-500 font-semibold' : 'text-brand-primary/50'}`}>
                            {daysAgo === 0 ? 'Hoy' : daysAgo === 1 ? 'Ayer' : `Hace ${daysAgo} días`}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-brand text-xs font-semibold rounded-full px-2 py-0.5 ${STATUS_COLOR[o.status] ?? 'bg-gray-100 text-gray-600'}`}>
                            {STATUS_LABEL[o.status] ?? o.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </Card>
        </div>

        {/* Bajo stock */}
        <div>
          <SectionTitle>{d.lowStock.length > 0 ? '⚠️ Bajo stock' : 'Stock'}</SectionTitle>
          <Card>
            {d.lowStock.length === 0 ? (
              <p className="font-brand text-brand-primary/40 text-center py-10 text-sm">Todos los productos tienen stock suficiente.</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {(d.lowStock as any[]).map((v, i) => (
                  <li key={i} className="flex items-center justify-between px-5 py-3.5">
                    <div>
                      <p className="font-brand text-sm text-brand-primary">{(v.product as any)?.name}</p>
                      <p className="font-brand text-xs text-brand-primary/40">{v.label}</p>
                    </div>
                    <span className={`font-brand text-xs font-bold rounded-full px-2.5 py-1 ${v.stock === 0 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                      {v.stock === 0 ? 'Sin stock' : `${v.stock} uds.`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

async function GestorDashboard() {
  const d = await getGestorData().catch(() => null)
  if (!d) return <p className="font-brand text-brand-primary/40">Error cargando datos.</p>

  const enabledCount  = d.sections.filter((s) => s.enabled).length
  const disabledCount = d.sections.filter((s) => !s.enabled).length

  return (
    <div className="space-y-8">
      {/* Estado del sitio */}
      <div>
        <SectionTitle>Estado del sitio</SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Secciones activas"    value={fmtNum(enabledCount)}        icon="✅" href="/secciones" color="bg-green-50" />
          <StatCard label="Secciones inactivas"  value={fmtNum(disabledCount)}       icon="⛔" href="/secciones" color={disabledCount > 0 ? 'bg-red-50' : 'bg-white'} />
          <StatCard label="Banners hero activos" value={fmtNum(d.heroBanners)}       icon="🖼️" href="/banners" />
          <StatCard label="Testimonios sin activar" value={fmtNum(d.inactiveTestimonials.length)} icon="⭐" href="/testimonios" color={d.inactiveTestimonials.length > 0 ? 'bg-yellow-50' : 'bg-white'} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Blog */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>Blog</SectionTitle>
              <Link href="/blog" className="font-brand text-xs text-brand-primary underline">Gestionar</Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Publicados" value={fmtNum(d.blogPublished)} icon="📰" href="/blog" color="bg-green-50" />
              <StatCard label="Borradores" value={fmtNum(d.blogDraft)}     icon="✏️"  href="/blog" color={d.blogDraft > 0 ? 'bg-yellow-50' : 'bg-white'} />
            </div>
          </div>

          {/* Secciones del sitio */}
          <div>
            <SectionTitle>Secciones configuradas</SectionTitle>
            <Card>
              <ul className="divide-y divide-gray-50">
                {d.sections.map((s: any) => (
                  <li key={s.key} className="flex items-center justify-between px-5 py-3">
                    <span className="font-brand text-sm text-brand-primary">{s.label}</span>
                    <span className={`font-brand text-xs font-semibold rounded-full px-2.5 py-0.5 ${s.enabled ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                      {s.enabled ? 'Activa' : 'Inactiva'}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          {/* Testimonios pendientes */}
          {d.inactiveTestimonials.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <SectionTitle>⭐ Testimonios sin activar</SectionTitle>
                <Link href="/testimonios" className="font-brand text-xs text-brand-primary underline">Revisar</Link>
              </div>
              <Card>
                <ul className="divide-y divide-gray-50">
                  {(d.inactiveTestimonials as any[]).map((t, i) => (
                    <li key={i} className="flex items-center justify-between px-5 py-3">
                      <span className="font-brand text-sm text-brand-primary">{t.author_name}</span>
                      <span className="font-brand text-xs text-brand-primary/40">{'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          )}

          {/* Cupones por vencer */}
          {d.expiringCoupons.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <SectionTitle>🎟️ Cupones por vencer</SectionTitle>
                <Link href="/cupones" className="font-brand text-xs text-brand-primary underline">Ver todos</Link>
              </div>
              <Card>
                <ul className="divide-y divide-gray-50">
                  {(d.expiringCoupons as any[]).map((c) => {
                    const daysLeft = Math.ceil((new Date(c.expires_at).getTime() - Date.now()) / 86400000)
                    return (
                      <li key={c.code} className="flex items-center justify-between px-5 py-3">
                        <div>
                          <p className="font-brand text-sm font-semibold text-brand-primary">{c.code}</p>
                          <p className="font-brand text-xs text-brand-primary/40">
                            {c.discount_type === 'percent' ? `${c.discount_value}%` : fmt(c.discount_value)} ·{' '}
                            {c.current_uses}{c.max_uses ? `/${c.max_uses}` : ''} usos
                          </p>
                        </div>
                        <span className={`font-brand text-xs font-bold rounded-full px-2.5 py-1 ${daysLeft <= 1 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                          {daysLeft <= 0 ? 'Hoy vence' : `${daysLeft}d`}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const adminUser = await getAdminUser()
  const role: AdminRole = adminUser?.role ?? 'vendedor'

  const today = new Date().toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const greeting = {
    super_admin:  'Vista completa del negocio',
    admin:        'Vista completa del negocio',
    vendedor:     'Tus pedidos y tareas del día',
    gestor_tienda:'Estado del contenido y el sitio',
  }[role]

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-brand-primary text-3xl">Dashboard</h1>
          <p className="font-brand text-sm text-brand-primary/40 mt-1">{greeting}</p>
        </div>
        <p className="font-brand text-sm text-brand-primary/40 capitalize hidden sm:block">{today}</p>
      </div>

      {(role === 'super_admin' || role === 'admin') && <AdminDashboard />}
      {role === 'vendedor'     && <VendedorDashboard />}
      {role === 'gestor_tienda' && <GestorDashboard />}
    </div>
  )
}
