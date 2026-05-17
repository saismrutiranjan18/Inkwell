import type { Book, Chapter } from '@/types'

export async function exportBookAsPDF(book: Book, chapters: Chapter[]) {
  const theme = book.cover_theme ?? { bg: '#1a1208', text: '#c9a84c', accent: 'rgba(201,168,76,0.6)' }
  const filledChapters = chapters.filter(ch => ch.content_text?.trim())

  const coverPage = `
    <div class="page cover-page" style="background:${theme.bg};color:${theme.text};">
      <div class="cover-inner">
        <div class="ornament">${book.cover_ornament ?? '✦'}</div>
        <div class="deco-line" style="border-color:${theme.accent}"></div>
        <h1 class="cover-title">${esc(book.title)}</h1>
        ${book.cover_subtitle ? `<p class="cover-subtitle">${esc(book.cover_subtitle)}</p>` : ''}
        <div class="deco-line" style="border-color:${theme.accent}"></div>
        <p class="cover-author">${esc(book.author_name)}</p>
      </div>
    </div>`

  const tocPage = filledChapters.length > 0 ? `
    <div class="page">
      <div class="page-header">${esc(book.title?.toUpperCase())}</div>
      <div class="page-content">
        <h2 class="toc-heading">Contents</h2>
        ${filledChapters.map((ch, i) => `
          <div class="toc-row">
            <span class="toc-title">${esc(ch.title)}</span>
            <span class="toc-dots"></span>
            <span class="toc-page">${i * 14 + 1}</span>
          </div>`).join('')}
      </div>
      <div class="page-footer"></div>
    </div>` : ''

  const chapterPages = filledChapters.map((ch, i) => {
    const paras = (ch.content_text ?? '').split('\n').map(p => p.trim()).filter(Boolean)
    return `
      <div class="page">
        <div class="page-header"><span>${esc(book.title?.toUpperCase())}</span><span>${esc(ch.title?.toUpperCase())}</span></div>
        <div class="page-content">
          <p class="chapter-label">Chapter ${i + 1}</p>
          <h2 class="chapter-heading">${esc(ch.title)}</h2>
          ${paras.map((p, pi) => p === '* * *'
            ? `<p class="scene-break">* * *</p>`
            : `<p class="para ${pi === 0 ? 'drop-cap' : ''}">${esc(p)}</p>`).join('')}
        </div>
        <div class="page-footer">${i * 14 + 1}</div>
      </div>`
  }).join('')

  const html = `<!DOCTYPE html><html><head>
    <meta charset="UTF-8"><title>${esc(book.title)}</title>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Lora:ital,wght@0,400;1,400&display=swap" rel="stylesheet">
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { background: #e8e0d0; font-family: 'Lora', serif; }
      .page { width: 148mm; min-height: 210mm; background: white; margin: 12mm auto; display: flex; flex-direction: column; page-break-after: always; }
      .cover-page { align-items: center; justify-content: center; }
      .cover-inner { text-align: center; padding: 20mm; width: 100%; }
      .ornament { font-size: 2.5rem; margin-bottom: 12px; opacity: 0.85; }
      .deco-line { width: 40px; border-top: 1px solid; margin: 12px auto; opacity: 0.5; }
      .cover-title { font-family: 'Playfair Display', serif; font-size: 2.2rem; font-weight: 700; line-height: 1.2; margin-bottom: 8px; }
      .cover-subtitle { font-size: 0.7rem; letter-spacing: 0.2em; text-transform: uppercase; opacity: 0.65; margin-bottom: 20px; }
      .cover-author { font-style: italic; font-size: 1rem; opacity: 0.8; }
      .page-header { padding: 8mm 12mm 4mm; border-bottom: 0.5px solid #e0d8cc; font-size: 7pt; letter-spacing: 0.15em; text-transform: uppercase; color: #aaa; display: flex; justify-content: space-between; }
      .page-footer { padding: 4mm 12mm 8mm; border-top: 0.5px solid #e0d8cc; font-size: 7pt; text-align: center; color: #bbb; }
      .page-content { flex: 1; padding: 8mm 14mm; }
      .toc-heading { font-family: 'Playfair Display', serif; font-size: 1.4rem; text-align: center; margin-bottom: 20px; color: #1a1208; }
      .toc-row { display: flex; align-items: baseline; margin-bottom: 10px; font-size: 0.8rem; }
      .toc-title { font-style: italic; color: #2a2010; }
      .toc-dots { flex: 1; border-bottom: 1px dotted #ccc; margin: 0 6px; height: 1em; }
      .toc-page { color: #999; }
      .chapter-label { font-size: 7pt; letter-spacing: 0.25em; text-transform: uppercase; color: #bbb; text-align: center; margin-bottom: 4px; }
      .chapter-heading { font-family: 'Playfair Display', serif; font-size: 1.5rem; text-align: center; color: #1a1208; margin-bottom: 20px; }
      .para { font-size: 9.5pt; line-height: 1.85; color: #2a2010; text-align: justify; margin-bottom: 0.7em; hyphens: auto; }
      .drop-cap::first-letter { font-family: 'Playfair Display', serif; font-size: 3.5em; font-weight: 700; float: left; line-height: 0.72; margin-right: 6px; margin-top: 6px; color: #8b3a2a; }
      .scene-break { text-align: center; color: #bbb; letter-spacing: 0.5em; margin: 14px 0; }
      @media print { body { background: white; } .page { margin: 0; box-shadow: none; } }
    </style>
  </head><body>
    ${coverPage}${tocPage}${chapterPages}
    <script>window.onload = function() { window.print() }<\/script>
  </body></html>`

  const w = window.open('', '_blank', 'width=900,height=700')
  if (!w) { alert('Please allow popups to export PDF.'); return }
  w.document.write(html)
  w.document.close()
}

function esc(s: string | null | undefined) {
  return (s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}