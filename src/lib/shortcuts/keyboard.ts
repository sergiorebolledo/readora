// Copyright (C) 2017-2023 Smart code 203358507
// Adaptado de stremio-web (src/common/Shortcuts/keyboard.ts) para Readora. Licencia GPL-2.0.
// Cambio: la plataforma se detecta con navigator en vez de stremio/common/Platform.

const isApple = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent)

/** Tecla "principal" de los atajos: ⌘ en Apple, Ctrl en el resto. */
export const PRIMARY_MODIFIER = isApple ? 'Meta' : 'Ctrl'

const KEY_CODE_MAP: Record<number, string> = {
  8: 'Backspace',
  27: 'Escape',
  32: 'Space',
  33: 'PageUp',
  34: 'PageDown',
  37: 'ArrowLeft',
  38: 'ArrowUp',
  39: 'ArrowRight',
  40: 'ArrowDown',
  107: '+',
  109: '-',
  122: 'F11',
  187: '=',
  189: '-',
  191: '/',
  219: '[',
  221: ']',
}

const KEY_MAP: Record<string, string> = {
  ' ': 'Space',
  Spacebar: 'Space',
  Esc: 'Escape',
  Left: 'ArrowLeft',
  Up: 'ArrowUp',
  Right: 'ArrowRight',
  Down: 'ArrowDown',
}

function keyFromKeyCode(keyCode: number) {
  if (KEY_CODE_MAP[keyCode]) return KEY_CODE_MAP[keyCode]
  if (keyCode >= 48 && keyCode <= 57) return String.fromCharCode(keyCode)
  if (keyCode >= 65 && keyCode <= 90) return String.fromCharCode(keyCode)
  if (keyCode >= 96 && keyCode <= 105) return String(keyCode - 96)
  return null
}

function normalizeKeyboardKey({ key, keyCode, which }: KeyboardEvent) {
  const mappedKey = KEY_MAP[key] ?? key
  if (mappedKey && mappedKey !== 'Unidentified') {
    return mappedKey.length === 1 ? mappedKey.toUpperCase() : mappedKey
  }
  return keyFromKeyCode(keyCode || which) ?? mappedKey
}

/** Identificador estable de la tecla física (para limitar repeticiones). */
export function getKeyboardShortcutKey(event: KeyboardEvent) {
  return event.code && event.code !== 'Unidentified' ? event.code : normalizeKeyboardKey(event)
}

/** Nombres posibles de la tecla pulsada: código físico ("KeyF") y tecla normalizada ("F"). */
export function getKeyboardShortcutKeys(event: KeyboardEvent) {
  const normalizedKey = normalizeKeyboardKey(event)
  const code = event.code !== 'Unidentified' ? event.code : ''
  return code && code !== normalizedKey ? [code, normalizedKey] : [normalizedKey]
}
