'use client'

import { useEffect, useRef } from 'react'
import { useUser } from '@stackframe/stack'
import { useCartStore } from '@/store/cart'

/**
 * Invisible component that syncs the cart when the user logs in.
 * - On login: push local cart to server, then pull server cart and merge.
 * - On logout: no action needed (local cart persists for next session).
 * Mount this inside StackProvider (root layout client area).
 */
export default function CartSyncOnLogin() {
  const user = useUser({ or: 'return-null' })
  const syncToServer = useCartStore((s) => s.syncToServer)
  const loadFromServer = useCartStore((s) => s.loadFromServer)
  const prevUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    const currentId = user?.id ?? null

    // Trigger only when transitioning from logged-out → logged-in
    if (currentId && currentId !== prevUserIdRef.current) {
      syncToServer().then(() => loadFromServer())
    }

    prevUserIdRef.current = currentId
  }, [user?.id, syncToServer, loadFromServer])

  return null
}
