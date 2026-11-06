import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { db } from '../db'
import { locale } from '../i18n'
import { dayKey, formatDuration, go } from '../lib/hooks'

export function History() {
  const { t } = useTranslation()
  const sessions = useLiveQuery(() => db.sessions.orderBy('startedAt').reverse().toArray(), [])
  const books = useLiveQuery(() => db.books.toArray(), [])
  if (!sessions || !books) return null

  const byId = new Map(books.map((b) => [b.id, b]))

  // Últimos 7 días
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return dayKey(d)
  })
  const perDay = new Map<string, { seconds: number; pages: number }>()
  for (const s of sessions) {
    const k = dayKey(s.startedAt)
    const acc = perDay.get(k) ?? { seconds: 0, pages: 0 }
    acc.seconds += s.seconds
    acc.pages += Math.max(0, s.toPage - s.fromPage)
    perDay.set(k, acc)
  }
  const maxSec = Math.max(60, ...days.map((d) => perDay.get(d)?.seconds ?? 0))

  // Racha: días seguidos (hasta hoy o ayer) con al menos una sesión.
  let streak = 0
  const cursor = new Date()
  if (!perDay.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  while (perDay.has(dayKey(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }

  const totalSeconds = sessions.reduce((s, x) => s + x.seconds, 0)
  const finished = books.filter((b) => b.status === 'terminado').length

  // Agrupar sesiones por día
  const groups = new Map<string, typeof sessions>()
  for (const s of sessions) {
    const k = dayKey(s.startedAt)
    groups.set(k, [...(groups.get(k) ?? []), s])
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pb-8 pt-4 sm:px-10">
      <h1 className="text-3xl font-bold">{t('history.title')}</h1>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label={t('history.streak')} value={t('history.streakValue', { count: streak })} />
        <Stat label={t('history.totalTime')} value={formatDuration(totalSeconds)} />
        <Stat label={t('history.sessions')} value={String(sessions.length)} />
        <Stat label={t('history.finished')} value={String(finished)} />
      </div>

      <section className="mt-8 rounded-2xl border border-line bg-surface p-5">
        <h2 className="mb-4 font-semibold">{t('history.last7')}</h2>
        <div className="flex h-40 items-end gap-2">
          {days.map((d) => {
            const v = perDay.get(d)
            const label = new Date(`${d}T12:00`).toLocaleDateString(locale(), { weekday: 'short' })
            return (
              <div key={d} className="flex flex-1 flex-col items-center gap-1" title={v ? `${formatDuration(v.seconds)} · ${t('history.pagesShort', { count: v.pages })}` : t('history.noReading')}>
                <span className="text-[10px] text-muted">{v ? formatDuration(v.seconds) : ''}</span>
                <div className="w-full rounded-t bg-accent/80" style={{ height: `${((v?.seconds ?? 0) / maxSec) * 100}%`, minHeight: v ? 4 : 0 }} />
                <span className="text-xs capitalize text-muted">{label}</span>
              </div>
            )
          })}
        </div>
      </section>

      <section className="mt-8">
        {!sessions.length && <p className="text-muted">{t('history.empty')}</p>}
        {[...groups].map(([day, list]) => (
          <div key={day} className="mb-6">
            <h3 className="mb-2 text-sm font-semibold text-muted first-letter:uppercase">
              {new Date(`${day}T12:00`).toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' })}
            </h3>
            <ul className="space-y-2">
              {list.map((s) => {
                const b = byId.get(s.bookId)
                return (
                  <li key={s.id}>
                    <button
                      disabled={!b}
                      onClick={() => b && go(`libro/${b.id}`)}
                      className="flex w-full items-center justify-between rounded-xl border border-line bg-surface px-4 py-3 text-left hover:bg-surface-2"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{b?.title ?? t('history.deletedBook')}</span>
                        <span className="text-xs text-muted">
                          {new Date(s.startedAt).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' })} · {s.fromPage} → {s.toPage}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm text-zinc-300">{formatDuration(s.seconds)}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  )
}
