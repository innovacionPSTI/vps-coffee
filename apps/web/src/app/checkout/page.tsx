import { Suspense } from 'react'
import type { Metadata } from 'next'
import CheckoutClient from '@/components/checkout/CheckoutClient'

export const metadata: Metadata = { title: 'Checkout — VPS Coffee' }

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutClient />
    </Suspense>
  )
}
