import { ChevronRight, Heart } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Book } from '../db'
import { go, useObjectUrl } from '../lib/hooks'

export function Cover({ book, className = '' }: { book: Book; className?: string }) {
  const url = useObjectUrl(book.cover)
  const { t } = useTranslation()
  return (
    <div className={`relative aspect-[2/3] overflow-hidden rounded-lg bg-surface ${className}`}>
      {url && <img src={url} alt={t('book.coverOf', { title: book.title })} className="h-full w-full object-cover" draggable={false} />}
    </div>
  )
}

/** Tarjeta de libro: portada + título centrado (estilo catálogo). */
export function BookCard({ book, fluid = false }: { book: Book; fluid?: boolean }) {
  const { t } = useTranslation()
  return (
    <button
      onClick={() => go(`libro/${book.id}`)}
      className={`group shrink-0 text-center outline-none ${fluid ? 'w-full' : 'w-32 sm:w-40 lg:w-44'}`}
      title={`${book.title} — ${book.author}`}
    >
      <div className="relative rounded-lg ring-2 ring-transparent transition-all duration-200 group-hover:-translate-y-1 group-hover:ring-accent group-focus-visible:ring-accent">
        <Cover book={book} className="shadow-xl shadow-black/40" />
        <span className="absolute left-2 top-2 rounded-md bg-bg/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted backdrop-blur">
          {book.format}
        </span>
        {book.favorite && <Heart className="absolute right-2 top-2 h-4 w-4 fill-accent-2 text-accent-2 drop-shadow" />}
        {book.progress > 0 && book.progress < 0.995 && (
          <div className="absolute inset-x-0 bottom-0 h-1.5 overflow-hidden rounded-b-lg bg-black/50">
            <div className="h-full bg-accent" style={{ width: `${Math.round(book.progress * 100)}%` }} />
          </div>
        )}
      </div>
      <p className="mt-2.5 line-clamp-2 px-1 text-sm leading-snug">{book.title}</p>
      {book.progress > 0 && book.progress < 0.995 ? (
        <p className="mt-0.5 text-xs text-muted">{t('common.pageShort', { page: book.currentPage, total: book.totalPages })}</p>
      ) : (
        <p className="mt-0.5 line-clamp-1 text-xs text-muted">{book.author}</p>
      )}
    </button>
  )
}

/** Fila horizontal con título a la izquierda y "Ver todo" a la derecha. */
export function Row({ title, books, shelfId }: { title: string; books: Book[]; shelfId?: string }) {
  const { t } = useTranslation()
  if (!books.length) return null
  return (
    <section className="mb-9">
      <div className="mb-3 flex items-baseline justify-between px-4 sm:px-8">
        <h2 className="text-lg font-semibold">{title}</h2>
        {shelfId && (
          <button onClick={() => go(`biblioteca/${shelfId}`)} className="flex items-center gap-0.5 text-xs font-medium text-muted hover:text-white">
            {t('common.seeAll')} <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="no-scrollbar flex gap-4 overflow-x-auto px-4 pb-2 pt-1.5 sm:gap-5 sm:px-8">
        {books.map((b) => (
          <BookCard key={b.id} book={b} />
        ))}
      </div>
    </section>
  )
}
