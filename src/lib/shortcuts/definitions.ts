/**
 * Atajos de teclado de Readora: grupos, nombres y teclas.
 * `label` es una clave de traducción (sección `shortcuts` de los archivos de idioma).
 * Teclas: nombres de `KeyboardEvent.key` normalizados ("F", "1", "ArrowLeft", "Space"…),
 * más los modificadores "Ctrl", "Shift" y "Mod" (⌘ en Apple, Ctrl en el resto).
 */
export interface Shortcut {
  name: ShortcutName
  label: string
  combos: string[][]
}

export interface ShortcutGroup {
  name: string
  label: string
  shortcuts: Shortcut[]
}

export type ShortcutName =
  | 'navigateTabs'
  | 'navigateSearch'
  | 'navigateHistory'
  | 'fullscreen'
  | 'shortcuts'
  | 'nextPage'
  | 'prevPage'
  | 'biggerText'
  | 'smallerText'
  | 'toggleUi'
  | 'closeReader'

/** Pantallas a las que llevan las teclas 1 a 7, en el orden de la barra lateral. */
export const NAVIGATE_TABS_ROUTES = ['', 'explorar', 'biblioteca', 'historial', 'recordatorios', 'fuentes', 'ajustes']

export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    name: 'general',
    label: 'shortcuts.general',
    shortcuts: [
      { name: 'navigateTabs', label: 'shortcuts.navigateTabs', combos: [NAVIGATE_TABS_ROUTES.map((_, i) => String(i + 1))] },
      { name: 'navigateSearch', label: 'shortcuts.navigateSearch', combos: [['/'], ['0']] },
      { name: 'navigateHistory', label: 'shortcuts.navigateHistory', combos: [['Backspace']] },
      { name: 'fullscreen', label: 'shortcuts.fullscreen', combos: [['F']] },
      { name: 'shortcuts', label: 'shortcuts.shortcuts', combos: [['Ctrl', '/'], ['?']] },
    ],
  },
  {
    name: 'reader',
    label: 'shortcuts.reader',
    shortcuts: [
      { name: 'nextPage', label: 'shortcuts.nextPage', combos: [['ArrowRight'], ['Space'], ['PageDown']] },
      { name: 'prevPage', label: 'shortcuts.prevPage', combos: [['ArrowLeft'], ['PageUp']] },
      { name: 'biggerText', label: 'shortcuts.biggerText', combos: [['+']] },
      { name: 'smallerText', label: 'shortcuts.smallerText', combos: [['-']] },
      { name: 'toggleUi', label: 'shortcuts.toggleUi', combos: [['H']] },
      { name: 'closeReader', label: 'shortcuts.closeReader', combos: [['Escape']] },
    ],
  },
]
