/**
 * Sistema de "Fuentes" (inspirado en los addons de Stremio).
 * Cada fuente declara sus catálogos (filas de Explorar) y sabe buscar y devolver libros descargables.
 * Para agregar una fuente nueva: crear un archivo que exporte un `Source` y registrarlo en `sources/index.ts`.
 */

export type Lang = 'es' | 'en' | 'pt' | 'fr' | 'all'
export type DownloadFormat = 'epub' | 'pdf' | 'txt'

export interface CatalogItem {
  /** Identificador único dentro de la fuente. */
  id: string
  sourceId: string
  title: string
  authors: string[]
  coverUrl?: string
  year?: number
  languages?: string[]
  description?: string
  subjects?: string[]
  /** Archivos descargables, en orden de preferencia. */
  downloads: { format: DownloadFormat; url: string; /** Idioma de ese archivo, si difiere del pedido. */ otherLanguage?: string }[]
  /** Página del libro en el sitio original. */
  infoUrl?: string
  /** Datos internos que la fuente necesita para resolve() (p. ej. ediciones candidatas). */
  extra?: Record<string, unknown>
}

export interface CatalogDef {
  id: string
  name: string
}

export interface CatalogPage {
  items: CatalogItem[]
  /** Cursor opaco para pedir la página siguiente (null si no hay más). */
  next: string | null
}

export interface Source {
  id: string
  name: string
  description: string
  homepage: string
  /** Nota sobre el tipo de contenido (dominio público, préstamo, etc.). */
  contentNote: string
  catalogs: CatalogDef[]
  getCatalog(catalogId: string, lang: Lang, cursor?: string | null): Promise<CatalogPage>
  search(query: string, lang: Lang, cursor?: string | null): Promise<CatalogPage>
  /**
   * Opcional: completa datos que no vienen en el catálogo (p. ej. qué archivo se puede descargar).
   * Se llama al abrir la ficha del libro.
   */
  resolve?(item: CatalogItem, lang: Lang): Promise<CatalogItem>
}
