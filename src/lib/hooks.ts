import i18n from '../i18n'
import { useEffect, useState } from 'react'

/** Crea (y libera) una URL temporal para mostrar un Blob como imagen. */
export function useObjectUrl(blob: Blob | undefined | null) {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    if (!blob) return setUrl(undefined)
    const u = URL.createObjectURL(blob)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [blob])
  return url
}

/** Enrutador mínimo basado en el hash (#/leer/123). Funciona igual en web, Capacitor y Tauri. */
export function useRoute() {
  const read = () => window.location.hash.replace(/^#\/?/, '').split('/')
  const [parts, setParts] = useState(read)
  useEffect(() => {
    const onChange = () => setParts(read())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return parts
}

export function go(path: string) {
  window.location.hash = `/${path}`
}

/** Preferencia guardada en localStorage. */
export function useSetting<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    const raw = localStorage.getItem(`estante:${key}`)
    return raw ? (JSON.parse(raw) as T) : initial
  })
  useEffect(() => localStorage.setItem(`estante:${key}`, JSON.stringify(value)), [key, value])
  return [value, setValue] as const
}

export function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.round((seconds % 3600) / 60)
  if (h) return i18n.t('duration.hm', { h, m })
  if (m) return i18n.t('duration.m', { m })
  return i18n.t('duration.s', { s: seconds })
}

export function dayKey(ts: number | Date = Date.now()) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
