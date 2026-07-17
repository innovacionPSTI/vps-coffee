import type { PageSection, SectionItem } from '@vps/database'

interface Props {
  section: PageSection
  items: SectionItem[]
}

export default function CardsSection({ section, items }: Props) {
  const enabled = items.filter((i) => i.enabled)
  if (enabled.length === 0 && !section.title) return null

  const cols =
    enabled.length <= 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : enabled.length === 3
      ? 'grid-cols-1 md:grid-cols-3'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'

  return (
    <section className="py-24 bg-brand-cream-warm">
      <div className="max-w-7xl mx-auto px-6">
        {section.title && (
          <h2 className="font-display text-brand-primary text-section text-center mb-4">
            {section.title}
          </h2>
        )}
        {section.subtitle && (
          <p className="font-brand text-brand-primary/60 text-center mb-14 max-w-xl mx-auto">
            {section.subtitle}
          </p>
        )}
        {!section.subtitle && section.title && <div className="mb-14" />}

        {enabled.length > 0 && (
          <div className={`grid ${cols} gap-6`}>
            {enabled.map((item) => (
              <div key={item.id} className="bg-white rounded-3xl p-8 shadow-card flex gap-5">
                {item.icon && (
                  <div className="text-4xl flex-shrink-0">{item.icon}</div>
                )}
                <div>
                  {item.title && (
                    <h3 className="font-brand font-semibold text-brand-primary text-lg mb-2">
                      {item.title}
                    </h3>
                  )}
                  {item.description && (
                    <p className="font-brand text-brand-primary/60 text-sm leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {(section.cta_label && section.cta_url) && (
          <div className="text-center mt-12">
            <a
              href={section.cta_url}
              className="inline-block bg-brand-primary text-brand-cream rounded-full px-8 py-3 font-brand font-medium hover:bg-brand-dark transition-colors"
            >
              {section.cta_label}
            </a>
          </div>
        )}
      </div>
    </section>
  )
}
