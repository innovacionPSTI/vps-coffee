import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getCoupons } from '@vps/database'
import { getAdminUser } from '@/lib/auth'
import CuponesClient from './CuponesClient'

export const metadata: Metadata = { title: 'Cupones' }
export const dynamic = 'force-dynamic'

export default async function CuponesPage() {
  const adminUser = await getAdminUser()
  if (!adminUser || (adminUser.role !== 'super_admin' && adminUser.role !== 'admin')) {
    redirect('/no-autorizado')
  }

  const coupons = await getCoupons().catch(() => [])

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-brand-primary text-3xl">Cupones</h1>
      </div>
      <CuponesClient initialCoupons={coupons} />
    </div>
  )
}
