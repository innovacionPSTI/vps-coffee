import type { PageSection, SectionItem } from '@vps/database'

interface Props {
  section: PageSection
  items: SectionItem[]
}

export default function FaqSection({ section, items }: Props) {
  const enabled = items.filter((i) => i.enabled && i.question)
  if (enabled.length === 0) return null

  return (
    <section className="py-24 bg-brand-cream-warm">
      <div className="max-w-3xl mx-auto px-6">
        {section.title && (
          <h2 className="font-display text-brand-primary text-section text-center mb-4">
            {section.title}
          </h2>
        )}
        {section.subtitle && (
          <p className="font-brand text-brand-primary/60 text-center mb-14">
            {section.subtitle}
          </p>
        )}
        {!section.subtitle && section.title && <div className="mb-14" />}

        <div className="space-y-4">
          {enabled.map((faq) => (
            <details key={faq.id} className="bg-white rounded-2xl shadow-sm group">
              <summary className="flex justify-between items-center p-6 cursor-pointer font-brand font-semibold text-brand-primary list-none">
                {faq.question}
                <svg
                  className="w-5 h-5 flex-shrink-0 transition-transform group-open:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              {faq.answer && (
                <p className="px-6 pb-6 font-brand text-sm text-brand-primary/70 leading-relaxed">
                  {faq.answer}
                </p>
              )}
            </details>
          ))}
        </div>

        {section.cta_label && section.cta_url && (
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
