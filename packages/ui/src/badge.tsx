import * as React from 'react'
import { cn } from './cn'

interface BadgeProps {
  children: React.ReactNode
  active?: boolean
  onClick?: () => void
  className?: string
}

export function Badge({ children, active, onClick, className }: BadgeProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-sm font-brand transition-all',
        'border border-brand-primary/30 bg-brand-yellow text-brand-text',
        active && 'bg-brand-primary text-brand-cream border-brand-primary',
        onClick && 'cursor-pointer hover:border-brand-primary',
        !onClick && 'cursor-default',
        className
      )}
    >
      {children}
    </button>
  )
}
