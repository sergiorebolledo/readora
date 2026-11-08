import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { db } from '../db'
import { go } from '../lib/hooks'
import { SHELVES, SORTS, matchesSearch, sortBooks, type SortKey } from '../lib/shelves'
import { BookCard } from './BookCard'

/** Página "Biblioteca": todos los libros en cuadrícula con filtros y orden (destino de "Ver todo"). */
export function LibraryPage({ shelfId, search }: { shelfId?: string; search: string }) {
  const books = useLiveQuery(() => db.books.toArray(), [])
  const { t } = useTranslation()
  const shelf = SHELVES.find((s) => s.id === shelfId) ?? SHELVES[0]
  const [sortOverride, setSortOverride] = useState<SortKey>()
  const sort = sortOverride ?? shelf.sort

  if (!books) return null
  const list = sortBooks(books.filter((b) => shelf.filter(b) && matchesSearch(b, search)), sort)

  return (
    <div className="px-4 sm:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">
          {shelf.id === 'todos' ? t('library.title') : t(`shelf.${shelf.id}`)} <span className="text-base font-normal text-muted">({list.length})</span>
        </h1>
        <select
          value={sort}
          onChange={(e) => setSortOverride(e.target.value as SortKey)}
          aria-label={t('sort.label', { name: '' })}
          className="rounded-full border border-line bg-surface px-4 py-2 text-sm outline-none"
        >
          {SORTS.map((s) => (
            <option key={s.id} value={s.id}>
              {t('sort.label', { name: t(`sort.${s.id}`) })}
            </option>
          ))}
        </select>
      </div>

      <div className="no-scrollbar -mx-4 mb-7 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {SHELVES.filter((s) => s.id !== 'recientes').map((s) => (
          <button
            key={s.id}
            onClick={() => {
              setSortOverride(undefined)
              go(s.id === 'todos' ? 'biblioteca' : `biblioteca/${s.id}`)
            }}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm transition-colors ${
              s.id === shelf.id ? 'bg-accent font-semibold text-white' : 'bg-surface text-muted hover:bg-surface-2 hover:text-white'
            }`}
          >
            {s.id === 'leyendo' ? t('shelf.leyendoChip') : t(`shelf.${s.id}`)}
          </button>
        ))}
      </div>

      {list.length ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-x-4 gap-y-7 sm:grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] sm:gap-x-5">
          {list.map((b) => (
            <BookCard key={b.id} book={b} fluid />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-muted">{t('library.empty')}</p>
          {!books.length && (
            <button onClick={() => go('explorar')} className="rounded-full bg-accent px-5 py-2 text-sm font-semibold shadow-lg shadow-accent/30 hover:bg-accent-2">
              {t('home.goExplore')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
