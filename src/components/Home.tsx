import { useLiveQuery } from 'dexie-react-hooks'
import { BookOpen, Compass } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { db } from '../db'
import { go } from '../lib/hooks'
import { SHELVES, matchesSearch, sortBooks } from '../lib/shelves'
import { BookCard, Row } from './BookCard'
import { ImportButton, type Importer } from './Importer'

/** Filas que se muestran en el Inicio (en este orden). */
const HOME_ROWS = ['leyendo', 'recientes', 'favoritos', 'por-leer', 'terminados', 'pdf', 'epub', 'comics']

export function Home({ search, importer }: { search: string; importer: Importer }) {
  const books = useLiveQuery(() => db.books.toArray(), [])
  const { t } = useTranslation()
  if (!books) return null

  if (!books.length) return <EmptyState onFiles={importer.importFiles} />

  if (search.trim()) {
    const results = sortBooks(books.filter((b) => matchesSearch(b, search)), 'titulo')
    return (
      <div className="px-4 sm:px-8">
        <h2 className="mb-5 text-lg font-semibold">
          {t('home.resultsFor', { query: search })} <span className="text-muted">({results.length})</span>
        </h2>
        {results.length ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-x-4 gap-y-6 sm:grid-cols-[repeat(auto-fill,minmax(10rem,1fr))]">
            {results.map((b) => (
              <BookCard key={b.id} book={b} fluid />
            ))}
          </div>
        ) : (
          <p className="text-muted">{t('home.noResults')}</p>
        )}
      </div>
    )
  }

  return (
    <>
      {HOME_ROWS.map((id) => {
        const shelf = SHELVES.find((s) => s.id === id)!
        const list = sortBooks(books.filter(shelf.filter), shelf.sort).slice(0, 20)
        return <Row key={id} title={t(`shelf.${id}`)} books={list} shelfId={id} />
      })}
    </>
  )
}

function EmptyState({ onFiles }: { onFiles: (f: FileList) => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-accent/20 text-accent-2">
        <BookOpen className="h-10 w-10" />
      </div>
      <h1 className="text-3xl font-bold">{t('home.emptyTitle')}</h1>
      <p className="mt-3 max-w-md text-muted">{t('home.emptyText')}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <ImportButton onFiles={onFiles} big />
        <button onClick={() => go('explorar')} className="flex items-center gap-2 rounded-full border border-line bg-surface px-6 py-3 text-lg font-semibold hover:bg-surface-2">
          <Compass className="h-5 w-5" /> {t('home.goExplore')}
        </button>
      </div>
    </div>
  )
}
