import { locale } from '../i18n'
import { track } from '../lib/analytics'
import { useSetting } from '../lib/hooks'
import { gutenberg } from './gutenberg'
import { openLibrary } from './openlibrary'
import type { CatalogPage, Lang, Source } from './types'

export type { CatalogItem, CatalogPage, Lang, Source } from './types'

/** Fuentes disponibles. Para agregar una nueva, impórtala y súmala aquí. */
export const SOURCES: Source[] = [gutenberg, openLibrary]

export function getSource(id: string | undefined) {
  return SOURCES.find((s) => s.id === id)
}

/** Qué fuentes están activadas (se guarda en el dispositivo). */
export function useEnabledSources() {
  const [enabled, setEnabled] = useSetting<Record<string, boolean>>('fuentes', {})
  const isOn = (id: string) => enabled[id] ?? true
  return {
    sources: SOURCES.filter((s) => isOn(s.id)),
    isOn,
    toggle: (id: string) => {
      track('source_toggled', { source: id, enabled: !isOn(id) })
      setEnabled({ ...enabled, [id]: !isOn(id) })
    },
  }
}

/** Idiomas de libros disponibles en Explorar (los nombres se traducen con `bookLangs.<id>`). */
export const LANGS: Lang[] = ['es', 'en', 'pt', 'fr', 'all']

/** Idioma de los libros en Explorar. Por defecto, el idioma de la app. */
export function useExploreLang() {
  const ui = locale() as Lang
  return useSetting<Lang>('explorar:idioma', LANGS.includes(ui) ? ui : 'all')
}

/**
 * Caché de páginas de catálogo en dos niveles:
 * - memoria: volver a Explorar no repite consultas;
 * - localStorage (12 h): al reabrir la app los catálogos aparecen al instante,
 *   aunque la fuente sea lenta (Gutendex puede tardar casi un minuto).
 * Si una consulta falla, se borra de la caché para poder reintentar.
 */
const cache = new Map<string, Promise<CatalogPage>>()
const TTL = 12 * 60 * 60 * 1000
const PREFIX = 'estante:catalogo:'

function readStored(key: string): CatalogPage | null {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return null
    const { at, page } = JSON.parse(raw) as { at: number; page: CatalogPage }
    return Date.now() - at < TTL ? page : null
  } catch {
    return null
  }
}

function store(key: string, page: CatalogPage) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ at: Date.now(), page }))
  } catch {
    // Sin espacio: limpiar catálogos guardados (se volverán a descargar).
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k))
  }
}

export function cached(key: string, load: () => Promise<CatalogPage>) {
  let p = cache.get(key)
  if (!p) {
    const stored = readStored(key)
    p = stored ? Promise.resolve(stored) : load().then((page) => (store(key, page), page))
    cache.set(key, p)
    p.catch(() => cache.delete(key))
  }
  return p
}
