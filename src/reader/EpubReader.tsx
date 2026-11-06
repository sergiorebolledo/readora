import ePub, { type Book as EpubBook, type Rendition } from 'epubjs'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { THEMES, type FormatReaderProps } from './types'

/** Caracteres por "página" usados para calcular la paginación del EPUB. */
const CHARS_PER_PAGE = 1200

export function EpubReader({ book, onLocate, nav, theme, fontSize }: FormatReaderProps) {
  const { t } = useTranslation()
  const host = useRef<HTMLDivElement>(null)
  const rendition = useRef<Rendition>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let epub: EpubBook | undefined
    let cancelled = false
    ;(async () => {
      const buffer = await book.file.arrayBuffer()
      if (cancelled) return
      epub = ePub(buffer)
      const r = epub.renderTo(host.current!, { width: '100%', height: '100%', flow: 'paginated', spread: 'auto', allowScriptedContent: false })
      for (const [name, c] of Object.entries(THEMES)) {
        r.themes.register(name, { body: { background: `${c.bg} !important`, color: `${c.fg} !important` }, a: { color: 'inherit !important' } })
      }
      r.themes.select(theme)
      r.themes.fontSize(`${fontSize}%`)
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
      r.on('relocated', (loc: { start: { cfi: string } }) => report(loc.start.cfi))
      // Pasar página también con el teclado cuando el foco está dentro del libro.
      r.on('keyup', (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight') r.next()
        if (e.key === 'ArrowLeft') r.prev()
      })
    })()
    return () => {
      cancelled = true
      rendition.current = null
      epub?.destroy()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.id])

  useEffect(() => {
    rendition.current?.themes.select(theme)
  }, [theme])
  useEffect(() => {
    rendition.current?.themes.fontSize(`${fontSize}%`)
  }, [fontSize])

  nav.current = {
    prev: () => rendition.current?.prev(),
    next: () => rendition.current?.next(),
    goTo: (p) => {
      const r = rendition.current
      const cfi = r && (r.book.locations.cfiFromLocation(p - 1) as unknown as string)
      if (cfi) r.display(cfi)
    },
  }

  return (
    <div className="absolute inset-0 px-4 pb-2 pt-14 sm:px-16">
      {!ready && <p className="absolute inset-0 flex items-center justify-center opacity-60">{t('reader.loadingEpub')}</p>}
      <div ref={host} className="h-full w-full" />
    </div>
  )
}
