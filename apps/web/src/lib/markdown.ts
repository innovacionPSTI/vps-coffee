/**
 * Lightweight Markdown → HTML converter (no external dependencies).
 *
 * Supported syntax:
 *   # h1  ## h2  ### h3
 *   **bold**  *italic*  `code`  [link](url)
 *   - item / * item  (unordered list)
 *   Blank lines separate paragraphs
 *
 * Safe for admin-authored content (not user-generated).
 */

/** Inline formatting: bold, italic, code, links. */
function inline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
}

export function markdownToHtml(md: string): string {
  const lines = md.split('\n')
  const html: string[] = []
  let inList = false

  for (const raw of lines) {
    const line = raw.trimEnd()

    // Headings — el espacio después de # es opcional (## texto o ##texto)
    if (line.startsWith('###')) {
      if (inList) { html.push('</ul>'); inList = false }
      html.push(`<h3>${inline(line.slice(3).replace(/^\s*/, ''))}</h3>`)
      continue
    }
    if (line.startsWith('##')) {
      if (inList) { html.push('</ul>'); inList = false }
      html.push(`<h2>${inline(line.slice(2).replace(/^\s*/, ''))}</h2>`)
      continue
    }
    if (line.startsWith('#')) {
      if (inList) { html.push('</ul>'); inList = false }
      html.push(`<h1>${inline(line.slice(1).replace(/^\s*/, ''))}</h1>`)
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
