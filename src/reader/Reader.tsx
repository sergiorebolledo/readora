import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { db, saveProgress, type Book } from '../db'
import { track } from '../lib/analytics'
import { go, useSetting } from '../lib/hooks'
import { useShortcut } from '../lib/shortcuts/Shortcuts'
import { CbzReader } from './CbzReader'
import { EpubReader } from './EpubReader'
import { PdfReader } from './PdfReader'
import { TxtReader } from './TxtReader'
import { THEMES, type FormatReaderProps, type ReaderNav, type ReaderTheme } from './types'

const READERS: Record<Book['format'], (p: FormatReaderProps) => React.ReactNode> = {
  pdf: PdfReader,
  epub: EpubReader,
  txt: TxtReader,
  cbz: CbzReader,
}

export function Reader({ id }: { id: string }) {
  // Se lee una sola vez: el lector no debe reiniciarse cada vez que guardamos el progreso.
  const book = useLiveQuery(() => db.books.get(id), [id], null)
  const { t } = useTranslation()
  const [initial, setInitial] = useState<Book>()
  useEffect(() => {
    if (book && !initial) setInitial(book)
  }, [book, initial])

  if (book === undefined) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p>{t('reader.notFound')}</p>
        <button onClick={() => go('')} className="rounded-full bg-white px-5 py-2 text-black">
          {t('common.back')}
        </button>
      </div>
    )
  }
  if (!initial) return <div className="flex h-screen items-center justify-center text-muted">{t('reader.opening')}</div>
  return <ReaderShell book={initial} />
}

function ReaderShell({ book }: { book: Book }) {
  const { t } = useTranslation()
  const [theme, setTheme] = useSetting<ReaderTheme>('theme', 'oscuro')
  const [fontSize, setFontSize] = useSetting('fontSize', 100)
  const [pos, setPos] = useState({ page: book.currentPage || 1, total: book.totalPages })
  const [showUi, setShowUi] = useState(true)
  const nav = useRef<ReaderNav | null>(null)

  // ---- Sesión de lectura (historial) ----
  const session = useRef({ startedAt: Date.now(), fromPage: book.currentPage || 1, lastPage: book.currentPage || 1 })
  useEffect(() => {
    const flush = () => {
      const s = session.current
      const seconds = Math.round((Date.now() - s.startedAt) / 1000)
      if (seconds >= 5) {
        track('reading_session', { format: book.format, minutes: Math.round(seconds / 6) / 10, pages: Math.max(0, s.lastPage - s.fromPage) })
        db.sessions.add({
          bookId: book.id,
          startedAt: s.startedAt,
          endedAt: Date.now(),
          seconds,
          fromPage: s.fromPage,
          toPage: s.lastPage,
        })
      }
      session.current = { startedAt: Date.now(), fromPage: s.lastPage, lastPage: s.lastPage }
    }
    // Si la app pasa a segundo plano (celular), se cierra la sesión.
    const onVisibility = () => (document.hidden ? flush() : (session.current.startedAt = Date.now()))
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', flush)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', flush)
      flush()
    }
  }, [book.id, book.format])

  useEffect(() => track('book_opened', { format: book.format }), [book.id, book.format])

  const onLocate = useCallback(
    (page: number, total: number, location: string | null) => {
      setPos({ page, total })
      session.current.lastPage = page
      saveProgress(book, page, total, location)
    },
    [book],
  )

  // ---- Teclado ----
  // Ver src/lib/shortcuts/definitions.ts (también se listan en Ajustes y con "?").
  useShortcut('nextPage', () => nav.current?.next())
  useShortcut('prevPage', () => nav.current?.prev())
  useShortcut('biggerText', () => setFontSize((f) => Math.min(220, f + 10)))
  useShortcut('smallerText', () => setFontSize((f) => Math.max(70, f - 10)))
  useShortcut('toggleUi', () => setShowUi((v) => !v))
  useShortcut('closeReader', () => go(`libro/${book.id}`))

  const Format = READERS[book.format]
  const colors = THEMES[book.format === 'pdf' || book.format === 'cbz' ? 'oscuro' : theme]
  const percent = pos.total ? Math.round((pos.page / pos.total) * 100) : 0
  const textFormat = book.format === 'epub' || book.format === 'txt'

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: colors.bg, color: colors.fg }}>
      <header
        className={`absolute inset-x-0 top-0 z-20 flex items-center gap-3 bg-black/80 px-3 py-2 text-zinc-100 backdrop-blur transition-opacity ${
          showUi ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <button onClick={() => go(`libro/${book.id}`)} className="flex items-center gap-1 rounded-full px-2 py-1 hover:bg-white/10" aria-label={t('common.back')}>
          <ChevronLeft className="h-4 w-4" /> {t('common.back')}
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{book.title}</p>
          <p className="truncate text-xs text-muted">{book.author}</p>
        </div>
        {textFormat && (
          <div className="flex items-center gap-1 text-sm">
            <button onClick={() => setFontSize((f) => Math.max(70, f - 10))} className="rounded px-2 py-1 hover:bg-white/10" aria-label={t('reader.smallerText')}>
              A−
            </button>
            <button onClick={() => setFontSize((f) => Math.min(220, f + 10))} className="rounded px-2 py-1 hover:bg-white/10" aria-label={t('reader.biggerText')}>
              A+
            </button>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as ReaderTheme)}
              className="rounded bg-surface-2 px-2 py-1"
              aria-label={t('reader.theme')}
            >
              <option value="oscuro">{t('reader.themes.oscuro')}</option>
              <option value="sepia">{t('reader.themes.sepia')}</option>
              <option value="claro">{t('reader.themes.claro')}</option>
            </select>
          </div>
        )}
      </header>

      <main className="relative flex-1 overflow-hidden" onDoubleClick={() => setShowUi((v) => !v)}>
        <Format book={book} onLocate={onLocate} nav={nav} theme={theme} fontSize={fontSize} />
        {/* Zonas táctiles: tocar a la izquierda/derecha cambia de página (ideal en celular). */}
        <button aria-label={t('reader.prevPage')} onClick={() => nav.current?.prev()} className="absolute inset-y-0 left-0 z-10 w-[15%] cursor-w-resize opacity-0" />
        <button aria-label={t('reader.nextPage')} onClick={() => nav.current?.next()} className="absolute inset-y-0 right-0 z-10 w-[15%] cursor-e-resize opacity-0" />
      </main>

      <footer
        className={`z-20 flex items-center gap-3 bg-black/80 px-4 py-2 text-xs text-zinc-300 transition-opacity ${
          showUi ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <button onClick={() => nav.current?.prev()} aria-label={t('reader.prev')} className="shrink-0 whitespace-nowrap rounded px-2 py-1 text-base hover:bg-white/10 sm:text-xs">
          ‹<span className="hidden sm:inline"> {t('reader.prev')}</span>
        </button>
        <input
          type="range"
          min={1}
          max={Math.max(1, pos.total)}
          value={pos.page}
          disabled={!pos.total || !nav.current?.goTo}
          onChange={(e) => nav.current?.goTo?.(Number(e.target.value))}
          className="flex-1 accent-[#7b5bf5]"
          aria-label={t('reader.goToPage')}
        />
        <span className="shrink-0 text-center tabular-nums sm:w-36">
          {pos.total ? t('reader.position', { page: pos.page, total: pos.total, percent }) : t('reader.computingPages')}
        </span>
        <button onClick={() => nav.current?.next()} aria-label={t('reader.next')} className="shrink-0 whitespace-nowrap rounded px-2 py-1 text-base hover:bg-white/10 sm:text-xs">
          <span className="hidden sm:inline">{t('reader.next')} </span>›
        </button>
      </footer>
    </div>
  )
}
