// Copyright (C) 2017-2023 Smart code 203358507
// Adaptado de stremio-web (src/App/ShortcutsModal, src/components/ShortcutsGroup y Keys) para Readora. Licencia GPL-2.0.
// Cambios: estilos con Tailwind e íconos de Lucide en vez de LESS y stremio-icons.

import { Keyboard, X } from 'lucide-react'
import { Fragment, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { PRIMARY_MODIFIER } from '../lib/shortcuts/keyboard'
import { useShortcuts } from '../lib/shortcuts/Shortcuts'
import type { Shortcut } from '../lib/shortcuts/definitions'

/** Ventana con todos los atajos de teclado (se abre con Ctrl + / o ?). */
export function ShortcutsModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-label={t('shortcuts.title')} className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-line bg-surface p-6 shadow-2xl">
        <div className="mb-5 flex items-center gap-3">
          <Keyboard className="h-5 w-5 text-accent-2" />
          <h2 className="flex-1 text-xl font-bold">{t('shortcuts.title')}</h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-surface-2" aria-label={t('common.close')}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <ShortcutsList />
      </div>
    </div>,
    document.body,
  )
}

/** Lista de atajos agrupados (también se muestra en Ajustes). */
export function ShortcutsList() {
  const { t } = useTranslation()
  const { grouped } = useShortcuts()
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {grouped.map((g) => (
        <section key={g.name}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent-2">{t(g.label)}</h3>
          <ul className="space-y-2">
            {g.shortcuts.map((s) => (
              <ShortcutRow key={s.name} shortcut={s} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function ShortcutRow({ shortcut }: { shortcut: Shortcut }) {
  const { t } = useTranslation()
  return (
    <li className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted">{t(shortcut.label)}</span>
      <span className="flex flex-wrap items-center justify-end gap-1">
        {shortcut.combos.map((keys, i) => (
          <Fragment key={i}>
            {i > 0 && <span className="px-0.5 text-xs text-muted/70">{t('shortcuts.or')}</span>}
            <Keys keys={keys} />
          </Fragment>
        ))}
      </span>
    </li>
  )
}

function Keys({ keys }: { keys: string[] }) {
  const { t } = useTranslation()
  const labels: Record<string, string> = {
    Shift: `⇧ ${t('shortcuts.keys.shift')}`,
    Space: t('shortcuts.keys.space'),
    Ctrl: 'Ctrl',
    Mod: PRIMARY_MODIFIER === 'Meta' ? '⌘' : 'Ctrl',
    Escape: 'Esc',
    Backspace: '⌫',
    PageUp: t('shortcuts.keys.pageUp'),
    PageDown: t('shortcuts.keys.pageDown'),
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
  }
  // "1, 2, 3…" se muestra como rango: "1 a 7".
  const isRange = keys.length > 1 && keys.every((k) => !Number.isNaN(parseInt(k)))
  const shown = isRange ? [keys[0], keys[keys.length - 1]] : keys
  return shown.map((k, i) => (
    <Fragment key={k}>
      <kbd className="min-w-7 rounded-md border border-line bg-surface-2 px-2 py-0.5 text-center font-sans text-xs font-semibold shadow-[0_2px_0_rgb(0_0_0/.35)]">
        {labels[k] ?? k.toUpperCase()}
      </kbd>
      {i < shown.length - 1 && <span className="text-xs text-muted/70">{isRange ? t('shortcuts.to') : '+'}</span>}
    </Fragment>
  ))
}
