import { Suspense } from 'react'
import type { Metadata } from 'next'
import { stackServerApp } from '@/stack'
import { createServerClient } from '@vps/database'
import CheckoutClient from '@/components/checkout/CheckoutClient'

export const metadata: Metadata = { title: 'Checkout — VPS Coffee' }

interface SavedAddress {
  full_name: string
  phone: string | null
  address: string
  city: string
  department: string | null
  postal_code: string | null
  is_default: boolean
}

async function getDefaultAddress(): Promise<SavedAddress | null> {
  try {
    const user = await stackServerApp.getUser()
    if (!user?.primaryEmail) return null

    const supabase = createServerClient()

    // Look up the customer record
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('stack_id', user.id)
      .maybeSingle()

    // Fallback: look up by email (guest who later registered)
    let customerId = customer?.id ?? null
    if (!customerId) {
      const { data: byEmail } = await supabase
        .from('customers')
        .select('id')
        .eq('email', user.primaryEmail)
        .maybeSingle()
      customerId = byEmail?.id ?? null
    }

    if (!customerId) return null

    const { data: addresses } = await supabase
      .from('customer_addresses')
      .select('full_name, phone, address, city, department, postal_code, is_default')
      .eq('customer_id', customerId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (!addresses?.length) return null
    return addresses.find((a) => a.is_default) ?? addresses[0]
  } catch {
    return null
  }
}

export default async function CheckoutPage() {
  const [defaultAddress, user] = await Promise.all([
    getDefaultAddress(),
    stackServerApp.getUser().catch(() => null),
  ])

  return (
    <Suspense>
      <CheckoutClient
        initialEmail={user?.primaryEmail ?? ''}
        defaultAddress={defaultAddress}
      />
    </Suspense>
  )
}
