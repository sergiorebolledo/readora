import i18n from '../i18n'
import type { CatalogItem, CatalogPage, Lang, Source } from './types'

/**
 * Project Gutenberg: más de 75.000 libros de dominio público.
 * Catálogo vía Gutendex (https://gutendex.com), API JSON abierta que permite llamadas desde el navegador.
 */
const API = 'https://gutendex.com/books/'

interface GutendexBook {
  id: number
  title: string
  authors: { name: string }[]
  summaries?: string[]
  subjects: string[]
  languages: string[]
  formats: Record<string, string>
}

/** "Dostoyevsky, Fyodor" → "Fyodor Dostoyevsky" */
function niceName(name: string) {
  const [last, first] = name.split(', ')
  return first ? `${first} ${last}` : name
}

function toItem(b: GutendexBook): CatalogItem {
  const f = b.formats
  const downloads: CatalogItem['downloads'] = []
  if (f['application/epub+zip']) downloads.push({ format: 'epub', url: f['application/epub+zip'] })
  const txt = f['text/plain; charset=utf-8'] ?? Object.entries(f).find(([k]) => k.startsWith('text/plain'))?.[1]
  if (txt) downloads.push({ format: 'txt', url: txt })
  return {
    id: String(b.id),
    sourceId: 'gutenberg',
    title: b.title.replace(/\s*\$[a-z].*$/, '').trim(),
    authors: b.authors.map((a) => niceName(a.name)),
    coverUrl: f['image/jpeg'],
    languages: b.languages,
    description: b.summaries?.[0]?.replace(/\s*\(This is an automatically generated summary\.\)\s*$/, ''),
    subjects: b.subjects.map((s) => s.replace(/ -- .*/, '')).filter((s, i, a) => a.indexOf(s) === i).slice(0, 6),
    downloads,
    infoUrl: `https://www.gutenberg.org/ebooks/${b.id}`,
  }
}

/**
 * Gutendex a veces tarda 30–60 s por consulta y falla si recibe varias a la vez.
 * Por eso las consultas van en fila (una por vez) y se reintenta una vez si falla.
 */
let queue: Promise<unknown> = Promise.resolve()

function query(url: string): Promise<CatalogPage> {
  const run = async () => {
    for (let attempt = 0; ; attempt++) {
      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`Gutenberg respondió ${res.status}`)
        const data = (await res.json()) as { results: GutendexBook[]; next: string | null }
        return { items: data.results.map(toItem).filter((i) => i.downloads.length), next: data.next }
      } catch {
        if (attempt >= 1) throw new Error(i18n.t('errors.gutenbergSlow'))
        await new Promise((r) => setTimeout(r, 2000))
      }
    }
  }
  const result = queue.then(run, run)
  queue = result.catch(() => {})
  return result
}

function url(params: Record<string, string>, lang: Lang) {
  const u = new URL(API)
  u.searchParams.set('sort', 'popular')
  if (lang !== 'all') u.searchParams.set('languages', lang)
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v)
  return u.toString()
}

const TOPICS: Record<string, string> = {
  ficcion: 'fiction',
  aventura: 'adventure',
  'ciencia-ficcion': 'science fiction',
  poesia: 'poetry',
  teatro: 'drama',
  infantil: 'children',
  filosofia: 'philosophy',
  historia: 'history',
}

export const gutenberg: Source = {
  id: 'gutenberg',
  name: 'Project Gutenberg',
  description: 'Clásicos de dominio público: Cervantes, Austen, Dostoievski, Poe… Gratis y legales.',
  homepage: 'https://www.gutenberg.org',
  contentNote: 'Dominio público',
  catalogs: [
    { id: 'populares', name: 'Más populares' },
    { id: 'ficcion', name: 'Novela' },
    { id: 'aventura', name: 'Aventura' },
    { id: 'ciencia-ficcion', name: 'Ciencia ficción' },
    { id: 'poesia', name: 'Poesía' },
    { id: 'teatro', name: 'Teatro' },
    { id: 'infantil', name: 'Infantil y juvenil' },
    { id: 'filosofia', name: 'Filosofía' },
    { id: 'historia', name: 'Historia' },
  ],
  getCatalog(catalogId, lang, cursor) {
    if (cursor) return query(cursor)
    const topic = TOPICS[catalogId]
    return query(url(topic ? { topic } : {}, lang))
  },
  search(q, lang, cursor) {
    return query(cursor ?? url({ search: q }, lang))
  },
}
