import Link from 'next/link'
import type { PageSection } from '@vps/database'

interface Props {
  section: PageSection
}

export default function CtaSection({ section }: Props) {
  return (
    <section className="py-24 bg-brand-cream text-center">
      {section.title && (
        <h2 className="font-display text-brand-primary text-section mb-6 px-6">
          {section.title}
        </h2>
      )}
      {section.body && (
        <p className="font-brand text-brand-primary/60 mb-10 max-w-xl mx-auto px-6">
          {section.body}
        </p>
      )}
      <div className="flex gap-4 justify-center flex-wrap px-6">
        {section.cta_label && section.cta_url && (
          <Link
            href={section.cta_url}
            className="bg-brand-primary text-brand-cream rounded-full px-8 py-3 font-brand font-medium hover:bg-brand-dark transition-colors"
          >
            {section.cta_label}
          </Link>
        )}
        {section.subtitle && (
          <p className="w-full font-brand text-brand-primary/50 text-sm mt-2">
            {section.subtitle}
          </p>
        )}
      </div>
    </section>
  )
}
