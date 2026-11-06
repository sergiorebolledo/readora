import JSZip from 'jszip'

/** Caracteres por "página" en archivos TXT. */
export const TXT_PAGE_CHARS = 1800

export function paginateText(text: string, size = TXT_PAGE_CHARS): string[] {
  const pages: string[] = []
  let i = 0
  while (i < text.length) {
    let end = Math.min(text.length, i + size)
    // Cortar en un salto de línea o espacio cercano para no partir palabras.
    if (end < text.length) {
      const nl = text.lastIndexOf('\n', end)
      const sp = text.lastIndexOf(' ', end)
      const cut = nl > i + size * 0.6 ? nl : sp > i + size * 0.6 ? sp : end
      end = cut
    }
    pages.push(text.slice(i, end).trim())
    i = end
  }
  return pages.length ? pages : ['']
}

/** Decodifica TXT intentando UTF-8 y cayendo a Windows-1252 (común en archivos en español). */
export function decodeText(buf: ArrayBuffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buf)
  } catch {
    return new TextDecoder('windows-1252').decode(buf)
  }
}

const IMAGE_RE = /\.(jpe?g|png|gif|webp|avif)$/i

/** Imágenes de un CBZ en orden natural (1, 2, 10 en vez de 1, 10, 2). */
export async function cbzImages(file: Blob) {
  const zip = await JSZip.loadAsync(file)
  return Object.values(zip.files)
    .filter((f) => !f.dir && IMAGE_RE.test(f.name) && !f.name.startsWith('__MACOSX'))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
}
