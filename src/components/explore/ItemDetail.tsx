import { useLiveQuery } from 'dexie-react-hooks'
import { BookOpen, Download, ExternalLink, Loader2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { db } from '../../db'
import { go } from '../../lib/hooks'
import { importFile } from '../../lib/import'
import { fetchBlob } from '../../lib/net'
import { getSource, type CatalogItem, type Lang } from '../../sources'

/** Ficha de un libro externo con el botón "Agregar a mi biblioteca". */
export function ItemDetail({ item: initial, lang, onClose }: { item: CatalogItem; lang: Lang; onClose: () => void }) {
  const source = getSource(initial.sourceId)!
  const { t } = useTranslation()
  const fmt = (f: string) => t(`explore.formats.${f}`)
  const [item, setItem] = useState(initial)
  const [resolving, setResolving] = useState(!!source.resolve)
  const [state, setState] = useState<{ step: 'idle' | 'downloading' | 'importing' | 'error'; message?: string }>({ step: 'idle' })
  const [note, setNote] = useState<string>()

  const owned = useLiveQuery(
    () => db.books.filter((b) => b.origin?.sourceId === initial.sourceId && b.origin.itemId === initial.id).first(),
    [initial.id],
  )

  // Algunas fuentes necesitan averiguar qué archivo se puede descargar (p. ej. Open Library).
  useEffect(() => {
    if (!source.resolve) return
    let alive = true
    source
      .resolve(initial, lang)
      .then((r) => alive && setItem(r))
      .catch(() => {})
      .finally(() => alive && setResolving(false))
    return () => {
      alive = false
    }
  }, [initial, lang, source])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function add() {
    if (!item.downloads.length) return
    try {
      setState({ step: 'downloading' })
      // Se prueban los archivos en orden: si uno falla en el servidor de la fuente, se usa el siguiente.
      let blob: Blob | undefined
      let download = item.downloads[0]
      let lastError: unknown
      for (const d of item.downloads) {
        try {
          blob = await fetchBlob(d.url)
          download = d
          break
        } catch (e) {
          lastError = e
        }
      }
      if (!blob) throw lastError
      setState({ step: 'importing' })
      const safe = item.title.replace(/[\\/:*?"<>|]+/g, '').slice(0, 80) || 'libro'
      const file = new File([blob], `${safe}.${download.format}`, { type: blob.type })
      const cover = item.coverUrl ? await fetchBlob(item.coverUrl).catch(() => undefined) : undefined
      await importFile(file, {
        title: item.title,
        author: item.authors.join(', ') || undefined,
        description: item.description,
        cover,
        origin: { sourceId: item.sourceId, itemId: item.id },
      })
      if (download.otherLanguage) {
        setNote(t('explore.otherLanguage', { language: download.otherLanguage }))
      }
      setState({ step: 'idle' })
    } catch (e) {
      setState({ step: 'error', message: (e as Error).message })
    }
  }

  const busy = state.step === 'downloading' || state.step === 'importing'

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:p-10" onClick={onClose}>
      <div role="dialog" aria-label={item.title} className="relative w-full max-w-3xl rounded-2xl border border-line bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-3 top-3 rounded-full bg-bg/60 p-2 hover:bg-bg" aria-label={t('common.close')}>
          <X className="h-4 w-4" />
        </button>
        <div className="flex flex-col gap-6 p-6 sm:flex-row">
          <div className="mx-auto w-44 shrink-0 sm:mx-0">
            <div className="aspect-[2/3] overflow-hidden rounded-lg bg-surface-2 shadow-xl">
              {item.coverUrl ? (
                <img src={item.coverUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <BookOpen className="h-10 w-10 text-accent-2" />
                </div>
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent-2">{source.name}</p>
            <h2 className="mt-1 pr-8 text-2xl font-bold">{item.title}</h2>
            <p className="text-muted">{item.authors.join(', ') || t('common.unknownAuthor')}</p>

            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {item.year && <span className="rounded-full bg-surface-2 px-2.5 py-1">{item.year}</span>}
              {item.languages?.slice(0, 3).map((l) => (
                <span key={l} className="rounded-full bg-surface-2 px-2.5 py-1 uppercase">
                  {l}
                </span>
              ))}
              {[...new Set(item.downloads.map((d) => d.format))].map((f) => (
                <span key={f} className="rounded-full bg-surface-2 px-2.5 py-1">
                  {fmt(f)}
                </span>
              ))}
              <span className="rounded-full bg-accent/20 px-2.5 py-1 text-accent-2">{t(`sources.${source.id}.note`)}</span>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              {owned ? (
                <button onClick={() => go(`leer/${owned.id}`)} className="flex items-center gap-2 rounded-full bg-white px-6 py-2.5 font-semibold text-black hover:bg-zinc-200">
                  <BookOpen className="h-4 w-4" /> {t('explore.readNow')}
                </button>
              ) : resolving ? (
                <span className="flex items-center gap-2 text-sm text-muted">
                  <Loader2 className="h-4 w-4 animate-spin" /> {t('explore.findingEdition')}
                </span>
              ) : item.downloads.length ? (
                <button
                  onClick={add}
                  disabled={busy}
                  className="flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 font-semibold shadow-lg shadow-accent/30 hover:bg-accent-2 disabled:opacity-60"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  {state.step === 'downloading' ? t('explore.downloading') : state.step === 'importing' ? t('explore.adding') : t('explore.addToLibrary', { format: fmt(item.downloads[0].format) })}
                </button>
              ) : (
                <span className="text-sm text-muted">{t('explore.noEdition')}</span>
              )}
              {item.infoUrl && (
                <a href={item.infoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-muted hover:text-white">
                  {t('explore.seeOn', { source: source.name })} <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
            {owned && <p className="mt-2 text-sm text-accent-2">{t('explore.inLibrary')}</p>}
            {note && <p className="mt-1 text-sm text-amber-300">{note}</p>}
            {state.step === 'error' && <p className="mt-2 text-sm text-red-400">{t('explore.addError', { message: state.message })}</p>}

            {item.description && <p className="mt-5 text-sm leading-relaxed text-zinc-300">{item.description}</p>}
            {!!item.subjects?.length && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {item.subjects.map((s) => (
                  <span key={s} className="rounded-md border border-line px-2 py-0.5 text-xs text-muted">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
