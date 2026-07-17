/**
 * SectionRenderer
 *
 * Componente de servidor que despacha una page_section al componente
 * visual correcto según su section_type.
 *
 * Tipos soportados:
 *   hero         → HeroSection      (imagen, título, subtítulo, CTA)
 *   text         → TextSection      (título + cuerpo de texto)
 *   cards        → CardsSection     (grid de tarjetas con ítems)
 *   faq          → FaqSection       (acordeón de preguntas/respuestas)
 *   cta          → CtaSection       (llamada a acción centrada)
 *   testimonials → TestimonialsSection (carrusel de testimonios)
 *   whatsapp     → WhatsAppSection  (botón/formulario de WhatsApp)
 */
import type { PageSection, SectionItem } from '@vps/database'

import HeroSection         from './HeroSection'
import TextSection         from './TextSection'
import CardsSection        from './CardsSection'
import FaqSection          from './FaqSection'
import CtaSection          from './CtaSection'
import TestimonialsSection from './TestimonialsSection'
import WhatsAppSection     from './WhatsAppSection'

interface Props {
  section: PageSection & { items: SectionItem[] }
  pageKey: string
  whatsappNumber?: string | null
}

export default function SectionRenderer({ section, pageKey: _pageKey, whatsappNumber }: Props) {
  if (!section.enabled) return null

  switch (section.section_type) {
    case 'hero':
      return <HeroSection section={section} />

    case 'text':
      return <TextSection section={section} />

    case 'cards':
      return <CardsSection section={section} items={section.items} />

    case 'faq':
      return <FaqSection section={section} items={section.items} />

    case 'cta':
      return <CtaSection section={section} />

    case 'testimonials':
      // Los testimonios ahora son section_items — sin fetch adicional
      return <TestimonialsSection section={section} items={section.items} />

    case 'whatsapp':
      return <WhatsAppSection section={section} whatsappNumber={whatsappNumber} />

    default:
      // Tipo desconocido: renderizar como texto plano para no perder contenido
      return <TextSection section={section} />
  }
}
