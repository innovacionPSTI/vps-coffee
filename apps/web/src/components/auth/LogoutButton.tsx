'use client'

import { useUser } from '@stackframe/stack'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const user = useUser({ or: 'return-null' })
  const router = useRouter()

  async function handleLogout() {
    await user?.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-brand text-sm text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      Cerrar sesión
    </button>
  )
}
