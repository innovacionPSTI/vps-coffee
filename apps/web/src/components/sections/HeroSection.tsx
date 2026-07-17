import Link from 'next/link'
import type { PageSection } from '@vps/database'

interface Props {
  section: PageSection
}

export default function HeroSection({ section }: Props) {
  return (
    <section className="relative h-[80vh] min-h-[500px] flex items-end overflow-hidden bg-brand-primary">
      {section.image_url && (
        <img
          src={section.image_url}
          alt={section.title ?? ''}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-brand-text/40" />
      <div className="relative z-10 max-w-7xl mx-auto px-6 pb-20 w-full">
        {section.title && (
          <h1
            className="font-display text-brand-cream leading-none mb-6"
            style={{ fontSize: 'clamp(3rem, 9vw, 7rem)' }}
          >
            {section.title}
          </h1>
        )}
        {section.subtitle && (
          <p className="font-brand text-brand-cream/80 text-xl mb-10 max-w-2xl">
            {section.subtitle}
          </p>
        )}
        {section.body && (
          <p className="font-brand text-brand-cream/70 text-base mb-8 max-w-xl">
            {section.body}
          </p>
        )}
        {section.cta_label && section.cta_url && (
          <Link
            href={section.cta_url}
            className="inline-block bg-brand-cream text-brand-primary rounded-full px-8 py-4 font-brand font-medium text-lg hover:bg-white transition-colors"
          >
            {section.cta_label}
          </Link>
        )}
      </div>
    </section>
  )
}
