import { useLiveQuery } from 'dexie-react-hooks'
import { NotebookPen, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { db, type Highlight } from '../db'
import { HIGHLIGHT_COLORS } from './types'

const COLORS = Object.keys(HIGHLIGHT_COLORS) as Highlight['color'][]

function ColorDots({ value, onPick }: { value?: Highlight['color']; onPick: (c: Highlight['color']) => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-2">
      {COLORS.map((c) => (
        <button
          key={c}
          onClick={() => onPick(c)}
          aria-label={t('reader.notes.highlightIn', { color: t(`reader.notes.colors.${c}`) })}
          aria-pressed={value === c}
          className={`h-8 w-8 rounded-full border-2 transition-transform active:scale-90 ${value === c ? 'border-white' : 'border-transparent'}`}
          style={{ background: HIGHLIGHT_COLORS[c] }}
        />
      ))}
    </div>
  )
}

/** Barra que aparece al seleccionar texto: subrayar con un color o agregar una nota. */
export function SelectionBar({ onPick, onNote, onCancel }: { onPick: (c: Highlight['color']) => void; onNote: () => void; onCancel: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="absolute inset-x-0 bottom-14 z-30 flex justify-center px-3">
      <div className="flex items-center gap-3 rounded-full border border-line bg-surface/95 px-4 py-2 text-white shadow-2xl backdrop-blur">
        <ColorDots onPick={onPick} />
        <button onClick={onNote} className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-sm font-semibold">
          <NotebookPen className="h-4 w-4" /> {t('reader.notes.note')}
        </button>
        <button onClick={onCancel} className="rounded-full p-1 text-muted hover:text-white" aria-label={t('reader.notes.cancel')}>
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

/** Hoja para ver un subrayado: cambiar el color, escribir la nota o borrarlo. */
export function HighlightEditor({ id, onClose }: { id: number; onClose: () => void }) {
  const { t } = useTranslation()
  const h = useLiveQuery(() => db.highlights.get(id), [id])
  const [note, setNote] = useState<string | null>(null)
  useEffect(() => {
    if (h && note === null) setNote(h.note)
  }, [h, note])
  if (!h) return null

  // La nota se guarda mientras se escribe: así no se pierde si se cierra con "atrás" o tocando fuera.
  const save = async () => {
    if (note !== null && note.trim() !== note) await db.highlights.update(id, { note: note.trim() })
    onClose()
  }
  return (
    <Sheet onClose={save}>
      <blockquote className="max-h-32 overflow-y-auto border-l-4 pl-3 text-sm italic text-zinc-300" style={{ borderColor: HIGHLIGHT_COLORS[h.color] }}>
        “{h.text}”
      </blockquote>
      <div className="mt-4 flex items-center justify-between gap-3">
        <ColorDots value={h.color} onPick={(color) => db.highlights.update(id, { color })} />
        <span className="text-xs text-muted">{t('reader.notes.page', { page: h.page })}</span>
      </div>
      <label className="mt-4 block text-sm font-medium" htmlFor="nota">
        {t('reader.notes.note')}
      </label>
      <textarea
        id="nota"
        value={note ?? ''}
        onChange={(e) => {
          setNote(e.target.value)
          void db.highlights.update(id, { note: e.target.value })
        }}
        placeholder={t('reader.notes.placeholder')}
        rows={4}
        className="mt-1 w-full resize-none rounded-xl border border-line bg-bg p-3 text-sm text-white outline-none focus:border-accent"
      />
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={async () => {
            await db.highlights.delete(id)
            onClose()
          }}
          className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300"
        >
          <Trash2 className="h-4 w-4" /> {t('reader.notes.delete')}
        </button>
        <button onClick={save} className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white">
          {t('reader.notes.save')}
        </button>
      </div>
    </Sheet>
  )
}

/** Lista de subrayados y notas del libro. Tocar uno lleva a esa parte del libro. */
export function HighlightsPanel({
  highlights,
  onGo,
  onEdit,
  onClose,
}: {
  highlights: Highlight[]
  onGo: (h: Highlight) => void
  onEdit: (h: Highlight) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  return (
    <Sheet onClose={onClose} title={t('reader.notes.list')} tall>
      {highlights.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">{t('reader.notes.empty')}</p>
      ) : (
        <ul className="space-y-3">
          {highlights.map((h) => (
            <li key={h.id} className="rounded-xl bg-surface-2 p-3">
              <button onClick={() => onGo(h)} className="block w-full text-left">
                <p className="line-clamp-3 border-l-4 pl-3 text-sm text-zinc-200" style={{ borderColor: HIGHLIGHT_COLORS[h.color] }}>
                  {h.text}
                </p>
                {h.note && <p className="mt-2 whitespace-pre-wrap pl-4 text-sm text-white">📝 {h.note}</p>}
              </button>
              <div className="mt-2 flex items-center justify-between pl-4 text-xs text-muted">
                <span>{t('reader.notes.page', { page: h.page })}</span>
                <button onClick={() => onEdit(h)} className="font-medium text-accent-2 hover:text-white">
                  {h.note ? t('reader.notes.edit') : t('reader.notes.addNote')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  )
}

function Sheet({ children, onClose, title, tall }: { children: React.ReactNode; onClose: () => void; title?: string; tall?: boolean }) {
  const { t } = useTranslation()
  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-lg overflow-y-auto rounded-t-3xl border border-line bg-surface p-5 text-white shadow-2xl sm:rounded-3xl ${tall ? 'max-h-[80vh]' : 'max-h-[90vh]'}`}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1 text-muted hover:text-white" aria-label={t('common.close')}>
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
