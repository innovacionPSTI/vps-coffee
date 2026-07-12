import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Nosotros',
  description: 'Conoce la historia y valores de nuestra empresa.',
}

const values = [
  { icon: '🫘', title: 'Trazabilidad', desc: 'Conocemos el origen de cada grano: la finca, el agricultor y el proceso de beneficio.' },
  { icon: '🎨', title: 'Artesanía', desc: 'Cada lote se tuesta a mano con atención al detalle y pasión por el perfil sensorial.' },
  { icon: '🤝', title: 'Comunidad', desc: 'Construimos relaciones de largo plazo con productores, baristas y amantes del café.' },
  { icon: '✨', title: 'Excelencia', desc: 'Nos exigimos los más altos estándares en cada etapa: selección, tueste y servicio.' },
]

export default function NosotrosPage() {
  return (
    <div className="bg-brand-cream min-h-screen pt-16">
      {/* Hero */}
      <section className="relative h-[70vh] min-h-96 flex items-center justify-center overflow-hidden bg-brand-primary">
        <div className="absolute inset-0 bg-brand-text/50" />
        <div className="relative z-10 text-center px-6">
          <h1 className="font-display text-brand-cream leading-none mb-6"
              style={{ fontSize: 'clamp(3rem, 10vw, 8rem)' }}>
            Vivir para<br />Servir
          </h1>
          <p className="font-brand text-brand-cream/80 text-xl max-w-xl mx-auto">
            La filosofía que guía nuestra empresa.
          </p>
        </div>
      </section>

      {/* Historia */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="font-display text-brand-primary text-section mb-10">
            Nuestra historia
          </h2>
          <div className="space-y-6 font-brand text-brand-primary/70 text-lg leading-relaxed">
            <p>
              Nuestra empresa nació del compromiso con la excelencia y el cuidado desde el origen hasta el cliente final.
              Somos una tostadora artesanal que trabaja directamente con productores colombianos para garantizar
              la máxima calidad y trazabilidad en cada bolsa.
            </p>
            <p>
              Nuestro nombre, <strong className="text-brand-primary">Vivir Para Servir</strong>, refleja nuestra filosofía:
              cada proceso, desde la selección del café verde hasta el empaque final, está guiado por el servicio
              a quienes confían en nosotros — los productores, nuestros clientes y la comunidad cafetera.
            </p>
            <p>
              Ofrecemos café de especialidad para el consumidor final, servicios de maquila y tueste para empresas
              y emprendedores, y asesorías profesionales para quienes quieren llevar su propuesta de café al siguiente nivel.
            </p>
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className="py-24 bg-brand-cream-warm">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-display text-brand-primary text-section text-center mb-14">
            Nuestros valores
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v) => (
              <div key={v.title} className="bg-white rounded-3xl p-8 shadow-card text-center">
                <div className="text-5xl mb-4">{v.icon}</div>
                <h3 className="font-brand font-semibold text-brand-primary text-lg mb-3">{v.title}</h3>
                <p className="font-brand text-brand-primary/60 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center bg-brand-cream">
        <h2 className="font-display text-brand-primary text-section mb-6">¿Listo para descubrir el café VPS?</h2>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/tienda" className="bg-brand-primary text-brand-cream rounded-full px-8 py-3 font-brand font-medium hover:bg-brand-dark transition-colors">
            Ver nuestra tienda
          </Link>
          <Link href="/maquila" className="border border-brand-primary text-brand-primary rounded-full px-8 py-3 font-brand font-medium hover:bg-brand-primary hover:text-brand-cream transition-colors">
            Servicios de maquila
          </Link>
        </div>
      </section>
    </div>
  )
}
