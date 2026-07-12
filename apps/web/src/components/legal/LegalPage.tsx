/**
 * LegalPage — renders Terms or Privacy content stored as Markdown in store_config.
 *
 * Uses a lightweight manual Markdown-to-HTML conversion (no external deps):
 *   ## → h2, ### → h3, **text** → <strong>, *text* → <em>
 *   - item → <ul><li>, blank lines → paragraph breaks
 *
 * dangerouslySetInnerHTML is safe here because the content is admin-authored,
 * not user-generated.
 */

interface Props {
  title: string
  content: string | null
  storeName: string
}

/** Very small Markdown → HTML converter (covers common legal doc formatting). */
function markdownToHtml(md: string): string {
  const lines = md.split('\n')
  const html: string[] = []
  let inList = false

  for (const raw of lines) {
    const line = raw.trimEnd()

    // Headings
    if (line.startsWith('### ')) {
      if (inList) { html.push('</ul>'); inList = false }
      html.push(`<h3>${inline(line.slice(4))}</h3>`)
      continue
    }
    if (line.startsWith('## ')) {
      if (inList) { html.push('</ul>'); inList = false }
      html.push(`<h2>${inline(line.slice(3))}</h2>`)
      continue
    }
    if (line.startsWith('# ')) {
      if (inList) { html.push('</ul>'); inList = false }
      html.push(`<h1>${inline(line.slice(2))}</h1>`)
      continue
    }

    // Unordered list items
    if (line.match(/^[-*] /)) {
      if (!inList) { html.push('<ul>'); inList = true }
      html.push(`<li>${inline(line.slice(2))}</li>`)
      continue
    }

    // Blank line
    if (line.trim() === '') {
      if (inList) { html.push('</ul>'); inList = false }
      continue
    }

    // Paragraph
    if (inList) { html.push('</ul>'); inList = false }
    html.push(`<p>${inline(line)}</p>`)
  }

  if (inList) html.push('</ul>')
  return html.join('\n')
}

/** Inline formatting: bold, italic, inline code, links. */
function inline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
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
