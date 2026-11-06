import { BookOpen, Check } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { CatalogItem } from '../../sources'

/** Tarjeta de un libro externo (portada remota). */
export function ExploreCard({ item, owned, onOpen, fluid = false }: { item: CatalogItem; owned: boolean; onOpen: () => void; fluid?: boolean }) {
  const [broken, setBroken] = useState(false)
  const { t } = useTranslation()
  return (
    <button onClick={onOpen} className={`group shrink-0 text-center outline-none ${fluid ? 'w-full' : 'w-32 sm:w-40 lg:w-44'}`} title={item.title}>
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-surface shadow-xl shadow-black/40 ring-2 ring-transparent transition-all duration-200 group-hover:-translate-y-1 group-hover:ring-accent group-focus-visible:ring-accent">
        {item.coverUrl && !broken ? (
          <img src={item.coverUrl} alt="" loading="lazy" onError={() => setBroken(true)} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-surface-2 to-bg p-3 text-sm font-semibold">
            <BookOpen className="h-8 w-8 text-accent-2" />
            <span className="line-clamp-4">{item.title}</span>
          </div>
        )}
        {owned && (
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold">
            <Check className="h-3 w-3" /> {t('explore.owned')}
          </span>
        )}
      </div>
      <p className="mt-2.5 line-clamp-2 px-1 text-sm leading-snug">{item.title}</p>
      <p className="mt-0.5 line-clamp-1 text-xs text-muted">{item.authors.join(', ') || t('common.unknownAuthor')}</p>
    </button>
  )
}

export function SkeletonCards({ n = 7 }: { n?: number }) {
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="w-32 shrink-0 sm:w-40 lg:w-44">
          <div className="aspect-[2/3] animate-pulse rounded-lg bg-surface" />
          <div className="mx-auto mt-3 h-3 w-3/4 animate-pulse rounded bg-surface" />
        </div>
      ))}
    </>
  )
}
