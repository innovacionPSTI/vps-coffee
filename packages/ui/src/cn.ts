/**
 * Lightweight className merger — zero external dependencies.
 *
 * Handles strings, arrays, objects ({ 'class': condition }), and falsy values,
 * covering the full clsx API surface used by @vps/ui components.
 *
 * Note: does NOT perform Tailwind-specific de-duplication (tailwind-merge).
 * For conflict resolution in app code, import from the app's own cn utility.
 * The components in this package are designed to avoid conflicting class names.
 */

export type ClassValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ClassValue[]
  | Record<string, boolean | null | undefined>

function toClass(value: ClassValue): string {
  if (!value && value !== 0) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  if (Array.isArray(value)) return value.map(toClass).filter(Boolean).join(' ')
  if (typeof value === 'object') {
    return Object.entries(value)
      .filter(([, v]) => Boolean(v))
      .map(([k]) => k)
      .join(' ')
  }
  return ''
}

export function cn(...inputs: ClassValue[]): string {
  return inputs.map(toClass).filter(Boolean).join(' ')
}
