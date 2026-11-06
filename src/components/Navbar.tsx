import { BarChart3, Bell, Compass, Home, Library, Puzzle, Search, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { APP_NAME } from '../brand'
import { go } from '../lib/hooks'
import { ImportButton } from './Importer'

interface Props {
  route: string
  search: string
  onSearch: (q: string) => void
  onFiles: (f: FileList) => void
}

const SECTIONS = [
  { path: '', icon: Home, key: 'home', mobile: true },
  { path: 'explorar', icon: Compass, key: 'explore', mobile: true },
  { path: 'biblioteca', icon: Library, key: 'library', mobile: true },
  { path: 'historial', icon: BarChart3, key: 'history', mobile: true },
  { path: 'recordatorios', icon: Bell, key: 'reminders', mobile: true },
  // En el celular, Fuentes se abre desde Explorar y Ajustes desde el engranaje de arriba.
  { path: 'fuentes', icon: Puzzle, key: 'sources', mobile: false },
  { path: 'ajustes', icon: Settings, key: 'settings', mobile: false },
] as const

/** Pantallas donde el buscador filtra el contenido actual en vez de volver al Inicio. */
const SEARCHABLE = ['', 'biblioteca', 'explorar']

/** Barra lateral de iconos (PC), barra superior con búsqueda y pestañas inferiores (celular). */
export function Navbar({ route, search, onSearch, onFiles }: Props) {
  const { t } = useTranslation()
  return (
    <>
      {/* Barra lateral (PC/tablet) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-20 flex-col items-center gap-2 border-r border-line bg-bg/60 py-4 backdrop-blur sm:flex">
        <button onClick={() => go('')} className="mb-4 rounded-xl shadow-lg shadow-accent/40 transition-transform hover:scale-105" aria-label={APP_NAME}>
          <img src="/logo.svg" alt="" className="h-11 w-11" />
        </button>
        {SECTIONS.map(({ path, icon: Icon, key }) => {
          const active = route === path
          const label = t(`nav.${key}`)
          return (
            <button
              key={path}
              onClick={() => go(path)}
              title={label}
              aria-label={label}
              className={`group relative flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
                active ? 'bg-surface-2 text-white' : 'text-muted hover:bg-surface hover:text-white'
              } ${key === 'settings' ? 'mt-auto' : ''}`}
            >
              {active && <span className="absolute -left-4 h-6 w-1 rounded-r bg-accent" />}
              <Icon className="h-5 w-5" />
              <span className="pointer-events-none absolute left-14 whitespace-nowrap rounded-md bg-surface-2 px-2 py-1 text-xs opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                {label}
              </span>
            </button>
          )
        })}
      </aside>

      {/* Barra superior: búsqueda centrada */}
      <header className="fixed inset-x-0 top-0 z-30 flex items-center gap-3 border-b border-line bg-bg/70 px-4 py-3 backdrop-blur sm:left-20 sm:px-8">
        <button onClick={() => go('')} className="shrink-0 sm:hidden" aria-label={APP_NAME}>
          <img src="/logo.svg" alt="" className="h-8 w-8" />
        </button>
        <label className="relative mx-auto flex w-full max-w-md items-center">
          <input
            id="buscar"
            type="search"
            value={search}
            onChange={(e) => {
              onSearch(e.target.value)
              if (!SEARCHABLE.includes(route)) go('')
            }}
            placeholder={route === 'explorar' ? t('nav.searchExplore') : t('nav.searchLibrary')}
            aria-label={t('nav.search')}
            className="w-full rounded-full border border-line bg-surface/70 py-2 pl-4 pr-10 text-sm outline-none placeholder:text-muted focus:border-accent/60 focus:bg-surface"
          />
          <Search className="pointer-events-none absolute right-3.5 h-4 w-4 text-muted" />
        </label>
        <ImportButton onFiles={onFiles} />
        <button onClick={() => go('ajustes')} className="shrink-0 rounded-full p-1.5 text-muted hover:text-white sm:hidden" aria-label={t('nav.settings')}>
          <Settings className="h-5 w-5" />
        </button>
      </header>

      {/* Pestañas inferiores (celular) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden">
        {SECTIONS.filter((s) => s.mobile).map(({ path, icon: Icon, key }) => (
          <button
            key={path}
            onClick={() => go(path)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] ${route === path ? 'text-accent-2' : 'text-muted'}`}
          >
            <Icon className="h-5 w-5" />
            {t(`nav.${key}`)}
          </button>
        ))}
      </nav>
    </>
  )
}
