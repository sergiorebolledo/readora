import { App as NativeApp } from '@capacitor/app'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BookDetail } from './components/BookDetail'
import { History } from './components/History'
import { Home } from './components/Home'
import { useImporter } from './components/Importer'
import { LibraryPage } from './components/LibraryPage'
import { Navbar } from './components/Navbar'
import { Reminders } from './components/Reminders'
import { SettingsPage } from './components/SettingsPage'
import { ShortcutsDialog } from './components/ShortcutsHelp'
import { SourcesPage } from './components/SourcesPage'
import { Explore } from './components/explore/Explore'
import { Reader } from './reader/Reader'
import { go, useRoute } from './lib/hooks'
import { ConsentBanner } from './components/ConsentBanner'
import { useBannerAd } from './lib/ads'
import { initAnalytics, trackScreen } from './lib/analytics'
import { initPremium, usePremium } from './lib/premium'
import { isNative, startReminderScheduler } from './lib/reminders'
import { ShortcutsProvider } from './lib/shortcuts/Shortcuts'
import { NAVIGATE_TABS_ROUTES, type ShortcutName } from './lib/shortcuts/definitions'

/** Envuelve la app con los atajos de teclado y su ventana de ayuda. */
export default function App() {
  const [section] = useRoute()
  const [showShortcuts, setShowShortcuts] = useState(false)
  const reading = useRef(false)

  useEffect(() => {
    initAnalytics()
    initPremium()
  }, [])
  // Anuncio (Android): solo en Inicio y Explorar, nunca en el lector, y nunca con "Readora sin anuncios".
  const premium = usePremium()
  useBannerAd((!section || section === 'explorar') && premium.ready && !premium.active)
  // Solo la sección (leer, explorar…), nunca identificadores de libros.
  useEffect(() => trackScreen(section ?? ''), [section])
  reading.current = section === 'leer'

  // Devuelve false si el atajo no se usó, para no bloquear la tecla.
  const onShortcut = useCallback((name: ShortcutName, key: string) => {
    switch (name) {
      case 'shortcuts':
        setShowShortcuts((v) => !v)
        return
      case 'fullscreen':
        if (document.fullscreenElement) document.exitFullscreen()
        else document.documentElement.requestFullscreen().catch(() => {})
        return
    }
    // En el lector, flechas, números y retroceso los maneja el propio lector.
    if (reading.current) return false
    switch (name) {
      case 'navigateTabs': {
        const route = NAVIGATE_TABS_ROUTES[Number(key) - 1]
        if (route === undefined) return false
        setShowShortcuts(false)
        go(route)
        return
      }
      case 'navigateSearch': {
        const input = () => document.getElementById('buscar') as HTMLInputElement | null
        if (input()?.offsetParent) input()!.focus()
        else {
          go('biblioteca')
          setTimeout(() => input()?.focus(), 50)
        }
        return
      }
      case 'navigateHistory':
        history.back()
        return
      default:
        return false
    }
  }, [])

  return (
    <ShortcutsProvider onGlobal={onShortcut}>
      <AppContent />
      {section !== 'leer' && <ConsentBanner />}
      {showShortcuts && <ShortcutsDialog onClose={() => setShowShortcuts(false)} />}
    </ShortcutsProvider>
  )
}

function AppContent() {
  const [section, param, param2] = useRoute()
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState<{ title: string; body: string } | null>(null)
  const [dragging, setDragging] = useState(false)
  const importer = useImporter()
  const { t } = useTranslation()

  // Botón "atrás" de Android: vuelve a la pantalla anterior; en el inicio, cierra la app.
  useEffect(() => {
    if (!isNative) return
    const h = NativeApp.addListener('backButton', () => {
      if (window.location.hash.replace(/^#\/?/, '')) history.back()
      else NativeApp.exitApp()
    })
    return () => {
      h.then((l) => l.remove())
    }
  }, [])

  useEffect(
    () =>
      startReminderScheduler((title, body) => {
        setToast({ title, body })
        setTimeout(() => setToast(null), 10_000)
      }),
    [],
  )

  // El lector ocupa toda la pantalla, sin barras de navegación.
  if (section === 'leer' && param) return <Reader key={param} id={param} />

  const route = section === 'libro' ? '' : section ?? ''

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={(e) => e.currentTarget === e.target && setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        importer.importFiles(e.dataTransfer.files)
      }}
    >
      <Navbar route={route} search={search} onSearch={setSearch} onFiles={importer.importFiles} />

      <main className="min-h-screen pb-[calc(6rem+var(--ad-h,0px))] pt-20 sm:pb-12 sm:pl-20">
        {section === 'historial' ? (
          <History />
        ) : section === 'recordatorios' ? (
          <Reminders presetBookId={param} />
        ) : section === 'explorar' ? (
          <Explore sourceId={param} catalogId={param2} search={search} />
        ) : section === 'ajustes' ? (
          <SettingsPage />
        ) : section === 'fuentes' ? (
          <SourcesPage importer={importer} />
        ) : section === 'biblioteca' ? (
          <LibraryPage key={param ?? 'todos'} shelfId={param} search={search} />
        ) : (
          <Home search={search} importer={importer} />
        )}
      </main>

      {section === 'libro' && param && <BookDetail id={param} />}

      {dragging && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center border-4 border-dashed border-accent bg-bg/80 text-2xl font-semibold">
          {t('import.dropHere')}
        </div>
      )}
      {importer.status && (
        <div className="fixed bottom-[calc(5rem+var(--ad-h,0px))] left-1/2 z-50 -translate-x-1/2 rounded-full bg-surface-2 px-5 py-2 text-sm shadow-xl sm:bottom-6">
          {importer.status}
        </div>
      )}
      {toast && (
        <div className="fixed right-4 top-20 z-[60] max-w-sm rounded-xl border border-line bg-surface-2 p-4 shadow-2xl">
          <p className="font-semibold">⏰ {toast.title}</p>
          <p className="mt-1 text-sm text-muted">{toast.body}</p>
        </div>
      )}
    </div>
  )
}
