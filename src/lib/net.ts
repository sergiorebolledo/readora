import { Capacitor, CapacitorHttp } from '@capacitor/core'
import i18n from '../i18n'

/**
 * Descarga un archivo de una fuente externa.
 *
 * Gutenberg y archive.org no permiten descargas directas desde una página web (CORS).
 * - Android (Capacitor): se usa el cliente HTTP nativo, que no tiene esa restricción.
 * - Desarrollo web (`npm run dev`): pasa por un proxy de Vite (ver vite.config.ts) con lista blanca de dominios.
 * - PC/Steam (Tauri): se usará el plugin HTTP de Tauri (pendiente).
 */
export async function fetchBlob(url: string): Promise<Blob> {
  // Solo descargas cifradas: una dirección http:// o rara (javascript:, file:…) que venga de un catálogo se rechaza.
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error(i18n.t('errors.network'))
  }
  if (parsed.protocol !== 'https:') throw new Error(i18n.t('errors.network'))
  if (Capacitor.isNativePlatform()) return fetchNative(url)

  const target = import.meta.env.DEV ? `/__proxy?url=${encodeURIComponent(url)}` : url
  let res: Response
  try {
    res = await fetch(target)
  } catch {
    throw new Error(i18n.t('errors.network'))
  }
  if (!res.ok) throw new Error(i18n.t('errors.http', { status: res.status }))
  return res.blob()
}

async function fetchNative(url: string): Promise<Blob> {
  let res
  try {
    res = await CapacitorHttp.get({ url, responseType: 'blob' })
  } catch {
    throw new Error(i18n.t('errors.network'))
  }
  if (res.status >= 400) throw new Error(i18n.t('errors.http', { status: res.status }))
  // Con responseType 'blob' el plugin devuelve el contenido en base64.
  const bytes = Uint8Array.from(atob(res.data as string), (c) => c.charCodeAt(0))
  const type = (res.headers['Content-Type'] ?? res.headers['content-type'] ?? 'application/octet-stream') as string
  return new Blob([bytes], { type })
}
