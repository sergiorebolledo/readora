import { useLiveQuery } from 'dexie-react-hooks'
import { BellRing, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { db } from '../db'
import { askNotificationPermission, getNotificationPermission, type Permission } from '../lib/reminders'

export function Reminders({ presetBookId }: { presetBookId?: string }) {
  const { t } = useTranslation()
  const dayLetters = t('reminders.dayLetters', { returnObjects: true }) as string[]
  const reminders = useLiveQuery(() => db.reminders.toArray(), [])
  const books = useLiveQuery(() => db.books.orderBy('title').toArray(), [])
  const [time, setTime] = useState('21:00')
  const [days, setDays] = useState([1, 2, 3, 4, 5])
  const [bookId, setBookId] = useState(presetBookId ?? '')
  const [message, setMessage] = useState('')
  const [permission, setPermission] = useState<Permission>('default')

  useEffect(() => {
    getNotificationPermission().then(setPermission)
  }, [])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!days.length) return
    await db.reminders.add({ time, days, message: message.trim(), bookId: bookId || null, enabled: true, lastFired: null })
    setMessage('')
    if (permission === 'default') setPermission(await askNotificationPermission())
  }

  const toggleDay = (d: number) => setDays((ds) => (ds.includes(d) ? ds.filter((x) => x !== d) : [...ds, d].sort()))
  const bookTitle = (id: string | null) => books?.find((b) => b.id === id)?.title

  return (
    <div className="mx-auto max-w-2xl px-4 pb-8 pt-4 sm:px-10">
      <h1 className="text-3xl font-bold">{t('reminders.title')}</h1>
      <p className="mt-2 text-muted">{t('reminders.subtitle')}</p>

      {permission !== 'granted' && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-sm text-amber-200">
          <span>{permission === 'denied' ? t('reminders.blocked') : permission === 'unsupported' ? t('reminders.unsupported') : t('reminders.enablePrompt')}</span>
          {permission === 'default' && (
            <button onClick={async () => setPermission(await askNotificationPermission())} className="shrink-0 rounded-full bg-amber-400 px-4 py-1.5 font-semibold text-black">
              {t('reminders.enable')}
            </button>
          )}
        </div>
      )}

      <form onSubmit={add} className="mt-6 space-y-4 rounded-2xl border border-line bg-surface p-5">
        <div className="flex flex-wrap items-center gap-4">
          <label className="text-sm">
            {t('reminders.time')}
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required className="ml-2 rounded-lg bg-surface-2 px-3 py-1.5" />
          </label>
          <div className="flex gap-1" role="group" aria-label={t('reminders.days')}>
            {dayLetters.map((label, d) => (
              <button
                key={d}
                type="button"
                onClick={() => toggleDay(d)}
                className={`h-9 w-9 rounded-full text-sm transition-colors ${days.includes(d) ? 'bg-accent font-semibold' : 'bg-surface-2 text-muted hover:text-white'}`}
                aria-pressed={days.includes(d)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <label className="block text-sm">
          {t('reminders.book')}
          <select value={bookId} onChange={(e) => setBookId(e.target.value)} className="mt-1 block w-full rounded-lg bg-surface-2 px-3 py-2">
            <option value="">{t('reminders.anyBook')}</option>
            {books?.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          {t('reminders.message')}
          <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t('reminders.messagePlaceholder')} className="mt-1 block w-full rounded-lg bg-surface-2 px-3 py-2" />
        </label>
        <button disabled={!days.length} className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 font-semibold shadow-lg shadow-accent/30 hover:bg-accent-2 disabled:opacity-40">
          <BellRing className="h-4 w-4" /> {t('reminders.save')}
        </button>
      </form>

      <ul className="mt-8 space-y-2">
        {reminders?.map((r) => (
          <li key={r.id} className={`flex items-center gap-4 rounded-2xl border border-line bg-surface px-4 py-3 ${r.enabled ? '' : 'opacity-50'}`}>
            <span className="text-2xl font-bold tabular-nums">{r.time}</span>
            <span className="min-w-0 flex-1 text-sm">
              <span className="block">{r.days.length === 7 ? t('reminders.everyDay') : r.days.map((d) => dayLetters[d]).join(' · ')}</span>
              <span className="block truncate text-muted">
                {bookTitle(r.bookId) ?? t('reminders.anyBook')}
                {r.message && ` — ${r.message}`}
              </span>
            </span>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={r.enabled} onChange={() => db.reminders.update(r.id!, { enabled: !r.enabled })} className="accent-[#7b5bf5]" />
              {t('common.active')}
            </label>
            <button onClick={() => db.reminders.delete(r.id!)} className="text-muted/80 hover:text-red-400" aria-label={t('reminders.deleteLabel')}>
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
        {reminders?.length === 0 && <p className="text-muted/80">{t('reminders.empty')}</p>}
      </ul>
    </div>
  )
}
