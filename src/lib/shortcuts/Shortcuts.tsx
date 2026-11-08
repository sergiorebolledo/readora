import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react'
import { SHORTCUT_GROUPS, type ShortcutName } from './definitions'
import { track } from '../analytics'
import { comboMatches } from './keys'

/**
 * Atajos de teclado de Readora.
 *
 * - `ShortcutsProvider` escucha el teclado una sola vez para toda la app.
 * - Cada pantalla se suscribe a los atajos que le interesan con `useShortcut('nombre', fn)`.
 * - Los atajos generales (navegar, pantalla completa…) los resuelve `onGlobal`, que devuelve
 *   `false` si no hizo nada con ese atajo (así la tecla sigue su comportamiento normal).
 */

type Handler = () => void
type Registry = Map<ShortcutName, Set<{ current: Handler }>>

const RegistryContext = createContext<Registry | null>(null)

const ALL = SHORTCUT_GROUPS.flatMap((g) => g.shortcuts)

/** Mientras se escribe en un campo de texto, los atajos se ignoran (salvo Escape). */
function typingInField() {
  const el = document.activeElement
  if (!(el instanceof HTMLElement)) return false
  return el.isContentEditable || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT'
}

export function ShortcutsProvider({ children, onGlobal }: { children: ReactNode; onGlobal: (name: ShortcutName, key: string) => boolean | void }) {
  const registry = useRef<Registry>(new Map()).current
  const global = useRef(onGlobal)
  global.current = onGlobal

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.isComposing || e.defaultPrevented) return
      const typing = typingInField()
      for (const s of ALL) {
        if (!s.combos.some((c) => comboMatches(c, e))) continue
        if (typing && e.key !== 'Escape') continue
        const subscribers = registry.get(s.name)
        let used = false
        if (subscribers?.size) {
          subscribers.forEach((h) => h.current())
          used = true
        }
        if (global.current(s.name, e.key) !== false) used = true
        if (used) {
          e.preventDefault()
          // Pasar página no se cuenta: serían cientos de eventos por sesión.
          if (s.name !== 'nextPage' && s.name !== 'prevPage') track('shortcut_used', { shortcut: s.name })
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [registry])

  return <RegistryContext.Provider value={registry}>{children}</RegistryContext.Provider>
}

/** Ejecuta `handler` cada vez que se pulsa el atajo `name`, mientras el componente esté en pantalla. */
export function useShortcut(name: ShortcutName, handler: Handler) {
  const registry = useContext(RegistryContext)
  const ref = useRef(handler)
  ref.current = handler
  useEffect(() => {
    if (!registry) return
    if (!registry.has(name)) registry.set(name, new Set())
    const set = registry.get(name)!
    set.add(ref)
    return () => {
      set.delete(ref)
    }
  }, [registry, name])
}
