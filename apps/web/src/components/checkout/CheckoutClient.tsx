'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCartStore } from '@/store/cart'
import { useUser } from '@stackframe/stack'

type Step = 1 | 2 | 3

interface ContactInfo {
  email: string
}

interface ShippingInfo {
  name: string
  lastname: string
  address: string
  city: string
  department: string
  phone: string
  postal_code: string
}

interface ShippingPublicConfig {
  provider: 'fixed' | 'skydropx'
  fixed_rate: number
  free_shipping_enabled: boolean
  free_shipping_min_amount: number
}

const FALLBACK_SHIPPING_CFG: ShippingPublicConfig = {
  provider: 'fixed',
  fixed_rate: 8000,
  free_shipping_enabled: true,
  free_shipping_min_amount: 100000,
}

export default function CheckoutClient() {
  const { items, subtotal, clearCart } = useCartStore()
  const user = useUser({ or: 'return-null' })
  const [step, setStep] = useState<Step>(1)
  const [contact, setContact] = useState<ContactInfo>({ email: '' })
  const [shipping, setShipping] = useState<ShippingInfo>({
    name: '', lastname: '', address: '', city: '', department: '', phone: '', postal_code: ''
  })
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'wompi' | 'mercadopago'>('wompi')
  const [loading, setLoading] = useState(false)
  const [shippingCfg, setShippingCfg] = useState<ShippingPublicConfig>(FALLBACK_SHIPPING_CFG)
  const [shippingRates, setShippingRates] = useState<{ rate: number; label: string } | null>(null)
  const [ratesLoading, setRatesLoading] = useState(false)

  // Cargar config de envío al montar
  useEffect(() => {
    fetch('/api/shipping/config')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setShippingCfg(data) })
      .catch(() => {})
  }, [])

  // Cuando el proveedor es skydropx y se completa la dirección (paso 2 → 3),
  // llamar a /api/shipping/rates para obtener la tarifa real
  const fetchSkydropxRates = async () => {
    if (shippingCfg.provider !== 'skydropx') return
    setRatesLoading(true)
    try {
      const res = await fetch('/api/shipping/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: {
            city: shipping.city,
            state: shipping.department,
            postal_code: shipping.postal_code,
            country: 'MX',
          },
          parcel: { weight: 1, height: 10, width: 15, length: 20 },
        }),
      })
      if (res.ok) {
        const data = await res.json()
        // Tomar el primer rate disponible
        if (data.rates?.length) {
          const cheapest = data.rates.reduce((a: { total_pricing: number }, b: { total_pricing: number }) =>
            a.total_pricing <= b.total_pricing ? a : b
          )
          setShippingRates({ rate: cheapest.total_pricing, label: cheapest.service_level_name ?? 'Estándar' })
        }
      }
    } catch {
      // Fallback a tarifa fija si Skydropx falla
    } finally {
      setRatesLoading(false)
    }
  }

  // Auto-fill desde el perfil y direcciones guardadas cuando el usuario está logueado
  useEffect(() => {
    if (!user?.primaryEmail || profileLoaded) return

    // Pre-llenar email de inmediato (sin esperar la red)
    setContact({ email: user.primaryEmail })
    setProfileLoaded(true)   // prevenir re-ejecución

    // Intentar pre-llenar dirección con la guardada en customer_addresses
    fetch('/api/account/addresses')
      .then((r) => {
        if (!r.ok) {
          console.warn('[checkout] /api/account/addresses returned', r.status)
          return null
        }
        return r.json()
      })
      .then((data: { addresses?: Array<{
        full_name: string
        phone: string | null
        address: string
        city: string
        department: string | null
        postal_code: string | null
        is_default: boolean
      }> } | null) => {
        if (!data?.addresses?.length) return
        // Usar la predeterminada; si ninguna lo es, usar la primera
        const addr =
          data.addresses.find((a) => a.is_default) ?? data.addresses[0]
        const nameParts = addr.full_name.trim().split(/\s+/)
        const firstname = nameParts[0] ?? ''
        const lastname  = nameParts.slice(1).join(' ')
        setShipping({
          name:        firstname,
          lastname:    lastname,
          phone:       addr.phone       ?? '',
          address:     addr.address,
          city:        addr.city,
          department:  addr.department  ?? '',
          postal_code: addr.postal_code ?? '',
        })
      })
      .catch((err) => console.warn('[checkout] addresses fetch failed', err))
  }, [user, profileLoaded])

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  const sub = subtotal()
  const isFreeShipping = shippingCfg.free_shipping_enabled && sub >= shippingCfg.free_shipping_min_amount
  const shippingCost = isFreeShipping
    ? 0
    : shippingCfg.provider === 'skydropx' && shippingRates
      ? shippingRates.rate
      : shippingCfg.fixed_rate
  const total = sub + shippingCost

  if (items.length === 0) {
    return (
      <div className="bg-brand-cream min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <p className="font-brand text-brand-primary/50 mb-4">Tu carrito está vacío</p>
          <Link href="/tienda" className="font-brand text-sm text-brand-primary underline">
            Volver a la tienda
          </Link>
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
          address: {
            address: shipping.address,
            city: shipping.city,
            department: shipping.department,
            postal_code: shipping.postal_code,
          },
          items: items.map((i) => ({
            variant_id: i.variantId,
            product_name: i.productName,
            variant_label: i.variantLabel,
            qty: i.qty,
            price: i.price,
          })),
          subtotal: subtotal(),
          shipping_cost: shippingCost,
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
            <span className="font-display text-brand-cream text-xs font-bold">VPS</span>
          </div>
          <span className="font-display text-brand-primary text-lg">VPS Coffee</span>
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress */}
        <div className="flex items-center justify-center gap-4 mb-12">
          {([1, 2, 3] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-brand font-bold transition-colors ${step >= s ? 'bg-brand-primary text-brand-cream' : 'bg-brand-primary/10 text-brand-primary/40'}`}>
                {s}
              </div>
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
                <h2 className="font-brand font-semibold text-brand-primary text-xl mb-5">
                  1. Información de contacto
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="font-brand text-sm font-semibold text-brand-primary block mb-1">Email *</label>
                    <input
                      type="email"
                      value={contact.email}
                      onChange={(e) => setContact({ email: e.target.value })}
                      placeholder="tu@correo.com"
                      required
                      className="w-full border border-brand-primary/20 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                  <button
                    onClick={() => contact.email && setStep(2)}
                    disabled={!contact.email}
                    className="w-full bg-brand-primary text-brand-cream rounded-full py-3 font-brand font-medium hover:bg-brand-dark transition-colors disabled:opacity-40"
                  >
                    Continuar al envío →
                  </button>
                </div>
              </div>
            )}

            {/* Paso 2: Envío */}
            {step === 2 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="font-brand font-semibold text-brand-primary text-xl mb-5">
                  2. Dirección de envío
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: 'name', label: 'Nombre', placeholder: 'Juan' },
                      { key: 'lastname', label: 'Apellido', placeholder: 'García' },
                    ].map((f) => (
                      <div key={f.key}>
                        <label className="font-brand text-sm font-semibold text-brand-primary block mb-1">{f.label} *</label>
                        <input
                          type="text"
                          value={shipping[f.key as keyof ShippingInfo]}
                          onChange={(e) => setShipping({ ...shipping, [f.key]: e.target.value })}
                          placeholder={f.placeholder}
                          className="w-full border border-brand-primary/20 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary"
                        />
                      </div>
                    ))}
                  </div>
                  {[
                    { key: 'address', label: 'Dirección', placeholder: 'Calle 123 #45-67, Apto 8' },
                    { key: 'city', label: 'Ciudad', placeholder: 'Medellín' },
                    { key: 'department', label: 'Departamento', placeholder: 'Antioquia' },
                    { key: 'phone', label: 'Teléfono', placeholder: '+57 300 123 4567' },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="font-brand text-sm font-semibold text-brand-primary block mb-1">{f.label} *</label>
                      <input
                        type="text"
                        value={shipping[f.key as keyof ShippingInfo]}
                        onChange={(e) => setShipping({ ...shipping, [f.key]: e.target.value })}
                        placeholder={f.placeholder}
                        className="w-full border border-brand-primary/20 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary"
                      />
                    </div>
                  ))}
                  <div className="flex gap-3">
                    <button onClick={() => setStep(1)} className="flex-1 border border-brand-primary/20 text-brand-primary rounded-full py-3 font-brand font-medium hover:border-brand-primary transition-colors">
                      ← Atrás
                    </button>
                    <button
                      onClick={async () => {
                        const { name, lastname, address, city, department, phone } = shipping
                        if (name && lastname && address && city && department && phone) {
                          // Si el proveedor es Skydropx, calcular tarifas antes de avanzar
                          if (shippingCfg.provider === 'skydropx' && !isFreeShipping) {
                            await fetchSkydropxRates()
                          }
                          setStep(3)
                        }
                      }}
                      disabled={ratesLoading}
                      className="flex-1 bg-brand-primary text-brand-cream rounded-full py-3 font-brand font-medium hover:bg-brand-dark transition-colors disabled:opacity-50"
                    >
                      {ratesLoading ? 'Calculando envío...' : 'Continuar al pago →'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Paso 3: Pago */}
            {step === 3 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="font-brand font-semibold text-brand-primary text-xl mb-5">
                  3. Método de pago
                </h2>
                <div className="space-y-3 mb-6">
                  {[
                    { value: 'wompi', label: 'Wompi', desc: 'Tarjeta débito/crédito, PSE, Bancolombia' },
                    { value: 'mercadopago', label: 'MercadoPago', desc: 'Tarjeta, efectivo, Nequi, Daviplata' },
                  ].map((pm) => (
                    <label
                      key={pm.value}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${paymentMethod === pm.value ? 'border-brand-primary bg-brand-cream/50' : 'border-brand-primary/10 hover:border-brand-primary/30'}`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={pm.value}
                        checked={paymentMethod === pm.value as typeof paymentMethod}
                        onChange={() => setPaymentMethod(pm.value as typeof paymentMethod)}
                        className="accent-brand-primary"
                      />
                      <div>
                        <p className="font-brand font-semibold text-brand-primary">{pm.label}</p>
                        <p className="font-brand text-xs text-brand-primary/50">{pm.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="bg-brand-yellow/20 rounded-xl p-4 mb-6">
                  <p className="font-brand text-sm text-brand-primary/70">
                    💡 El widget de pago de {paymentMethod === 'wompi' ? 'Wompi' : 'MercadoPago'} se cargará
                    al confirmar el pedido. Tus datos están protegidos con encriptación SSL.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(2)} className="flex-1 border border-brand-primary/20 text-brand-primary rounded-full py-3 font-brand font-medium hover:border-brand-primary transition-colors">
                    ← Atrás
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={loading}
                    className="flex-1 bg-brand-primary text-brand-cream rounded-full py-3 font-brand font-medium hover:bg-brand-dark transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Procesando...' : 'Confirmar pedido'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Resumen lateral */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-24">
              <h3 className="font-brand font-semibold text-brand-primary mb-4">Resumen</h3>
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.variantId} className="flex gap-3 text-sm font-brand">
                    <div className="w-12 h-12 rounded-lg bg-brand-cream flex-shrink-0 overflow-hidden">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-brand-yellow/30" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-brand-primary">{item.productName}</p>
                      <p className="text-brand-primary/50">{item.variantLabel} × {item.qty}</p>
                    </div>
                    <span className="font-bold text-brand-primary">{fmt(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>
              <hr className="border-brand-primary/10 mb-3" />
              <div className="space-y-2 text-sm font-brand">
                <div className="flex justify-between">
                  <span className="text-brand-primary/60">Subtotal</span>
                  <span className="text-brand-primary">{fmt(sub)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-primary/60">Envío</span>
                  <span className="text-brand-primary">
                    {isFreeShipping ? (
                      <span className="text-green-600">Gratis</span>
                    ) : ratesLoading ? (
                      <span className="text-brand-primary/40">Calculando...</span>
                    ) : shippingCfg.provider === 'skydropx' && !shippingRates ? (
                      <span className="text-brand-primary/50">
                        ~{fmt(shippingCfg.fixed_rate)}
                        <span className="block text-xs font-normal text-brand-primary/40">Se confirma al ingresar dirección</span>
                      </span>
                    ) : (
                      fmt(shippingCost)
                    )}
                  </span>
                </div>
                {shippingCfg.provider === 'skydropx' && shippingRates && !isFreeShipping && (
                  <p className="text-xs text-brand-primary/40">Servicio: {shippingRates.label}</p>
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
