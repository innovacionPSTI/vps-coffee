'use client'

import { useState, useRef, useEffect, useId } from 'react'

interface Props {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  /** Shows a helper text under the field */
  hint?: string
  /** Additional className for the wrapper div */
  className?: string
}

/**
 * Searchable combobox component.
 * Filters options as you type. Supports keyboard navigation.
 * Compatible with the brand design system (font-brand, brand-primary, etc.)
 */
export default function SearchableSelect({
  label,
  value,
  options,
  onChange,
  placeholder = 'Buscar...',
  required = false,
  disabled = false,
  hint,
  className = '',
}: Props) {
  const id = useId()
  const [open, setOpen]         = useState(false)
  const [query, setQuery]       = useState('')
  const [highlighted, setHighlighted] = useState(-1)
  const inputRef  = useRef<HTMLInputElement>(null)
  const listRef   = useRef<HTMLUListElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Display text: when closed, show the selected value; when open, show query
  const displayValue = open ? query : value

  const filtered = query.trim()
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
        setHighlighted(-1)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlighted >= 0 && listRef.current) {
      const item = listRef.current.children[highlighted] as HTMLElement
      item?.scrollIntoView({ block: 'nearest' })
    }
  }, [highlighted])

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value)
    setOpen(true)
    setHighlighted(-1)
    // If user clears the field, clear selection
    if (!e.target.value) onChange('')
  }

  function handleSelect(option: string) {
    onChange(option)
    setQuery('')
    setOpen(false)
    setHighlighted(-1)
    inputRef.current?.blur()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setOpen(true)
      return
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlighted((h) => Math.min(h + 1, filtered.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlighted((h) => Math.max(h - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (highlighted >= 0 && filtered[highlighted]) {
          handleSelect(filtered[highlighted])
        } else if (filtered.length === 1) {
          handleSelect(filtered[0])
        }
        break
      case 'Escape':
        setOpen(false)
        setQuery('')
        setHighlighted(-1)
        break
      case 'Tab':
        setOpen(false)
        setQuery('')
        break
    }
  }

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <label
        htmlFor={id}
        className="font-brand text-xs font-semibold text-brand-primary block mb-1"
      >
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      <div className="relative">
        <input
          id={id}
          ref={inputRef}
          type="text"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          disabled={disabled}
          required={required}
          value={displayValue}
          placeholder={value || placeholder}
          onChange={handleInputChange}
          onFocus={() => { setOpen(true); setQuery('') }}
          onKeyDown={handleKeyDown}
          className={`w-full border rounded-xl px-4 py-2.5 font-brand text-sm text-brand-primary
            pr-9 focus:outline-none transition-colors
            ${disabled
              ? 'bg-gray-50 text-brand-primary/40 cursor-not-allowed border-gray-200'
              : 'bg-white border-gray-200 focus:border-brand-primary cursor-text'
            }
            ${!value && !open ? 'text-brand-primary/40' : ''}
          `}
        />
        {/* Chevron icon */}
        <span
          className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-primary/40"/>
          </svg>
        </span>
      </div>

      {/* Dropdown */}
      {open && filtered.length > 0 && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg
                     max-h-56 overflow-y-auto py-1"
        >
          {filtered.map((option, i) => (
            <li
              key={`${i}-${option}`}
              role="option"
              aria-selected={option === value}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(option) }}
              onMouseEnter={() => setHighlighted(i)}
              className={`px-4 py-2 font-brand text-sm cursor-pointer transition-colors
                ${i === highlighted ? 'bg-brand-primary/5 text-brand-primary' : 'text-brand-primary/80 hover:bg-brand-primary/5'}
                ${option === value ? 'font-semibold' : ''}
              `}
            >
              {option}
              {option === value && (
                <span className="ml-2 text-brand-primary">✓</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {open && query.trim() && filtered.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg py-3 px-4">
          <p className="font-brand text-sm text-brand-primary/40">Sin resultados para "{query}"</p>
        </div>
      )}

      {hint && (
        <p className="font-brand text-xs text-brand-primary/40 mt-1">{hint}</p>
      )}
    </div>
  )
}
