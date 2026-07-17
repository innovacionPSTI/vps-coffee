import type { PageSection } from '@vps/database'

interface Props {
  section: PageSection
}

export default function TextSection({ section }: Props) {
  if (!section.title && !section.body) return null

  return (
    <section className="py-24">
      <div className="max-w-4xl mx-auto px-6">
        {section.title && (
          <h2 className="font-display text-brand-primary text-section mb-10">
            {section.title}
          </h2>
        )}
        {section.subtitle && (
          <p className="font-brand text-brand-primary/70 text-xl mb-8 leading-relaxed">
            {section.subtitle}
          </p>
        )}
        {section.body && (
          <div className="space-y-6 font-brand text-brand-primary/70 text-lg leading-relaxed">
            {section.body.split('\n\n').map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
