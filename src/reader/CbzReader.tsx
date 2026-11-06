import type JSZip from 'jszip'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cbzImages } from '../lib/formats'
import { useObjectUrl } from '../lib/hooks'
import type { FormatReaderProps } from './types'

export function CbzReader({ book, onLocate, nav }: FormatReaderProps) {
  const { t } = useTranslation()
  const [images, setImages] = useState<JSZip.JSZipObject[]>()
  const [page, setPage] = useState(Math.max(1, book.currentPage || 1))
  const [blob, setBlob] = useState<Blob>()
  const url = useObjectUrl(blob)

  useEffect(() => {
    cbzImages(book.file).then(setImages)
  }, [book.file])

  const total = images?.length ?? 0
  const goTo = (p: number) => total && setPage(Math.min(total, Math.max(1, p)))
  nav.current = { prev: () => goTo(page - 1), next: () => goTo(page + 1), goTo }

  useEffect(() => {
    if (!images?.[page - 1]) return
    images[page - 1].async('blob').then(setBlob)
    onLocate(page, total, String(page))
  }, [images, page, total, onLocate])

  return (
    <div className="absolute inset-0 flex items-center justify-center pb-2 pt-12">
      {url ? <img src={url} alt={t('reader.pageAlt', { page })} className="max-h-full max-w-full object-contain" /> : <p className="text-zinc-400">{t('common.loading')}</p>}
    </div>
  )
}
