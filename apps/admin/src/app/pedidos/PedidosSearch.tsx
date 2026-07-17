'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useRef, useTransition } from 'react'

interface Props {
  defaultQ: string
}

export default function PedidosSearch({ defaultQ }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleChange(value: string) {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set('q', value)
      } else {
        params.delete('q')
      }
      params.delete('page')
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`)
      })
    }, 400)
  }

  return (
    <div className="mb-4">
      <div className="relative max-w-sm">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-primary/30 text-sm">🔍</span>
        <input
          type="search"
          defaultValue={defaultQ}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Buscar por número, cliente o email…"
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl font-brand text-sm text-brand-primary focus:outline-none focus:border-brand-primary placeholder:text-brand-primary/30"
        />
      </div>
    </div>
  )
}
