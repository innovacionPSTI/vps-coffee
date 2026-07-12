import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getTestimonials } from '@vps/database'
import { getAdminUser } from '@/lib/auth'
import TestimoniosClient from './TestimoniosClient'

export const metadata: Metadata = { title: 'Testimonios' }
export const dynamic = 'force-dynamic'

export default async function TestimoniosPage() {
  const adminUser = await getAdminUser()
  if (!adminUser || (adminUser.role !== 'super_admin' && adminUser.role !== 'admin')) {
    redirect('/no-autorizado')
  }

  const testimonials = await getTestimonials(false).catch(() => [])

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-brand-primary text-3xl">Testimonios</h1>
          <p className="font-brand text-brand-primary/50 text-sm mt-1">
            Los testimonios activos se muestran en la página de Asesorías
          </p>
        </div>
      </div>
      <TestimoniosClient initialTestimonials={testimonials} />
    </div>
  )
}
