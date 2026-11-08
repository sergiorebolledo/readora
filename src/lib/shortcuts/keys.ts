/**
 * Reconocimiento de teclas para los atajos de Readora.
 *
 * Un atajo se escribe como una lista de teclas: ['Ctrl', '/'], ['ArrowRight'], ['F'].
 * - Modificadores: 'Ctrl', 'Shift' y 'Mod' (⌘ en Mac/iPhone, Ctrl en el resto).
 * - La tecla principal se compara con el carácter producido (`event.key`), no con la posición física,
 *   para que funcione igual en teclados español, inglés, francés…
 */

export const IS_APPLE = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent)

const MODIFIER_NAMES = new Set(['Ctrl', 'Shift', 'Mod'])

/** Nombres que se le dan a algunas teclas de `event.key`. */
const RENAMED: Record<string, string> = { ' ': 'Space', Spacebar: 'Space', Esc: 'Escape', Del: 'Delete' }

/** Teclas del teclado numérico que equivalen a un símbolo. */
const NUMPAD: Record<string, string> = { NumpadAdd: '+', NumpadSubtract: '-', NumpadDivide: '/', NumpadMultiply: '*' }

/** Nombre normalizado de la tecla pulsada: "F", "1", "?", "ArrowLeft", "Space"… */
export function pressedKey(e: KeyboardEvent): string {
  if (NUMPAD[e.code]) return NUMPAD[e.code]
  const k = RENAMED[e.key] ?? e.key
  return k.length === 1 ? k.toUpperCase() : k
}

/** Un símbolo (+, ?, /…) puede requerir Shift según el idioma del teclado. */
function isSymbol(key: string) {
  return key.length === 1 && !/[\p{L}\p{N}]/u.test(key)
}

/** ¿La combinación `combo` coincide con el evento de teclado? */
export function comboMatches(combo: string[], e: KeyboardEvent): boolean {
  // Varias teclas normales en un mismo combo son alternativas (p. ej. 1…7 para las pestañas).
  const main = combo.filter((k) => !MODIFIER_NAMES.has(k))
  const pressed = pressedKey(e)
  const hit = main.find((k) => (k.length === 1 ? k.toUpperCase() : k) === pressed)
  if (hit === undefined) return false
  const wantsMod = combo.includes('Mod')
  const wantsCtrl = combo.includes('Ctrl') || (wantsMod && !IS_APPLE)
  const wantsMeta = wantsMod && IS_APPLE
  if (e.ctrlKey !== wantsCtrl || e.metaKey !== wantsMeta || e.altKey) return false
  if (!isSymbol(hit) && e.shiftKey !== combo.includes('Shift')) return false
  return true
}
