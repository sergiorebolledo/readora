import ePub, { type Book as EpubBook, type Contents, type Rendition } from 'epubjs'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { HIGHLIGHT_COLORS, THEMES, type FormatReaderProps } from './types'

/** Caracteres por "página" usados para calcular la paginación del EPUB. */
const CHARS_PER_PAGE = 1200

export function EpubReader({ book, onLocate, nav, theme, fontSize, highlights, onSelect, onHighlightClick }: FormatReaderProps) {
  const { t } = useTranslation()
  const host = useRef<HTMLDivElement>(null)
  const rendition = useRef<Rendition>(null)
  const [ready, setReady] = useState(false)
  // Las funciones de la app cambian en cada render; epub.js guarda las del primero. Se leen siempre las últimas.
  const callbacks = useRef({ onSelect, onHighlightClick, highlights })
  callbacks.current = { onSelect, onHighlightClick, highlights }

  useEffect(() => {
    let epub: EpubBook | undefined
    let cancelled = false
    ;(async () => {
      const buffer = await book.file.arrayBuffer()
      if (cancelled) return
      epub = ePub(buffer)
      const r = epub.renderTo(host.current!, { width: '100%', height: '100%', flow: 'paginated', spread: 'auto', allowScriptedContent: false })
      // Tema: una sola hoja de estilo fija + colores como "override".
      // (Antes se registraba un tema de epub.js por color, pero epub.js no quita la hoja del tema anterior:
      // al volver a un tema ya usado, ganaba el último agregado y el color no cambiaba.)
      r.themes.default({
        // El CSS del libro puede fijar colores propios (p. ej. texto gris oscuro): se fuerzan los del tema para que siempre se lea.
        body: { background: 'transparent !important', color: 'inherit !important' },
        'body *': { color: 'inherit !important', 'background-color': 'transparent !important' },
        a: { color: 'inherit !important' },
      })
      applyTheme(r, theme)
      r.themes.fontSize(`${fontSize}%`)

      // Selección de texto → la app muestra los botones de subrayar y anotar.
      r.on('selected', (cfiRange: string) => {
        const text = r.getRange(cfiRange)?.toString().trim()
        if (text) callbacks.current.onSelect?.({ location: cfiRange, text })
      })
      r.hooks.content.register((contents: Contents) => {
        contents.document.addEventListener('selectionchange', () => {
          if (contents.window.getSelection()?.isCollapsed) callbacks.current.onSelect?.(null)
        })
        // Tocar un subrayado abre su nota. Se comprueba aquí, dentro del libro, porque el aviso de epub.js
        // compara coordenadas del iframe con las de la página y en el WebView de Android no coinciden.
        contents.document.addEventListener('click', (e) => {
          if (!contents.window.getSelection()?.isCollapsed) return
          for (const h of callbacks.current.highlights ?? []) {
            let rects: DOMRectList | undefined
            try {
              rects = r.getRange(h.location)?.getClientRects()
            } catch {
              continue // el subrayado está en otro capítulo
            }
            for (const b of rects ?? []) {
              if (e.clientX >= b.left && e.clientX <= b.right && e.clientY >= b.top && e.clientY <= b.bottom) {
                callbacks.current.onHighlightClick?.(h.id!)
                return
              }
            }
          }
        })
      })

      await r.display(book.location ?? undefined)
      if (cancelled) return
      // Solo se expone al resto de la app cuando ya está listo para pasar páginas.
      rendition.current = r
      setReady(true)

      // Las "páginas" de un EPUB se calculan una vez y se guardan en caché.
      const cacheKey = `estante:locations:${book.id}`
      const cached = localStorage.getItem(cacheKey)
      if (cached) epub.locations.load(cached)
      else {
        await epub.locations.generate(CHARS_PER_PAGE)
        try {
          localStorage.setItem(cacheKey, epub.locations.save())
        } catch {
          /* sin espacio: se recalcula la próxima vez */
        }
      }
      if (cancelled) return

      const report = (cfi: string) => {
        const total = epub!.locations.length()
        const index = epub!.locations.locationFromCfi(cfi) as unknown as number
        onLocate(Math.min(total, Math.max(0, index) + 1), total, cfi)
      }
      const current = r.currentLocation() as unknown as { start?: { cfi: string } }
      if (current?.start?.cfi) report(current.start.cfi)
      r.on('relocated', (loc: { start: { cfi: string } }) => {
        report(loc.start.cfi)
        callbacks.current.onSelect?.(null)
      })
      // Pasar página también con el teclado cuando el foco está dentro del libro.
      r.on('keyup', (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight') r.next()
        if (e.key === 'ArrowLeft') r.prev()
      })
    })()
    return () => {
      cancelled = true
      rendition.current = null
      drawn.current.clear()
      epub?.destroy()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.id])

  useEffect(() => {
    if (rendition.current) applyTheme(rendition.current, theme)
  }, [theme])
  useEffect(() => {
    rendition.current?.themes.fontSize(`${fontSize}%`)
  }, [fontSize])

  // ---- Subrayados: se dibujan los nuevos y se quitan los borrados o cambiados de color. ----
  const drawn = useRef(new Map<number, string>()) // id → "ubicación|color"
  useEffect(() => {
    const r = rendition.current
    if (!r || !ready) return
    const wanted = new Map((highlights ?? []).map((h) => [h.id!, h]))
    for (const [id, key] of drawn.current) {
      const h = wanted.get(id)
      if (!h || `${h.location}|${h.color}` !== key) {
        r.annotations.remove(key.split('|')[0], 'highlight')
        drawn.current.delete(id)
      }
    }
    for (const h of wanted.values()) {
      if (drawn.current.has(h.id!)) continue
      r.annotations.highlight(
        h.location,
        { id: h.id },
        undefined, // el toque se detecta dentro del libro (ver arriba)
        'readora-hl',
        { fill: HIGHLIGHT_COLORS[h.color], 'fill-opacity': '0.4', 'mix-blend-mode': 'normal' },
      )
      drawn.current.set(h.id!, `${h.location}|${h.color}`)
    }
  }, [highlights, ready])

  nav.current = {
    prev: () => rendition.current?.prev(),
    next: () => rendition.current?.next(),
    goTo: (p) => {
      const r = rendition.current
      const cfi = r && (r.book.locations.cfiFromLocation(p - 1) as unknown as string)
      if (cfi) r.display(cfi)
    },
    goToLocation: (cfi) => rendition.current?.display(cfi),
    clearSelection: () => {
      for (const c of (rendition.current?.getContents() ?? []) as unknown as Contents[]) c.window.getSelection()?.removeAllRanges()
    },
  }

  return (
    <div className="absolute inset-0 px-4 pb-2 pt-14 sm:px-16">
      {!ready && <p className="absolute inset-0 flex items-center justify-center opacity-60">{t('reader.loadingEpub')}</p>}
      <div ref={host} className="h-full w-full" />
    </div>
  )
}

function applyTheme(r: Rendition, theme: keyof typeof THEMES) {
  const c = THEMES[theme]
  r.themes.override('background', c.bg, true)
  r.themes.override('color', c.fg, true)
}
