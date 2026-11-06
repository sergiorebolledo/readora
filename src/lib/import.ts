import ePub from 'epubjs'
import { db, type Book, type BookFormat } from '../db'
import i18n from '../i18n'
import { openPdf } from './pdf'
import { canvasToBlob, generateCover } from './cover'
import { cbzImages, decodeText, paginateText } from './formats'

export const ACCEPTED = '.pdf,.epub,.txt,.cbz'

export function detectFormat(name: string): BookFormat | null {
  const ext = name.toLowerCase().split('.').pop()
  if (ext === 'pdf' || ext === 'epub' || ext === 'txt' || ext === 'cbz') return ext
  return null
}

/** Título legible a partir del nombre del archivo. */
function titleFromFileName(name: string) {
  return name
    .replace(/\.[^.]+$/, '')
    .replace(/[_.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

interface Extracted {
  title?: string
  author?: string
  cover?: Blob
  totalPages: number
}

async function extractPdf(file: File): Promise<Extracted> {
  const pdf = await openPdf(await file.arrayBuffer())
  const meta = await pdf.getMetadata().catch(() => null)
  const info = (meta?.info ?? {}) as { Title?: string; Author?: string }

  const page = await pdf.getPage(1)
  const base = page.getViewport({ scale: 1 })
  const viewport = page.getViewport({ scale: 500 / base.width })
  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  await page.render({ canvas, viewport }).promise
  const cover = await canvasToBlob(canvas)
  const totalPages = pdf.numPages
  await pdf.loadingTask.destroy()
  return { title: info.Title?.trim(), author: info.Author?.trim(), cover, totalPages }
}

async function extractEpub(file: File): Promise<Extracted> {
  const book = ePub(await file.arrayBuffer())
  // Esperar a que epub.js termine de cargar todo antes de destruirlo (evita errores internos).
  await book.ready
  const meta = await book.loaded.metadata
  let cover: Blob | undefined
  try {
    const url = await book.coverUrl()
    if (url) cover = await (await fetch(url)).blob()
  } catch {
    /* sin portada */
  }
  book.destroy()
  // Las "páginas" de un EPUB dependen del tamaño de pantalla; el lector las calcula al abrirlo.
  return { title: meta.title, author: meta.creator, cover, totalPages: 0 }
}

async function extractTxt(file: File): Promise<Extracted> {
  const text = decodeText(await file.arrayBuffer())
  const firstLine = text.split(/\r?\n/).find((l) => l.trim().length > 0)?.trim()
  return {
    title: firstLine && firstLine.length < 80 ? firstLine : undefined,
    totalPages: paginateText(text).length,
  }
}

async function extractCbz(file: File): Promise<Extracted> {
  const images = await cbzImages(file)
  const cover = images[0] ? await images[0].async('blob') : undefined
  return { cover, totalPages: images.length }
}

/** Datos que ya conocemos de antemano (p. ej. al descargar desde una fuente de Explorar). */
export interface ImportExtras {
  title?: string
  author?: string
  description?: string
  /** Portada de la fuente, usada solo si el archivo no trae una. */
  cover?: Blob
  origin?: Book['origin']
}

/** Importa un archivo a la biblioteca. Devuelve el libro creado. */
export async function importFile(file: File, extras: ImportExtras = {}): Promise<Book> {
  const format = detectFormat(file.name)
  if (!format) throw new Error(`Formato no soportado: ${file.name}`)

  const extractors = { pdf: extractPdf, epub: extractEpub, txt: extractTxt, cbz: extractCbz }
  let data: Extracted = { totalPages: 0 }
  try {
    data = await extractors[format](file)
  } catch (err) {
    console.warn('No se pudieron leer los metadatos de', file.name, err)
  }

  const title = extras.title || data.title || titleFromFileName(file.name)
  const author = extras.author || data.author || i18n.t('common.unknownAuthor')
  const book: Book = {
    id: crypto.randomUUID(),
    title,
    author,
    format,
    fileName: file.name,
    fileSize: file.size,
    file,
    cover: data.cover ?? extras.cover ?? (await generateCover(title, author)),
    totalPages: data.totalPages,
    currentPage: 0,
    progress: 0,
    location: null,
    status: 'por-leer',
    favorite: false,
    addedAt: Date.now(),
    lastOpenedAt: null,
    finishedAt: null,
    origin: extras.origin,
    description: extras.description,
  }
  await db.books.add(book)
  return book
}
