import type { Book } from '../db'

/**
 * "Estantes": agrupaciones de libros. Se usan como filas en el Inicio
 * y como filtros en la página Biblioteca ("Ver todo").
 */
export interface Shelf {
  id: string
  title: string
  filter: (b: Book) => boolean
  sort: SortKey
}

export type SortKey = 'recientes' | 'ultimo-leido' | 'titulo' | 'autor' | 'progreso'

export const SORTS: { id: SortKey; label: string }[] = [
  { id: 'ultimo-leido', label: 'Último leído' },
  { id: 'recientes', label: 'Agregados recientemente' },
  { id: 'titulo', label: 'Título (A–Z)' },
  { id: 'autor', label: 'Autor (A–Z)' },
  { id: 'progreso', label: 'Progreso' },
]

export const SHELVES: Shelf[] = [
  { id: 'todos', title: 'Todos', filter: () => true, sort: 'recientes' },
  { id: 'leyendo', title: 'Continuar leyendo', filter: (b) => b.status === 'leyendo', sort: 'ultimo-leido' },
  { id: 'recientes', title: 'Agregados recientemente', filter: () => true, sort: 'recientes' },
  { id: 'favoritos', title: 'Mis favoritos', filter: (b) => b.favorite, sort: 'ultimo-leido' },
  { id: 'por-leer', title: 'Por leer', filter: (b) => b.status === 'por-leer', sort: 'recientes' },
  { id: 'terminados', title: 'Terminados', filter: (b) => b.status === 'terminado', sort: 'ultimo-leido' },
  { id: 'pdf', title: 'PDF', filter: (b) => b.format === 'pdf', sort: 'titulo' },
  { id: 'epub', title: 'EPUB', filter: (b) => b.format === 'epub', sort: 'titulo' },
  { id: 'comics', title: 'Cómics', filter: (b) => b.format === 'cbz', sort: 'titulo' },
]

export function sortBooks(books: Book[], key: SortKey) {
  const list = [...books]
  switch (key) {
    case 'recientes':
      return list.sort((a, b) => b.addedAt - a.addedAt)
    case 'ultimo-leido':
      return list.sort((a, b) => (b.lastOpenedAt ?? 0) - (a.lastOpenedAt ?? 0) || b.addedAt - a.addedAt)
    case 'titulo':
      return list.sort((a, b) => a.title.localeCompare(b.title, 'es'))
    case 'autor':
      return list.sort((a, b) => a.author.localeCompare(b.author, 'es'))
    case 'progreso':
      return list.sort((a, b) => b.progress - a.progress)
  }
}

export function matchesSearch(b: Book, q: string) {
  const s = q.trim().toLowerCase()
  return !s || b.title.toLowerCase().includes(s) || b.author.toLowerCase().includes(s)
}
