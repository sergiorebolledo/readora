import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, ChevronRight, Puzzle, RotateCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { db } from '../../db'
import { track } from '../../lib/analytics'
import { go } from '../../lib/hooks'
import { LANGS, getSource, useEnabledSources, useExploreLang, type CatalogItem, type Lang, type Source } from '../../sources'
import { ExploreCard, SkeletonCards } from './ExploreCard'
import { ItemDetail } from './ItemDetail'
import { useCatalog, usePaged } from './useCatalog'

/** Cuántas filas de catálogo se muestran por fuente en la portada de Explorar. */
const ROWS_PER_SOURCE = 4

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

/** Libros ya descargados (para marcarlos como "Tuyo"). */
function useOwnedKeys() {
  const books = useLiveQuery(() => db.books.toArray(), [])
  return new Set((books ?? []).filter((b) => b.origin).map((b) => `${b.origin!.sourceId}:${b.origin!.itemId}`))
}

export function Explore({ sourceId, catalogId, search }: { sourceId?: string; catalogId?: string; search: string }) {
  const { sources } = useEnabledSources()
  const [lang, setLang] = useExploreLang()
  const [selected, setSelected] = useState<CatalogItem | null>(null)
  const owned = useOwnedKeys()
  const { t } = useTranslation()
  const catName = (id: string) => t(`catalog.${id}`)
  const query = useDebounced(search.trim(), 500)
  useEffect(() => {
    if (query) track('explore_searched', { language: lang })
  }, [query, lang])

  const source = getSource(sourceId)
  const catalog = source?.catalogs.find((c) => c.id === catalogId)
  const open = (item: CatalogItem) => setSelected(item)
  const isOwned = (i: CatalogItem) => owned.has(`${i.sourceId}:${i.id}`)

  let body
  if (source && catalog) {
    body = <CatalogGrid source={source} catalogId={catalog.id} title={catName(catalog.id)} lang={lang} onOpen={open} isOwned={isOwned} />
  } else if (!sources.length) {
    body = (
      <div className="py-20 text-center text-muted">
        <p>{t('explore.noSources')}</p>
        <button onClick={() => go('fuentes')} className="mt-4 rounded-full bg-accent px-5 py-2 font-semibold text-white">
          {t('explore.enableSources')}
        </button>
      </div>
    )
  } else if (query) {
    body = sources.map((s) => (
      <SourceRow
        key={`${s.id}-q`}
        cacheKey={`${s.id}|search|${query}|${lang}`}
        title={t('explore.resultsIn', { source: s.name })}
        load={() => s.search(query, lang)}
        onOpen={open}
        isOwned={isOwned}
        emptyText={t('explore.noResultsIn', { source: s.name })}
      />
    ))
  } else {
    body = sources.map((s) => (
      <div key={s.id} className="mb-4">
        <h2 className="mb-4 px-4 text-xs font-semibold uppercase tracking-widest text-accent-2 sm:px-8">{s.name}</h2>
        {s.catalogs.slice(0, ROWS_PER_SOURCE).map((c) => (
          <SourceRow
            key={c.id}
            cacheKey={`${s.id}|${c.id}|${lang}`}
            title={catName(c.id)}
            load={() => s.getCatalog(c.id, lang)}
            onOpen={open}
            isOwned={isOwned}
            seeAll={`explorar/${s.id}/${c.id}`}
          />
        ))}
        {s.catalogs.length > ROWS_PER_SOURCE && (
          <div className="no-scrollbar -mt-4 mb-8 flex gap-2 overflow-x-auto px-4 sm:px-8">
            {s.catalogs.slice(ROWS_PER_SOURCE).map((c) => (
              <button key={c.id} onClick={() => go(`explorar/${s.id}/${c.id}`)} className="shrink-0 rounded-full bg-surface px-4 py-1.5 text-sm text-muted hover:bg-surface-2 hover:text-white">
                {catName(c.id)}
              </button>
            ))}
          </div>
        )}
      </div>
    ))
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3 px-4 sm:px-8">
        {source && catalog ? (
          <button onClick={() => go('explorar')} className="flex items-center gap-1 text-sm text-muted hover:text-white">
            <ChevronLeft className="h-4 w-4" /> {t('explore.title')}
          </button>
        ) : (
          <div>
            <h1 className="text-2xl font-bold">{t('explore.title')}</h1>
            <p className="text-sm text-muted">{t('explore.subtitle')}</p>
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            aria-label={t('explore.language')}
            className="rounded-full border border-line bg-surface px-4 py-2 text-sm outline-none"
          >
            {LANGS.map((l) => (
              <option key={l} value={l}>
                {t(`bookLangs.${l}`)}
              </option>
            ))}
          </select>
          <button onClick={() => go('fuentes')} className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-2 text-sm hover:bg-surface-2">
            <Puzzle className="h-4 w-4" /> {t('nav.sources')}
          </button>
        </div>
      </div>

      {body}

      {selected && <ItemDetail item={selected} lang={lang} onClose={() => setSelected(null)} />}
    </div>
  )
}

interface RowProps {
  cacheKey: string
  title: string
  load: () => ReturnType<Source['search']>
  onOpen: (i: CatalogItem) => void
  isOwned: (i: CatalogItem) => boolean
  seeAll?: string
  /** Si se indica, se muestra cuando no hay resultados (en vez de ocultar la fila). */
  emptyText?: string
}

function SourceRow({ cacheKey, title, load, onOpen, isOwned, seeAll, emptyText }: RowProps) {
  const { t } = useTranslation()
  const { page, error, loading, retry } = useCatalog(cacheKey, load)
  if (page && !page.items.length) {
    if (!emptyText) return null
    return (
      <section className="mb-9 px-4 sm:px-8">
        <h3 className="mb-2 text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted">{emptyText}</p>
      </section>
    )
  }
  return (
    <section className="mb-9">
      <div className="mb-3 flex items-baseline justify-between px-4 sm:px-8">
        <h3 className="text-lg font-semibold">{title}</h3>
        {seeAll && (
          <button onClick={() => go(seeAll)} className="flex items-center gap-0.5 text-xs font-medium text-muted hover:text-white">
            {t('common.seeAll')} <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="no-scrollbar flex gap-4 overflow-x-auto px-4 pb-2 pt-1.5 sm:gap-5 sm:px-8">
        {loading && <SkeletonCards />}
        {error && <ErrorBox message={error} onRetry={retry} />}
        {page?.items.map((i) => <ExploreCard key={i.id} item={i} owned={isOwned(i)} onOpen={() => onOpen(i)} />)}
      </div>
    </section>
  )
}

function CatalogGrid({ source, catalogId, title, lang, onOpen, isOwned }: { source: Source; catalogId: string; title: string; lang: Lang; onOpen: (i: CatalogItem) => void; isOwned: (i: CatalogItem) => boolean }) {
  const { t } = useTranslation()
  const { items, loading, error, hasMore, loadMore, retry } = usePaged(`${source.id}|${catalogId}|${lang}|grid`, (cursor) => source.getCatalog(catalogId, lang, cursor))
  return (
    <div className="px-4 sm:px-8">
      <p className="text-xs font-semibold uppercase tracking-widest text-accent-2">{source.name}</p>
      <h1 className="mb-6 text-2xl font-bold">{title}</h1>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-x-4 gap-y-7 sm:grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] sm:gap-x-5">
        {items.map((i) => (
          <ExploreCard key={i.id} item={i} owned={isOwned(i)} onOpen={() => onOpen(i)} fluid />
        ))}
      </div>
      {error && <ErrorBox message={error} onRetry={retry} />}
      <div className="mt-8 flex justify-center">
        {loading ? (
          <span className="text-sm text-muted">{t('common.loading')}</span>
        ) : (
          hasMore && (
            <button onClick={loadMore} className="rounded-full border border-line bg-surface px-6 py-2 text-sm hover:bg-surface-2">
              {t('common.loadMore')}
            </button>
          )
        )}
      </div>
    </div>
  )
}

function ErrorBox({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted">
      {t('explore.loadError', { message })}
      <button onClick={onRetry} className="flex items-center gap-1 text-white hover:text-accent-2">
        <RotateCw className="h-4 w-4" /> {t('common.retry')}
      </button>
    </div>
  )
}
