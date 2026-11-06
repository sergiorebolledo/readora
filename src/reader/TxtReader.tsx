import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { decodeText, paginateText } from '../lib/formats'
import type { FormatReaderProps } from './types'

export function TxtReader({ book, onLocate, nav, fontSize }: FormatReaderProps) {
  const { t } = useTranslation()
  const [pages, setPages] = useState<string[]>()
  const [page, setPage] = useState(Math.max(1, book.currentPage || 1))

  useEffect(() => {
    book.file.arrayBuffer().then((b) => setPages(paginateText(decodeText(b))))
  }, [book.file])

  const total = pages?.length ?? 0
  const goTo = (p: number) => total && setPage(Math.min(total, Math.max(1, p)))
  nav.current = { prev: () => goTo(page - 1), next: () => goTo(page + 1), goTo }

  useEffect(() => {
    if (total) onLocate(page, total, String(page))
    window.scrollTo(0, 0)
  }, [page, total, onLocate])

  return (
    <div className="absolute inset-0 overflow-y-auto px-6 pb-8 pt-16">
      <article
        className="mx-auto max-w-2xl whitespace-pre-wrap font-serif leading-relaxed"
        style={{ fontSize: `${(fontSize / 100) * 1.15}rem` }}
      >
        {pages ? pages[page - 1] : t('common.loading')}
      </article>
    </div>
  )
}
