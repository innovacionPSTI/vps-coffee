import { markdownToHtml } from '@/lib/markdown'

interface Props {
  title: string
  content: string | null
  storeName: string
}

export default function LegalPage({ title, content, storeName }: Props) {
  const hasContent = content && content.trim().length > 0

  return (
    <div className="bg-brand-cream min-h-screen pt-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="mb-10">
          <p className="font-brand text-xs text-brand-primary/40 uppercase tracking-widest mb-3">
            {storeName}
          </p>
          <h1 className="font-display text-brand-primary text-4xl">{title}</h1>
        </div>

        {/* Content */}
        {hasContent ? (
          <div
            className="
              font-brand text-brand-primary/80 leading-relaxed
              prose-legal
            "
            dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
          />
        ) : (
          <div className="text-center py-20">
            <p className="font-brand text-brand-primary/30 text-sm">
              Este contenido aún no ha sido configurado.
            </p>
            <p className="font-brand text-brand-primary/20 text-xs mt-2">
              Un administrador puede editarlo desde el panel → Configuración → Contenido legal.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
