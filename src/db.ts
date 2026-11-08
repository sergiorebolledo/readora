import Dexie, { type EntityTable } from 'dexie'
import { track } from './lib/analytics'

/** Formatos soportados en el MVP. */
export type BookFormat = 'pdf' | 'epub' | 'txt' | 'cbz'
export type BookStatus = 'por-leer' | 'leyendo' | 'terminado'

export interface Book {
  id: string
  title: string
  author: string
  format: BookFormat
  fileName: string
  fileSize: number
  /** Archivo original. */
  file: Blob
  /** Portada (extraída del archivo o generada). */
  cover: Blob
  /** Total de páginas (en EPUB son "posiciones" aproximadas). */
  totalPages: number
  /** Página actual, empezando en 1. */
  currentPage: number
  /** Progreso 0..1 */
  progress: number
  /** Posición exacta específica del formato (CFI en EPUB, nº de página en el resto). */
  location: string | null
  status: BookStatus
  favorite: boolean
  addedAt: number
  lastOpenedAt: number | null
  finishedAt: number | null
  /** Si se descargó desde Explorar: de qué fuente y con qué id. */
  origin?: { sourceId: string; itemId: string }
  /** Sinopsis (si la fuente la trae). */
  description?: string
}

/** Una sesión de lectura: se abre el lector y se cierra. */
export interface ReadingSession {
  id?: number
  bookId: string
  startedAt: number
  endedAt: number
  /** Duración en segundos. */
  seconds: number
  fromPage: number
  toPage: number
}

export interface Reminder {
  id?: number
  /** "HH:MM" en hora local. */
  time: string
  /** Días de la semana: 0 = domingo ... 6 = sábado. */
  days: number[]
  message: string
  /** Libro asociado (opcional). */
  bookId: string | null
  enabled: boolean
  /** Fecha "YYYY-MM-DD" del último aviso, para no repetir el mismo día. */
  lastFired: string | null
}

export const db = new Dexie('estante') as Dexie & {
  books: EntityTable<Book, 'id'>
  sessions: EntityTable<ReadingSession, 'id'>
  reminders: EntityTable<Reminder, 'id'>
}

db.version(1).stores({
  books: 'id, title, author, format, status, favorite, addedAt, lastOpenedAt',
  sessions: '++id, bookId, startedAt',
  reminders: '++id, enabled',
})

/** Guarda la posición de lectura y actualiza el estado automáticamente. */
export async function saveProgress(book: Book, page: number, total: number, location: string | null) {
  const progress = total > 0 ? Math.min(1, page / total) : 0
  const finished = progress >= 0.995
  if (finished && !book.finishedAt) track('book_finished', { format: book.format })
  await db.books.update(book.id, {
    currentPage: page,
    totalPages: total,
    progress,
    location,
    lastOpenedAt: Date.now(),
    status: finished ? 'terminado' : 'leyendo',
    finishedAt: finished ? book.finishedAt ?? Date.now() : book.finishedAt,
  })
}
