// Copyright (C) 2017-2023 Smart code 203358507
// Adaptado de stremio-web (src/common/Shortcuts/Shortcuts.tsx y useShortcut.ts) para Readora. Licencia GPL-2.0.
// Cambios: atajos propios de Readora, Shift opcional en teclas de símbolo (+, -, ?, /)
// —en muchos teclados exigen Shift—, alias del teclado numérico para todas las teclas
// y las combinaciones con Escape funcionan también dentro de campos de texto.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { PRIMARY_MODIFIER, getKeyboardShortcutKey, getKeyboardShortcutKeys } from './keyboard'
import { SHORTCUT_GROUPS, type ShortcutGroup, type ShortcutName } from './definitions'

export type ShortcutListener = (combo: number, key: string, repeat: boolean) => void

interface ShortcutsContextValue {
  grouped: ShortcutGroup[]
  on: (name: ShortcutName, listener: ShortcutListener) => void
  off: (name: ShortcutName, listener: ShortcutListener) => void
}

const ShortcutsContext = createContext<ShortcutsContextValue>({ grouped: SHORTCUT_GROUPS, on: () => {}, off: () => {} })

const SHORTCUTS = SHORTCUT_GROUPS.flatMap((g) => g.shortcuts)
const REPEAT_THROTTLE_MS = 130
const MODIFIERS = ['Ctrl', 'Shift', 'Mod']
// Solo alias del teclado numérico: los símbolos se reconocen por el carácter, no por la posición
// física (en el teclado español, por ejemplo, "?" está en la tecla que en inglés es "-").
const KEY_ALIASES: Record<string, string[]> = {
  '+': ['NumpadAdd'],
  '-': ['NumpadSubtract'],
  '/': ['NumpadDivide'],
}

const isInputFocused = () => {
  const el = document.activeElement
  return el instanceof HTMLElement && (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || el.isContentEditable)
}

/** Una tecla de símbolo (+, -, ?…) puede necesitar Shift según el teclado, así que no se exige. */
const isSymbol = (k: string) => k.length === 1 && !/[A-Z0-9]/i.test(k)

export function ShortcutsProvider({ children, onShortcut }: { children: ReactNode; onShortcut: (name: ShortcutName, combo: number, key: string) => boolean | void }) {
  const listeners = useRef(new Map<ShortcutName, Set<ShortcutListener>>())
  const lastRepeatTime = useRef(new Map<string, number>())

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const { ctrlKey, shiftKey, altKey, metaKey, key, repeat } = event
      if (event.isComposing) return
      const inputFocused = isInputFocused()

      const shortcutKeys = getKeyboardShortcutKeys(event)
      const repeatKey = getKeyboardShortcutKey(event)
      const now = Date.now()
      const throttled = repeat && now - (lastRepeatTime.current.get(repeatKey) ?? 0) < REPEAT_THROTTLE_MS
      if (repeat && !throttled) lastRepeatTime.current.set(repeatKey, now)

      for (const { name, combos } of SHORTCUTS) {
        combos.forEach((keys, combo) => {
          // Mientras se escribe en un campo de texto solo funciona Escape.
          if (inputFocused && !keys.includes('Escape')) return
          const main = keys.filter((k) => !MODIFIERS.includes(k))
          const primary = keys.includes('Mod')
          const modifiers =
            (keys.includes('Ctrl') || (primary && PRIMARY_MODIFIER === 'Ctrl')) === ctrlKey &&
            (primary && PRIMARY_MODIFIER === 'Meta') === metaKey &&
            (keys.includes('Shift') === shiftKey || main.every(isSymbol)) &&
            !altKey &&
            !event.getModifierState('AltGraph')
          const keyMatched = main.some((k) => shortcutKeys.includes(k) || KEY_ALIASES[k]?.some((a) => shortcutKeys.includes(a)))
          if (!modifiers || !keyMatched) return

          const own = listeners.current.get(name)
          const handled = onShortcut(name, combo, key) !== false
          if (own?.size || handled) event.preventDefault()
          if (throttled) return
          own?.forEach((l) => l(combo, key, repeat))
        })
      }
    },
    [onShortcut],
  )

  const on = useCallback((name: ShortcutName, listener: ShortcutListener) => {
    if (!listeners.current.has(name)) listeners.current.set(name, new Set())
    listeners.current.get(name)!.add(listener)
  }, [])

  const off = useCallback((name: ShortcutName, listener: ShortcutListener) => {
    listeners.current.get(name)?.delete(listener)
  }, [])

  const value = useMemo(() => ({ grouped: SHORTCUT_GROUPS, on, off }), [on, off])

  useEffect(() => {
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onKeyDown])

  return <ShortcutsContext.Provider value={value}>{children}</ShortcutsContext.Provider>
}

export function useShortcuts() {
  return useContext(ShortcutsContext)
}

/** Ejecuta `listener` cuando se pulsa el atajo `name` (mientras el componente esté montado). */
export function useShortcut(name: ShortcutName, listener: ShortcutListener, enabled = true) {
  const { on, off } = useShortcuts()
  const latest = useRef(listener)
  latest.current = listener
  useEffect(() => {
    if (!enabled) return
    const l: ShortcutListener = (...args) => latest.current(...args)
    on(name, l)
    return () => off(name, l)
  }, [name, enabled, on, off])
}
