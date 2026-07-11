import type { Metadata } from 'next'
import Link from 'next/link'
import { getWhatsAppURL } from '@/lib/whatsapp'

export const metadata: Metadata = {
  title: 'Asesorías Profesionales',
  description: 'Acompañamiento experto en catación, perfiles de tueste y desarrollo de producto para tu negocio.',
}

const services = [
  { icon: '☕', title: 'Catación profesional', desc: 'Sesiones de catación guiadas para entender el perfil sensorial de tu café.' },
  { icon: '🌡️', title: 'Desarrollo de perfiles', desc: 'Diseño y ajuste de perfiles de tueste para obtener el mejor potencial de tu café verde.' },
  { icon: '🎓', title: 'Formación de baristas', desc: 'Capacitación técnica para baristas en extracción, molienda y servicio de café de especialidad.' },
  { icon: '🏢', title: 'Consultoría de negocio', desc: 'Asesoría integral para cafeterías y tostadurías que quieren mejorar su propuesta de valor.' },
]

export default async function AsesoriasPage() {
  const waUrl = await getWhatsAppURL('asesoria')

  return (
    <div className="bg-brand-cream min-h-screen pt-16">
      {/* Hero */}
      <section className="relative h-[80vh] min-h-[500px] flex items-end overflow-hidden bg-brand-primary">
        <div className="absolute inset-0 bg-brand-text/40" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 pb-20 w-full">
          <h1 className="font-display text-brand-cream leading-none mb-6"
              style={{ fontSize: 'clamp(3rem, 9vw, 7rem)' }}>
            Asesorías<br />Profesionales
          </h1>
          <p className="font-brand text-brand-cream/80 text-xl mb-10 max-w-xl">
            Acompañamiento experto en catación, perfiles de tueste y desarrollo de producto para tu negocio.
          </p>
          <Link
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-[#25D366] text-white rounded-full px-8 py-4 font-brand font-medium text-lg hover:bg-[#1ebe5d] transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            Hablar con un experto
          </Link>
        </div>
      </section>

      {/* Servicios */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-display text-brand-primary text-section text-center mb-14">
            Nuestros servicios
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {services.map((s) => (
              <div key={s.title} className="bg-white rounded-3xl p-8 shadow-card flex gap-6">
                <div className="text-4xl flex-shrink-0">{s.icon}</div>
                <div>
                  <h3 className="font-brand font-semibold text-brand-primary text-lg mb-2">{s.title}</h3>
                  <p className="font-brand text-brand-primary/60 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Formulario de consulta */}
      <section className="py-24 bg-brand-cream-warm">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="font-display text-brand-primary text-section text-center mb-3">
            Consulta inicial
          </h2>
          <p className="font-brand text-brand-primary/60 text-center mb-10">
            Cuéntanos sobre tu proyecto y te contactamos.
          </p>
          <form
            action={waUrl}
            className="bg-white rounded-3xl p-8 shadow-card space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-brand text-sm font-semibold text-brand-primary block mb-1">Nombre</label>
                <input type="text" className="w-full border border-brand-primary/20 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary" placeholder="Tu nombre" />
              </div>
              <div>
                <label className="font-brand text-sm font-semibold text-brand-primary block mb-1">Empresa</label>
                <input type="text" className="w-full border border-brand-primary/20 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary" placeholder="Nombre de tu empresa" />
              </div>
            </div>
            <div>
              <label className="font-brand text-sm font-semibold text-brand-primary block mb-1">¿Cuál es tu necesidad?</label>
              <textarea rows={4} className="w-full border border-brand-primary/20 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary resize-none" placeholder="Cuéntanos sobre tu proyecto..." />
            </div>
            <Link
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-[#25D366] text-white rounded-full py-3 font-brand font-medium hover:bg-[#1ebe5d] transition-colors"
            >
              🟢 Enviar por WhatsApp
            </Link>
          </form>
        </div>
      </section>
    </div>
  )
}
