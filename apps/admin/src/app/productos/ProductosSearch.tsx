'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useRef, useTransition } from 'react'

interface Props {
  defaultQ: string
}

export default function ProductosSearch({ defaultQ }: Props) {
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
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`)
      })
    }, 400)
  }

  return (
    <input
      type="search"
      defaultValue={defaultQ}
      onChange={(e) => handleChange(e.target.value)}
      placeholder="Buscar producto..."
      className="font-brand text-sm border border-gray-200 rounded-full px-4 py-2 w-64 focus:outline-none focus:border-brand-primary"
    />
  )
}
