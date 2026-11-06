import type { CatalogItem, CatalogPage, Lang, Source } from './types'

/**
 * Open Library (Internet Archive): catálogo enorme con portadas.
 * Solo se muestran obras con `ebook_access=public` (descarga libre).
 * Cada obra tiene varias ediciones escaneadas en archive.org; al abrir la ficha
 * se consulta la API de metadatos de archive.org para elegir una edición
 * descargable (EPUB o PDF), priorizando el idioma elegido.
 */
const SEARCH = 'https://openlibrary.org/search.json'
const FIELDS =
  'key,title,author_name,cover_i,ia,first_publish_year,language,subject,' +
  // La edición que coincide con la búsqueda (p. ej. la edición en español).
  'editions,editions.key,editions.title,editions.ia,editions.language,editions.cover_i,editions.ebook_access'
const PAGE_SIZE = 24
const LANG3: Record<Lang, string | null> = { es: 'spa', en: 'eng', pt: 'por', fr: 'fre', all: null }

interface OLDoc {
  key: string
  title: string
  author_name?: string[]
  cover_i?: number
  ia?: string[]
  first_publish_year?: number
  language?: string[]
  subject?: string[]
  editions?: { docs: { title?: string; ia?: string[]; language?: string[]; cover_i?: number; ebook_access?: string }[] }
}

/** Ediciones que NO son libros descargables (audiolibros de LibriVox). */
const isAudio = (ia: string) => ia.includes('librivox')

/**
 * Convierte una obra en un libro del catálogo.
 * Si se pidió un idioma, se usa la edición en ese idioma (título, portada y archivo);
 * devuelve null si esa edición no es de descarga libre.
 */
function toItem(d: OLDoc, lang: Lang, strict: boolean): CatalogItem | null {
  const edition = d.editions?.docs[0]
  let title = d.title
  let cover = d.cover_i
  let ia = (d.ia ?? []).filter((x) => !isAudio(x))
  if (lang !== 'all') {
    const eia = (edition?.ia ?? []).filter((x) => !isAudio(x))
    const usable = edition && edition.ebook_access === 'public' && eia.length
    if (usable) {
      title = edition.title ?? title
      cover = edition.cover_i ?? cover
      // Primero la edición en el idioma pedido; las demás quedan como respaldo.
      ia = [...eia, ...ia.filter((x) => !eia.includes(x))]
    } else if (strict) {
      // En los catálogos solo mostramos obras con edición descargable en el idioma pedido.
      return null
    }
    // En búsquedas se muestra igual: la edición en el idioma se busca al abrir la ficha.
  }
  if (!ia.length) return null
  return {
    id: d.key.replace('/works/', ''),
    sourceId: 'openlibrary',
    title,
    authors: d.author_name?.slice(0, 3) ?? [],
    coverUrl: cover ? `https://covers.openlibrary.org/b/id/${cover}-M.jpg` : undefined,
    year: d.first_publish_year,
    languages: lang !== 'all' ? edition?.language : d.language,
    subjects: d.subject?.slice(0, 6),
    // Se completa en resolve(): hay que confirmar qué archivo se puede descargar.
    downloads: [],
    infoUrl: `https://openlibrary.org${d.key}`,
    extra: { ia },
  }
}

async function query(params: Record<string, string>, lang: Lang, page: number, strict = true): Promise<CatalogPage> {
  const u = new URL(SEARCH)
  u.searchParams.set('ebook_access', 'public')
  u.searchParams.set('fields', FIELDS)
  u.searchParams.set('limit', String(PAGE_SIZE))
  u.searchParams.set('page', String(page))
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v)
  // "language:spa" dentro de la consulta hace que Open Library devuelva la edición en ese idioma.
  const l = LANG3[lang]
  if (l) u.searchParams.set('q', `${u.searchParams.get('q') ?? ''} language:${l}`.trim())
  const res = await fetch(u)
  if (!res.ok) throw new Error(`Open Library respondió ${res.status}`)
  const data = (await res.json()) as { docs: OLDoc[]; numFound: number }
  const items = data.docs.map((d) => toItem(d, lang, strict)).filter((i): i is CatalogItem => !!i)
  return { items, next: page * PAGE_SIZE < data.numFound ? String(page + 1) : null }
}

const SUBJECTS: Record<string, string> = {
  clasicos: 'subject:classics',
  novela: 'subject:fiction',
  poesia: 'subject:poetry',
  infantil: 'subject:juvenile_fiction',
  historia: 'subject:history',
  ciencia: 'subject:science',
}

interface IAMetadata {
  metadata?: { language?: string | string[]; 'access-restricted-item'?: string; description?: string | string[] }
  files?: { name: string }[]
}

export const openLibrary: Source = {
  id: 'openlibrary',
  name: 'Open Library',
  description: 'Catálogo de Internet Archive. Ediciones escaneadas de libros de dominio público, en EPUB o PDF.',
  homepage: 'https://openlibrary.org',
  contentNote: 'Dominio público (escaneos)',
  catalogs: [
    { id: 'clasicos', name: 'Clásicos' },
    { id: 'novela', name: 'Novela' },
    { id: 'poesia', name: 'Poesía' },
    { id: 'infantil', name: 'Infantil y juvenil' },
    { id: 'historia', name: 'Historia' },
    { id: 'ciencia', name: 'Ciencia' },
  ],
  getCatalog(catalogId, lang, cursor) {
    return query({ q: SUBJECTS[catalogId] ?? 'subject:classics', sort: 'editions' }, lang, Number(cursor ?? 1))
  },
  search(q, lang, cursor) {
    return query({ q }, lang, Number(cursor ?? 1), false)
  },
  async resolve(item, lang) {
    // Ediciones candidatas: primero la del idioma elegido y luego las demás de la obra.
    const candidates = ((item.extra?.ia as string[] | undefined) ?? []).slice(0, 10)
    const wanted = LANG3[lang]?.slice(0, 2)
    const matching: CatalogItem['downloads'] = []
    const others: CatalogItem['downloads'] = []
    let languages = item.languages
    let description = item.description
    let editionsFound = 0

    // archive.org a veces falla al servir un archivo concreto (error 500), así que juntamos
    // varias alternativas (de hasta 3 ediciones) y "Agregar" las prueba en orden.
    for (const ia of candidates) {
      if (editionsFound >= 3) break
      const res = await fetch(`https://archive.org/metadata/${encodeURIComponent(ia)}`).catch(() => null)
      if (!res?.ok) continue
      const meta = (await res.json()) as IAMetadata
      if (meta.metadata?.['access-restricted-item'] === 'true') continue
      const names = (meta.files ?? []).map((f) => f.name).filter((n) => !n.includes('_lcp'))
      const base = `https://archive.org/download/${encodeURIComponent(ia)}/`
      const files: CatalogItem['downloads'] = [
        ...names.filter((n) => n.endsWith('.epub')).map((n) => ({ format: 'epub' as const, url: base + encodeURIComponent(n) })),
        ...names.filter((n) => n.endsWith('.pdf') && !n.endsWith('_text.pdf')).map((n) => ({ format: 'pdf' as const, url: base + encodeURIComponent(n) })),
      ]
      if (!files.length) continue
      editionsFound++
      const langs = ([] as string[]).concat(meta.metadata?.language ?? [])
      const isMatch = !wanted || langs.some((l) => l.toLowerCase().startsWith(wanted))
      ;(isMatch ? matching : others).push(...files.map((f) => (isMatch ? f : { ...f, otherLanguage: langs[0] ?? 'otro idioma' })))
      if (isMatch && langs.length) languages = langs
      const rawDesc = ([] as string[]).concat(meta.metadata?.description ?? [])[0]?.replace(/<[^>]+>/g, '').trim()
      // Muchas ediciones escaneadas traen "descripciones" como "345 p. :"; se ignoran.
      if (!description && rawDesc && rawDesc.length >= 60) description = rawDesc
    }
    // EPUB antes que PDF dentro de cada grupo.
    const byFormat = (a: { format: string }, b: { format: string }) => (a.format === 'epub' ? 0 : 1) - (b.format === 'epub' ? 0 : 1)
    const downloads = [...matching.sort(byFormat), ...others.sort(byFormat)]
    return { ...item, downloads, languages, description }
  },
}
