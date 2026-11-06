import { useEffect, useState } from 'react'
import { cached, type CatalogItem, type CatalogPage } from '../../sources'

/** Carga una página de catálogo (con caché) y expone estado de carga/error. */
export function useCatalog(key: string | null, load: () => Promise<CatalogPage>) {
  const [state, setState] = useState<{ page?: CatalogPage; error?: string; loading: boolean }>({ loading: !!key })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!key) return setState({ loading: false })
    let alive = true
    setState({ loading: true })
    cached(key, load)
      .then((page) => alive && setState({ page, loading: false }))
      .catch((e: Error) => alive && setState({ error: e.message, loading: false }))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt])

  return { ...state, retry: () => setAttempt((n) => n + 1) }
}

/** Lista paginada con botón "Cargar más". */
export function usePaged(key: string, load: (cursor: string | null) => Promise<CatalogPage>) {
  const [items, setItems] = useState<CatalogItem[]>([])
  const [next, setNext] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  const fetchPage = (cursor: string | null, reset: boolean) => {
    setLoading(true)
    setError(undefined)
    cached(`${key}|${cursor ?? ''}`, () => load(cursor))
      .then((p) => {
        setItems((prev) => {
          const base = reset ? [] : prev
          const seen = new Set(base.map((i) => i.id))
          return [...base, ...p.items.filter((i) => !seen.has(i.id))]
        })
        setNext(p.next)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    setItems([])
    fetchPage(null, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return { items, loading, error, hasMore: !!next, loadMore: () => fetchPage(next, false), retry: () => fetchPage(null, true) }
}
