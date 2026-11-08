import { Keyboard, X } from 'lucide-react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { SHORTCUT_GROUPS } from '../lib/shortcuts/definitions'
import { IS_APPLE } from '../lib/shortcuts/keys'

/** Ventana de ayuda con todos los atajos (se abre con "?" o Ctrl + /). */
export function ShortcutsDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()

  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', close)
    return () => document.removeEventListener('keydown', close)
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('shortcuts.title')}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-line bg-surface p-6 shadow-2xl"
      >
        <header className="mb-5 flex items-center gap-3">
          <Keyboard className="h-5 w-5 text-accent-2" />
          <h2 className="flex-1 text-xl font-bold">{t('shortcuts.title')}</h2>
          <button onClick={onClose} aria-label={t('common.close')} className="rounded-full p-2 hover:bg-surface-2">
            <X className="h-4 w-4" />
          </button>
        </header>
        <ShortcutsTable />
      </div>
    </div>,
    document.body,
  )
}

/** Tabla de atajos agrupados (en la ventana de ayuda y en Ajustes). */
export function ShortcutsTable() {
  const { t } = useTranslation()
  return (
    <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
      {SHORTCUT_GROUPS.map((group) => (
        <table key={group.name} className="w-full text-sm">
          <caption className="mb-2 text-left text-xs font-semibold uppercase tracking-widest text-accent-2">{t(group.label)}</caption>
          <tbody>
            {group.shortcuts.map((s) => (
              <tr key={s.name}>
                <th scope="row" className="py-1 pr-3 text-left font-normal text-muted">
                  {t(s.label)}
                </th>
                <td className="py-1 text-right">
                  <span className="inline-flex flex-wrap items-center justify-end gap-1">
                    {s.combos.map((combo, i) => (
                      <span key={i} className="inline-flex items-center gap-1">
                        {i > 0 && <span className="text-xs text-muted/70">{t('shortcuts.or')}</span>}
                        <Combo keys={combo} />
                      </span>
                    ))}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ))}
    </div>
  )
}

/** Teclas de una combinación. Una secuencia de números (1…7) se muestra como "1 a 7". */
function Combo({ keys }: { keys: string[] }) {
  const { t } = useTranslation()
  const digits = keys.length > 2 && keys.every((k) => /^\d$/.test(k))
  if (digits) {
    return (
      <>
        <KeyCap name={keys[0]} />
        <span className="text-xs text-muted/70">{t('shortcuts.to')}</span>
        <KeyCap name={keys[keys.length - 1]} />
      </>
    )
  }
  return keys.map((k, i) => (
    <span key={k} className="inline-flex items-center gap-1">
      {i > 0 && <span className="text-xs text-muted/70">+</span>}
      <KeyCap name={k} />
    </span>
  ))
}

function KeyCap({ name }: { name: string }) {
  const { t } = useTranslation()
  const label =
    {
      Mod: IS_APPLE ? '⌘' : 'Ctrl',
      Shift: t('shortcuts.keys.shift'),
      Space: t('shortcuts.keys.space'),
      PageUp: t('shortcuts.keys.pageUp'),
      PageDown: t('shortcuts.keys.pageDown'),
      Escape: 'Esc',
      Backspace: '⌫',
      ArrowLeft: '←',
      ArrowRight: '→',
      ArrowUp: '↑',
      ArrowDown: '↓',
    }[name] ?? name
  return <kbd className="min-w-7 rounded-md border border-line bg-surface-2 px-2 py-0.5 text-center font-sans text-xs font-semibold shadow-[0_2px_0_rgb(0_0_0/.35)]">{label}</kbd>
}
