import type { MutableRefObject } from 'react'
import type { Book } from '../db'

export type ReaderTheme = 'oscuro' | 'sepia' | 'claro'

export const THEMES: Record<ReaderTheme, { bg: string; fg: string }> = {
  oscuro: { bg: '#121212', fg: '#e4e4e7' },
  sepia: { bg: '#f4ecd8', fg: '#433422' },
  claro: { bg: '#ffffff', fg: '#18181b' },
}

/** Controles que cada lector registra para que la barra superior y el teclado los usen. */
export interface ReaderNav {
  prev: () => void
  next: () => void
  goTo?: (page: number) => void
}

export interface FormatReaderProps {
  book: Book
  /** Llamar cada vez que cambia la posición. `total` puede ser 0 si aún no se conoce. */
  onLocate: (page: number, total: number, location: string | null) => void
  nav: MutableRefObject<ReaderNav | null>
  theme: ReaderTheme
  fontSize: number
}
