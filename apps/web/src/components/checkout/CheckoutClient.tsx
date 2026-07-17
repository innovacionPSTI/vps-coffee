'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCartStore } from '@/store/cart'
import type { ShippingRate } from '@/lib/shipping/types'
import SearchableSelect from '@/components/ui/SearchableSelect'
import { DEPARTMENTS, getCitiesForDepartment } from '@vps/ui'

type Step = 1 | 2 | 3

interface ContactInfo { email: string }

interface ShippingInfo {
  name: string; lastname: string; address: string
  city: string; department: string; phone: string; postal_code: string
}

interface ShippingPublicConfig {
  provider: 'fixed' | 'skydropx'
  fixed_rate: number
  free_shipping_enabled: boolean
  free_shipping_min_amount: number
}

interface SavedAddress {
  full_name: string
  phone: string | null
  address: string
  city: string
  department: string | null
  postal_code: string | null
  is_default: boolean
}

interface Props {
  initialEmail?: string
  defaultAddress?: SavedAddress | null
}

const FALLBACK_CFG: ShippingPublicConfig = {
  provider: 'fixed', fixed_rate: 8000,
  free_shipping_enabled: true, free_shipping_min_amount: 100000,
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

function addressToShipping(addr: SavedAddress): ShippingInfo {
  const parts = addr.full_name.trim().split(/\s+/)
  return {
    name: parts[0] ?? '',
    lastname: parts.slice(1).join(' '),
    phone: addr.phone ?? '',
    address: addr.address,
    city: addr.city,
    department: addr.department ?? '',
    postal_code: addr.postal_code ?? '',
  }
}

export default function CheckoutClient({ initialEmail = '', defaultAddress = null }: Props) {
  const { items, subtotal, clearCart } = useCartStore()

  const [step, setStep]         = useState<Step>(1)
  const [contact, setContact]   = useState<ContactInfo>({ email: initialEmail })
  const [shipping, setShipping] = useState<ShippingInfo>(
    defaultAddress
      ? addressToShipping(defaultAddress)
      : { name: '', lastname: '', address: '', city: '', department: '', phone: '', postal_code: '' }
  )
  const [paymentMethod, setPaymentMethod] = useState<'wompi' | 'mercadopago'>('wompi')
  const [loading, setLoading]   = useState(false)

  // Envío
  const [shippingCfg, setShippingCfg]       = useState<ShippingPublicConfig>(FALLBACK_CFG)
  const [availableRates, setAvailableRates] = useState<ShippingRate[]>([])
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null)
  const [ratesLoading, setRatesLoading]     = useState(false)
  const [ratesFetched, setRatesFetched]     = useState(false)

  // Cupón
  const [couponCode, setCouponCode]         = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponApplied, setCouponApplied]   = useState<string | null>(null)
  const [couponLoading, setCouponLoading]   = useState(false)
  const [couponError, setCouponError]       = useState('')

  // Cargar config de envío al montar
  useEffect(() => {
    fetch('/api/shipping/config')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setShippingCfg(d) })
      .catch(() => {})
  }, [])

  // Obtener tarifas Skydropx
  const fetchRates = async () => {
    if (shippingCfg.provider !== 'skydropx') return
    setRatesLoading(true)
    setAvailableRates([])
    setSelectedRateId(null)
    setRatesFetched(false)
    try {
      const res = await fetch('/api/shipping/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: {
            name: `${shipping.name} ${shipping.lastname}`.trim(),
            street: shipping.address,
            city: shipping.city,
            department: shipping.department,
            postal_code: shipping.postal_code,
            phone: shipping.phone,
            email: contact.email,
          },
          items: items.map((i) => ({
            weight:    i.weight,
            weight_kg: i.weight_kg ?? null,
            length_cm: i.length_cm ?? null,
            width_cm:  i.width_cm  ?? null,
            height_cm: i.height_cm ?? null,
            price:     i.price,
            qty:       i.qty,
          })),
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const rates: ShippingRate[] = data.rates ?? []
        setAvailableRates(rates)
        if (rates.length > 0) setSelectedRateId(rates[0].id)
      }
    } catch { /* fallback a tarifa fija */ }
    finally {
      setRatesLoading(false)
      setRatesFetched(true)
    }
  }

  // Aplicar cupón
  const applyCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    setCouponError('')
    try {
      const res = await fetch('/api/checkout/coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim(), subtotal: sub }),
      })
      const data = await res.json()
      if (!res.ok) { setCouponError(data.error ?? 'Cupón inválido'); return }
      setCouponDiscount(data.discount)
      setCouponApplied(data.code)
    } catch { setCouponError('Error aplicando el cupón') }
    finally { setCouponLoading(false) }
  }

  const removeCoupon = () => {
    setCouponApplied(null)
    setCouponDiscount(0)
    setCouponCode('')
    setCouponError('')
  }

  const sub = subtotal()
  const isFreeShipping = shippingCfg.free_shipping_enabled && sub >= shippingCfg.free_shipping_min_amount

  const selectedRate = availableRates.find((r) => r.id === selectedRateId)
  const shippingCost = isFreeShipping
    ? 0
    : shippingCfg.provider === 'skydropx' && selectedRate
      ? selectedRate.total_price
      : shippingCfg.fixed_rate

  const total = Math.max(0, sub + shippingCost - couponDiscount)

  if (items.length === 0) {
    return (
      <div className="bg-brand-cream min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <p className="font-brand text-brand-primary/50 mb-4">Tu carrito está vacío</p>
          <Link href="/tienda" className="font-brand text-sm text-brand-primary underline">Volver a la tienda</Link>
        </div>
      </div>
    )
  }

  async function handleConfirm() {
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: contact.email,
          name: `${shipping.name} ${shipping.lastname}`,
          phone: shipping.phone,
          address: { address: shipping.address, city: shipping.city, department: shipping.department, postal_code: shipping.postal_code },
          items: items.map((i) => ({ variant_id: i.variantId, product_name: i.productName, variant_label: i.variantLabel, qty: i.qty, price: i.price })),
          subtotal: sub,
          shipping_cost: shippingCost,
          discount: couponDiscount,
          coupon_code: couponApplied,
          shipping_rate: selectedRate
            ? {
                id: selectedRate.id,
                carrier_name: selectedRate.carrier_name,
                service_name: selectedRate.service_name,
                days: selectedRate.days,
                total_price: selectedRate.total_price,
              }
            : null,
          total,
          payment_method: paymentMethod,
        }),
      })
      if (!res.ok) throw new Error('Error creando el pedido')
      const { payment_url } = await res.json()
      clearCart()
      window.location.href = payment_url
    } catch (err) {
      console.error('[checkout]', err)
      alert('Ocurrió un error al procesar tu pedido. Por favor intenta de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div className="bg-brand-cream min-h-screen pt-16">
      {/* Navbar simplificado */}
      <div className="bg-brand-cream border-b border-brand-primary/10 px-6 py-4 flex items-center justify-center">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center">
            <span className="font-display text-brand-cream text-xs font-bold">▲</span>
          </div>
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress */}
        <div className="flex items-center justify-center gap-4 mb-12">
          {([1, 2, 3] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-brand font-bold transition-colors ${step >= s ? 'bg-brand-primary text-brand-cream' : 'bg-brand-primary/10 text-brand-primary/40'}`}>{s}</div>
              <span className={`font-brand text-sm hidden sm:block ${step >= s ? 'text-brand-primary' : 'text-brand-primary/40'}`}>
                {s === 1 ? 'Contacto' : s === 2 ? 'Envío' : 'Pago'}
              </span>
              {i < 2 && <div className="w-8 h-px bg-brand-primary/20" />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Formulario */}
          <div className="lg:col-span-3 space-y-6">

            {/* Paso 1: Contacto */}
            {step === 1 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="font-brand font-semibold text-brand-primary text-xl mb-5">1. Información de contacto</h2>
                <div className="space-y-4">
                  <div>
                    <label className="font-brand text-sm font-semibold text-brand-primary block mb-1">Email *</label>
                    <input type="email" value={contact.email} onChange={(e) => setContact({ email: e.target.value })} placeholder="tu@correo.com" required
                      className="w-full border border-brand-primary/20 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary" />
                  </div>
                  <button onClick={() => contact.email && setStep(2)} disabled={!contact.email}
                    className="w-full bg-brand-primary text-brand-cream rounded-full py-3 font-brand font-medium hover:bg-brand-dark transition-colors disabled:opacity-40">
                    Continuar al envío →
                  </button>
                </div>
              </div>
            )}

            {/* Paso 2: Envío */}
            {step === 2 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="font-brand font-semibold text-brand-primary text-xl mb-5">2. Dirección de envío</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {[{ key: 'name', label: 'Nombre', placeholder: 'Juan' }, { key: 'lastname', label: 'Apellido', placeholder: 'García' }].map((f) => (
                      <div key={f.key}>
                        <label className="font-brand text-sm font-semibold text-brand-primary block mb-1">{f.label} *</label>
                        <input type="text" value={shipping[f.key as keyof ShippingInfo]} onChange={(e) => setShipping({ ...shipping, [f.key]: e.target.value })} placeholder={f.placeholder}
                          className="w-full border border-brand-primary/20 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary" />
                      </div>
                    ))}
                  </div>
                  {/* Dirección */}
                  <div>
                    <label className="font-brand text-sm font-semibold text-brand-primary block mb-1">Dirección *</label>
                    <input type="text" value={shipping.address}
                      onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                      placeholder="Calle 123 #45-67, Apto 8"
                      className="w-full border border-brand-primary/20 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary" />
                  </div>

                  {/* Departamento y Ciudad */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <SearchableSelect
                      label="Departamento"
                      required
                      value={shipping.department}
                      options={DEPARTMENTS}
                      placeholder="Selecciona departamento"
                      onChange={(dept) => {
                        setShipping({ ...shipping, department: dept, city: '' })
                        setRatesFetched(false)
                        setAvailableRates([])
                        setSelectedRateId(null)
                      }}
                    />
                    <SearchableSelect
                      label="Ciudad / Municipio"
                      required
                      value={shipping.city}
                      options={getCitiesForDepartment(shipping.department)}
                      placeholder={shipping.department ? 'Selecciona ciudad' : 'Primero elige departamento'}
                      disabled={!shipping.department}
                      onChange={(city) => {
                        setShipping({ ...shipping, city })
                        setRatesFetched(false)
                        setAvailableRates([])
                        setSelectedRateId(null)
                      }}
                    />
                  </div>

                  {/* Código postal */}
                  <div>
                    <label className="font-brand text-sm font-semibold text-brand-primary block mb-1">
                      Código postal <span className="font-normal text-brand-primary/40">(opcional)</span>
                    </label>
                    <input type="text" value={shipping.postal_code}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, '').slice(0, 6)
                        setShipping({ ...shipping, postal_code: v })
                      }}
                      placeholder="6 dígitos"
                      maxLength={6}
                      inputMode="numeric"
                      className={`w-40 border rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none transition-colors ${
                        shipping.postal_code && shipping.postal_code.length !== 6
                          ? 'border-amber-400 focus:border-amber-500'
                          : 'border-brand-primary/20 focus:border-brand-primary'
                      }`}
                    />
                    {shipping.postal_code && shipping.postal_code.length !== 6 && (
                      <p className="font-brand text-xs text-amber-600 mt-1">El código postal debe tener 6 dígitos</p>
                    )}
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label className="font-brand text-sm font-semibold text-brand-primary block mb-1">Teléfono *</label>
                    <input type="tel" value={shipping.phone}
                      onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                      placeholder="+57 300 123 4567"
                      className="w-full border border-brand-primary/20 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary" />
                  </div>

                  {/* Selector de transportadora (Skydropx) */}
                  {shippingCfg.provider === 'skydropx' && !isFreeShipping && ratesLoading && (
                    <div className="flex items-center gap-3 py-3 px-4 bg-brand-cream/50 rounded-xl">
                      <svg className="animate-spin w-4 h-4 text-brand-primary/50" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <p className="font-brand text-sm text-brand-primary/50">Calculando opciones de envío…</p>
                    </div>
                  )}

                  {shippingCfg.provider === 'skydropx' && !isFreeShipping && ratesFetched && availableRates.length === 0 && (
                    <p className="font-brand text-sm text-amber-600 bg-amber-50 rounded-xl px-4 py-3">
                      No se encontraron tarifas para esta dirección. Se aplicará tarifa estándar al confirmar.
                    </p>
                  )}

                  {shippingCfg.provider === 'skydropx' && !isFreeShipping && availableRates.length > 0 && (
                    <div>
                      <p className="font-brand text-sm font-semibold text-brand-primary mb-2">Elige tu transportadora</p>
                      <div className="space-y-2">
                        {availableRates.map((rate) => (
                          <label key={rate.id} className={`flex items-center justify-between gap-4 p-3 rounded-xl border-2 cursor-pointer transition-colors ${selectedRateId === rate.id ? 'border-brand-primary bg-brand-cream/40' : 'border-brand-primary/10 hover:border-brand-primary/30'}`}>
                            <div className="flex items-center gap-3">
                              <input type="radio" name="shipping_rate" value={rate.id} checked={selectedRateId === rate.id} onChange={() => setSelectedRateId(rate.id)} className="accent-brand-primary" />
                              <div>
                                <p className="font-brand text-sm font-semibold text-brand-primary">{rate.carrier_name}</p>
                                <p className="font-brand text-xs text-brand-primary/50">{rate.service_name} · {rate.days} día{rate.days !== 1 ? 's' : ''} hábil{rate.days !== 1 ? 'es' : ''}</p>
                              </div>
                            </div>
                            <span className="font-brand text-sm font-bold text-brand-primary">{fmt(rate.total_price)}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {(() => {
                    const { name, lastname, address, city, department, phone } = shipping
                    const formReady = !!(name && lastname && address && city && department && phone)
                    const needsRates = shippingCfg.provider === 'skydropx' && !isFreeShipping
                    // Show "calculate" button when form is filled but rates not yet fetched
                    const showCalculate = needsRates && formReady && !ratesFetched && !ratesLoading
                    // Can proceed if: not skydropx, or free shipping, or rates fetched (even if empty — we fallback)
                    const canProceed = formReady && (!needsRates || ratesFetched)

                    return (
                      <div className="space-y-3">
                        {showCalculate && (
                          <button
                            type="button"
                            onClick={fetchRates}
                            className="w-full border-2 border-brand-primary text-brand-primary rounded-full py-3 font-brand font-medium hover:bg-brand-primary hover:text-brand-cream transition-colors"
                          >
                            Ver opciones de envío →
                          </button>
                        )}
                        <div className="flex gap-3">
                          <button onClick={() => setStep(1)} className="flex-1 border border-brand-primary/20 text-brand-primary rounded-full py-3 font-brand font-medium hover:border-brand-primary transition-colors">← Atrás</button>
                          <button
                            onClick={() => { if (canProceed) setStep(3) }}
                            disabled={!canProceed || ratesLoading}
                            className="flex-1 bg-brand-primary text-brand-cream rounded-full py-3 font-brand font-medium hover:bg-brand-dark transition-colors disabled:opacity-40"
                          >
                            Continuar al pago →
                          </button>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>
            )}

            {/* Paso 3: Pago */}
            {step === 3 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="font-brand font-semibold text-brand-primary text-xl mb-5">3. Método de pago</h2>
                <div className="space-y-3 mb-6">
                  {[
                    { value: 'wompi', label: 'Wompi', desc: 'Tarjeta débito/crédito, PSE, Bancolombia' },
                    { value: 'mercadopago', label: 'MercadoPago', desc: 'Tarjeta, efectivo, Nequi, Daviplata' },
                  ].map((pm) => (
                    <label key={pm.value} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${paymentMethod === pm.value ? 'border-brand-primary bg-brand-cream/50' : 'border-brand-primary/10 hover:border-brand-primary/30'}`}>
                      <input type="radio" name="payment" value={pm.value} checked={paymentMethod === pm.value as typeof paymentMethod} onChange={() => setPaymentMethod(pm.value as typeof paymentMethod)} className="accent-brand-primary" />
                      <div>
                        <p className="font-brand font-semibold text-brand-primary">{pm.label}</p>
                        <p className="font-brand text-xs text-brand-primary/50">{pm.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="bg-brand-yellow/20 rounded-xl p-4 mb-6">
                  <p className="font-brand text-sm text-brand-primary/70">
                    💡 El widget de {paymentMethod === 'wompi' ? 'Wompi' : 'MercadoPago'} se cargará al confirmar. Datos protegidos con SSL.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(2)} className="flex-1 border border-brand-primary/20 text-brand-primary rounded-full py-3 font-brand font-medium hover:border-brand-primary transition-colors">← Atrás</button>
                  <button onClick={handleConfirm} disabled={loading} className="flex-1 bg-brand-primary text-brand-cream rounded-full py-3 font-brand font-medium hover:bg-brand-dark transition-colors disabled:opacity-50">
                    {loading ? 'Procesando...' : 'Confirmar pedido'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Resumen lateral */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-24 space-y-4">
              <h3 className="font-brand font-semibold text-brand-primary">Resumen</h3>

              {/* Items */}
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.variantId} className="flex gap-3 text-sm font-brand">
                    <div className="w-12 h-12 rounded-lg bg-brand-cream flex-shrink-0 overflow-hidden">
                      {item.imageUrl
                        ? <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-brand-yellow/30" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-brand-primary truncate">{item.productName}</p>
                      <p className="text-brand-primary/50">{item.variantLabel} × {item.qty}</p>
                    </div>
                    <span className="font-bold text-brand-primary whitespace-nowrap">{fmt(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>

              {/* Cupón */}
              <div className="border-t border-gray-100 pt-4">
                {couponApplied ? (
                  <div className="flex items-center justify-between bg-green-50 rounded-xl px-3 py-2">
                    <div>
                      <p className="font-brand text-xs font-semibold text-green-700">🎟️ {couponApplied}</p>
                      <p className="font-brand text-xs text-green-600">−{fmt(couponDiscount)}</p>
                    </div>
                    <button onClick={removeCoupon} className="font-brand text-xs text-green-600 hover:text-red-500 transition-colors">Quitar</button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <p className="font-brand text-xs font-semibold text-brand-primary">¿Tienes un cupón?</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError('') }}
                        onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                        placeholder="VPS20"
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm uppercase tracking-wider focus:outline-none focus:border-brand-primary"
                      />
                      <button
                        onClick={applyCoupon}
                        disabled={!couponCode.trim() || couponLoading}
                        className="px-4 py-2 bg-brand-primary text-brand-cream rounded-xl font-brand text-sm hover:bg-brand-dark transition-colors disabled:opacity-40"
                      >
                        {couponLoading ? '...' : 'Aplicar'}
                      </button>
                    </div>
                    {couponError && <p className="font-brand text-xs text-red-500">{couponError}</p>}
                  </div>
                )}
              </div>

              {/* Totales */}
              <div className="border-t border-gray-100 pt-3 space-y-2 text-sm font-brand">
                <div className="flex justify-between">
                  <span className="text-brand-primary/60">Subtotal</span>
                  <span className="text-brand-primary">{fmt(sub)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Descuento ({couponApplied})</span>
                    <span>−{fmt(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-brand-primary/60">Envío</span>
                  <span className="text-brand-primary">
                    {isFreeShipping
                      ? <span className="text-green-600">Gratis</span>
                      : ratesLoading
                        ? <span className="text-brand-primary/40">Calculando...</span>
                        : shippingCfg.provider === 'skydropx' && availableRates.length === 0
                          ? <span className="text-brand-primary/50">~{fmt(shippingCfg.fixed_rate)}</span>
                          : fmt(shippingCost)}
                  </span>
                </div>
                {selectedRate && !isFreeShipping && (
                  <p className="text-xs text-brand-primary/40">{selectedRate.carrier_name} · {selectedRate.service_name}</p>
                )}
                <hr className="border-brand-primary/10" />
                <div className="flex justify-between font-bold text-brand-primary text-base">
                  <span>Total</span>
                  <span>{fmt(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
