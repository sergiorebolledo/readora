import type { MutableRefObject } from 'react'
import type { Book, Highlight } from '../db'

export type ReaderTheme = 'oscuro' | 'sepia' | 'claro'

export const THEMES: Record<ReaderTheme, { bg: string; fg: string }> = {
  oscuro: { bg: '#121212', fg: '#e4e4e7' },
  sepia: { bg: '#f4ecd8', fg: '#433422' },
  claro: { bg: '#ffffff', fg: '#18181b' },
}

/** Colores del subrayado. Se ven bien en los tres temas (se pintan semitransparentes). */
export const HIGHLIGHT_COLORS: Record<Highlight['color'], string> = {
  amarillo: '#facc15',
  verde: '#4ade80',
  azul: '#60a5fa',
  rosa: '#f472b6',
}

/** Controles que cada lector registra para que la barra superior y el teclado los usen. */
export interface ReaderNav {
  prev: () => void
  next: () => void
  goTo?: (page: number) => void
  /** Ir a una posición exacta (CFI en EPUB). */
  goToLocation?: (location: string) => void
  /** Quita la selección de texto del libro. */
  clearSelection?: () => void
}

/** Texto que la persona seleccionó en el libro. */
export interface TextSelection {
  location: string
  text: string
}

export interface FormatReaderProps {
  book: Book
  /** Llamar cada vez que cambia la posición. `total` puede ser 0 si aún no se conoce. */
  onLocate: (page: number, total: number, location: string | null) => void
  nav: MutableRefObject<ReaderNav | null>
  theme: ReaderTheme
  fontSize: number
  /** Subrayados del libro (solo los formatos que los admiten). */
  highlights?: Highlight[]
  /** La persona seleccionó texto (null = se quitó la selección). */
  onSelect?: (sel: TextSelection | null) => void
  /** La persona tocó un subrayado. */
  onHighlightClick?: (id: number) => void
}
