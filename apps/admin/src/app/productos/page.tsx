import { createServerClient } from '@vps/database'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Productos' }
export const dynamic = 'force-dynamic'

export default async function ProductosPage() {
  const supabase = createServerClient()
  const { data: products } = await supabase
    .from('products')
    .select('*, variants:product_variants(*), category:categories(name)')
    .order('created_at', { ascending: false })

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-brand-primary text-3xl">Productos</h1>
        <Link
          href="/productos/nuevo"
          className="bg-brand-primary text-brand-cream rounded-full px-5 py-2 font-brand text-sm hover:bg-brand-dark transition-colors"
        >
          + Nuevo producto
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex gap-3">
          <input
            type="search"
            placeholder="Buscar producto..."
            className="font-brand text-sm border border-gray-200 rounded-full px-4 py-2 w-64 focus:outline-none focus:border-brand-primary"
          />
        </div>

        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              {['Imagen', 'Nombre', 'Categoría', 'Variantes', 'Precio', 'Stock', 'Estado', 'Acciones'].map((h) => (
                <th key={h} className="font-brand text-xs font-semibold text-brand-primary/50 text-left px-4 py-3 first:pl-6 last:pr-6">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {!products?.length ? (
              <tr>
                <td colSpan={8} className="font-brand text-brand-primary/40 text-center py-12">
                  No hay productos. <Link href="/productos/nuevo" className="underline">Crear el primero →</Link>
                </td>
              </tr>
            ) : (
              products.map((product: any) => {
                const prices = product.variants?.map((v: any) => v.price) ?? []
                const minPrice = Math.min(...prices)
                const maxPrice = Math.max(...prices)
                const totalStock = product.variants?.reduce((s: number, v: any) => s + v.stock, 0) ?? 0
                return (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 pl-6">
                      <div className="w-10 h-10 rounded-lg bg-brand-cream overflow-hidden">
                        {product.images?.[0]?.url ? (
                          <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-brand-yellow/30" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-brand font-semibold text-brand-primary text-sm">{product.name}</p>
                      <p className="font-brand text-xs text-brand-primary/40">{product.slug}</p>
                    </td>
                    <td className="px-4 py-3 font-brand text-sm text-brand-primary/60">
                      {product.category?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 font-brand text-sm text-brand-primary/60">
                      {product.variants?.length ?? 0}
                    </td>
                    <td className="px-4 py-3 font-brand text-sm text-brand-primary">
                      {prices.length ? (
                        minPrice === maxPrice ? fmt(minPrice) : `${fmt(minPrice)} – ${fmt(maxPrice)}`
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-brand text-xs font-semibold rounded-full px-2 py-1 ${totalStock > 5 ? 'bg-green-100 text-green-700' : totalStock > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {totalStock}u
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-brand text-xs rounded-full px-2 py-1 ${product.active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                        {product.active ? 'Publicado' : 'Borrador'}
                      </span>
                    </td>
                    <td className="px-4 py-3 pr-6">
                      <div className="flex gap-2">
                        <Link href={`/productos/${product.id}`} className="font-brand text-xs text-brand-primary border border-brand-primary/20 rounded-full px-3 py-1 hover:bg-brand-primary hover:text-brand-cream transition-colors">
                          Editar
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
