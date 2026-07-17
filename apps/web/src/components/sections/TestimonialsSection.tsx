import type { PageSection, SectionItem } from '@vps/database'
import TestimonialsCarousel from '@/components/testimonials/TestimonialsCarousel'

interface Props {
  section: PageSection
  items: SectionItem[]
}

export default function TestimonialsSection({ section, items }: Props) {
  if (items.length === 0) return null

  return (
    <section className="py-24 bg-brand-primary overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        {section.title && (
          <h2 className="font-display text-brand-cream text-section text-center mb-14">
            {section.title}
          </h2>
        )}
        <TestimonialsCarousel items={items} />
      </div>
    </section>
  )
}
