import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist'
import { openPdf } from '../lib/pdf'
import type { FormatReaderProps } from './types'

export function PdfReader({ book, onLocate, nav }: FormatReaderProps) {
  const { t } = useTranslation()
  const [pdf, setPdf] = useState<PDFDocumentProxy>()
  const [page, setPage] = useState(Math.max(1, book.currentPage || 1))
  const [zoom, setZoom] = useState(1)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const box = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let doc: PDFDocumentProxy | undefined
    let cancelled = false
    book.file.arrayBuffer().then(openPdf).then((d) => {
      if (cancelled) return d.loadingTask.destroy()
      doc = d
      setPdf(d)
    })
    return () => {
      cancelled = true
      doc?.loadingTask.destroy()
    }
  }, [book.file])

  useEffect(() => {
    const el = box.current!
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const total = pdf?.numPages ?? 0
  const goTo = (p: number) => total && setPage(Math.min(total, Math.max(1, p)))
  nav.current = { prev: () => goTo(page - 1), next: () => goTo(page + 1), goTo }

  // Guardar progreso al cambiar de página.
  useEffect(() => {
    if (total) onLocate(page, total, String(page))
  }, [page, total, onLocate])

  // Dibujar la página ajustada a la pantalla.
  useEffect(() => {
    if (!pdf || !size.w || !canvas.current) return
    let task: RenderTask | undefined
    let cancelled = false
    pdf.getPage(page).then((p) => {
      if (cancelled) return
      const base = p.getViewport({ scale: 1 })
      const fit = Math.min((size.w - 16) / base.width, (size.h - 16) / base.height) * zoom
      const dpr = window.devicePixelRatio || 1
      const viewport = p.getViewport({ scale: fit * dpr })
      const c = canvas.current!
      c.width = viewport.width
      c.height = viewport.height
      c.style.width = `${viewport.width / dpr}px`
      c.style.height = `${viewport.height / dpr}px`
      task = p.render({ canvas: c, viewport })
      task.promise.catch(() => {})
    })
    return () => {
      cancelled = true
      task?.cancel()
    }
  }, [pdf, page, size, zoom])

  return (
    <div ref={box} className="absolute inset-0 overflow-auto pt-12">
      <div className="flex min-h-full min-w-full items-center justify-center p-2">
        {!pdf && <p className="text-zinc-400">{t('reader.loadingPdf')}</p>}
        <canvas ref={canvas} className="bg-white shadow-2xl" />
      </div>
      <div className="fixed bottom-14 right-4 z-20 flex flex-col gap-1">
        <button onClick={() => setZoom((z) => Math.min(4, z + 0.25))} className="h-9 w-9 rounded-full bg-black/70 text-white" aria-label={t('reader.zoomIn')}>
          +
        </button>
        <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))} className="h-9 w-9 rounded-full bg-black/70 text-white" aria-label={t('reader.zoomOut')}>
          −
        </button>
      </div>
    </div>
  )
}
