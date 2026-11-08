import { useLiveQuery } from 'dexie-react-hooks'
import { AlarmClock, Heart, Play, Trash2, X } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { db, type BookStatus } from '../db'
import { locale } from '../i18n'
import { formatDuration, go } from '../lib/hooks'
import { Cover } from './BookCard'

const STATUS: BookStatus[] = ['por-leer', 'leyendo', 'terminado']

export function BookDetail({ id }: { id: string }) {
  const { t } = useTranslation()
  const book = useLiveQuery(() => db.books.get(id), [id])
  const sessions = useLiveQuery(() => db.sessions.where('bookId').equals(id).reverse().sortBy('startedAt'), [id])
  const close = () => history.length > 1 ? history.back() : go('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (book === undefined) return null
  const totalSeconds = (sessions ?? []).reduce((s, x) => s + x.seconds, 0)

  async function remove() {
    if (!book || !confirm(t('book.confirmRemove', { title: book.title }))) return
    await db.transaction('rw', db.books, db.sessions, db.reminders, async () => {
      await db.books.delete(book.id)
      await db.sessions.where('bookId').equals(book.id).delete()
      await db.reminders.filter((r) => r.bookId === book.id).delete()
    })
    go('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:p-10" onClick={close}>
      <div role="dialog" aria-label={book.title} className="relative w-full max-w-3xl rounded-2xl border border-line bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={close} className="absolute right-3 top-3 z-10 rounded-full bg-bg/60 p-2 hover:bg-bg" aria-label={t('common.close')}>
          <X className="h-4 w-4" />
        </button>
        <div className="flex flex-col gap-6 p-6 sm:flex-row">
          <Cover book={book} className="mx-auto w-44 shrink-0 self-start shadow-xl sm:mx-0" />
          <div className="min-w-0 flex-1">
            <h2 className="pr-8 text-2xl font-bold">{book.title}</h2>
            <p className="text-muted">{book.author}</p>

            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-surface-2 px-2.5 py-1 uppercase">{book.format}</span>
              {book.totalPages > 0 && <span className="rounded-full bg-surface-2 px-2.5 py-1">{t('common.pages', { count: book.totalPages })}</span>}
              <span className="rounded-full bg-surface-2 px-2.5 py-1">{(book.fileSize / 1024 / 1024).toFixed(1)} MB</span>
              <span className="rounded-full bg-surface-2 px-2.5 py-1">{t('common.added', { date: new Date(book.addedAt).toLocaleDateString(locale()) })}</span>
            </div>

            {book.description && <p className="mt-4 line-clamp-6 text-sm leading-relaxed text-zinc-300">{book.description}</p>}

            {book.progress > 0 && (
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-sm text-zinc-300">
                  <span>{t('common.pageOf', { page: book.currentPage, total: book.totalPages })}</span>
                  <span>{Math.round(book.progress * 100)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${book.progress * 100}%` }} />
                </div>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button onClick={() => go(`leer/${book.id}`, { replace: true })} className="flex items-center gap-2 rounded-full bg-white px-6 py-2.5 font-semibold text-black hover:bg-zinc-200">
                <Play className="h-4 w-4 fill-black" />
                {book.progress > 0 ? t('book.continueAt', { page: book.currentPage }) : t('book.start')}
              </button>
              <button
                onClick={() => db.books.update(book.id, { favorite: !book.favorite })}
                aria-pressed={book.favorite}
                className="flex items-center gap-2 rounded-full border border-line bg-surface-2 px-4 py-2.5 text-sm hover:bg-surface-2/70"
              >
                <Heart className={`h-4 w-4 ${book.favorite ? 'fill-accent-2 text-accent-2' : ''}`} />
                {t('book.favorite')}
              </button>
              <select
                value={book.status}
                onChange={(e) => db.books.update(book.id, { status: e.target.value as BookStatus })}
                className="rounded-full border border-line bg-surface-2 px-4 py-2.5 text-sm"
                aria-label={t('book.statusLabel')}
              >
                {STATUS.map((s) => (
                  <option key={s} value={s}>
                    {t(`status.${s}`)}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-6">
              <h3 className="mb-2 font-semibold">{t('book.historyTitle')}</h3>
              {!sessions?.length ? (
                <p className="text-sm text-muted/80">{t('book.neverOpened')}</p>
              ) : (
                <>
                  <p className="mb-2 text-sm text-muted">{t('book.sessionsSummary', { count: sessions.length, time: formatDuration(totalSeconds) })}</p>
                  <ul className="max-h-48 space-y-1 overflow-y-auto text-sm">
                    {sessions.slice(0, 30).map((s) => (
                      <li key={s.id} className="flex justify-between gap-3 rounded-lg bg-surface-2/60 px-3 py-1.5">
                        <span>{new Date(s.startedAt).toLocaleString(locale(), { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        <span className="text-muted">
                          {s.fromPage} → {s.toPage} · {formatDuration(s.seconds)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-4 text-sm">
              <button onClick={() => go(`recordatorios/${book.id}`)} className="flex items-center gap-1.5 text-zinc-300 hover:text-white">
                <AlarmClock className="h-4 w-4" /> {t('book.createReminder')}
              </button>
              <button onClick={remove} className="flex items-center gap-1.5 text-red-400 hover:text-red-300">
                <Trash2 className="h-4 w-4" /> {t('book.remove')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
