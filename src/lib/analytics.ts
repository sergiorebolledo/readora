import { platform } from './platform'
import i18n from '../i18n'

/**
 * Analítica de uso con Firebase (Google Analytics 4).
 *
 * Privacidad (ver docs/PRIVACIDAD.md):
 * - Solo funciona si la persona acepta ("Compartir estadísticas anónimas"); se puede cambiar en Ajustes.
 *   En Android la recolección viene APAGADA de fábrica (AndroidManifest.xml) y solo se enciende con permiso.
 *   En PC/web el código de Firebase ni se descarga hasta que la persona acepta.
 * - Solo se envían los eventos de este archivo. Nunca títulos, autores, textos buscados ni archivos.
 * - Sin ID de publicidad, sin señales de personalización de anuncios, sin pantallas automáticas
 *   y sin identificador de persona (no se llama a setUserId).
 * - Sin configuración (`VITE_FIREBASE_*` en `.env.local`) la analítica queda apagada; así las copias
 *   del código abierto no envían datos a nuestra cuenta.
 */

const CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined,
}
// Clave nueva al pasar de PostHog a Firebase: quien había aceptado antes vuelve a ver el aviso
// (cambió el servicio que recibe los datos). Quien había dicho que no, sigue en "no".
const CONSENT_KEY = 'estante:analitica-firebase'
const OLD_CONSENT_KEY = 'estante:analitica'
const native = platform === 'android'

export type Consent = 'granted' | 'denied' | 'unset'

/** Eventos permitidos y sus datos. Agregar uno nuevo aquí obliga a revisarlo (y a documentarlo en PRIVACIDAD.md). */
export interface Events {
  app_opened: { platform: string; language: string; version: string }
  screen_viewed: { screen: string }
  books_imported: { added: number; duplicated: number; unsupported: number; formats: string[] }
  book_downloaded: { source: string; format: string; other_language: boolean }
  book_download_failed: { source: string }
  book_opened: { format: string }
  reading_session: { format: string; minutes: number; pages: number }
  book_finished: { format: string }
  reminder_created: { days: number; for_book: boolean }
  highlight_created: { color: string; with_note: boolean }
  explore_searched: { language: string }
  source_toggled: { source: string; enabled: boolean }
  language_changed: { language: string }
  shortcut_used: { shortcut: string }
  premium_purchase: { result: 'success' | 'cancelled' | 'error' }
}

type Params = Record<string, string | number>
interface Client {
  log: (name: string, params: Params) => Promise<unknown>
  setEnabled: (enabled: boolean) => Promise<unknown>
}

let loading: Promise<Client | null> | null = null

/** ¿Esta compilación tiene analítica configurada? (Si no, no se pregunta nada a la persona.) */
export const analyticsAvailable = !!(CONFIG.appId && CONFIG.measurementId)

export function getConsent(): Consent {
  try {
    const v = localStorage.getItem(CONSENT_KEY)
    if (v === 'granted' || v === 'denied') return v
    return localStorage.getItem(OLD_CONSENT_KEY) === 'denied' ? 'denied' : 'unset'
  } catch {
    return 'unset'
  }
}

export async function setConsent(value: 'granted' | 'denied') {
  try {
    localStorage.setItem(CONSENT_KEY, value)
  } catch {
    // sin almacenamiento: la elección dura solo esta sesión
  }
  if (value === 'granted') await start()
  else if (loading) {
    const client = await loading
    await client?.setEnabled(false).catch(() => {})
    // Borra el identificador de instalación y lo pendiente de enviar.
    if (native) await import('@capacitor-firebase/analytics').then(({ FirebaseAnalytics }) => FirebaseAnalytics.resetAnalyticsData()).catch(() => {})
    loading = null
  }
  window.dispatchEvent(new Event('readora:consent'))
}

/** Prepara Firebase solo cuando hay configuración y permiso. */
function start(): Promise<Client | null> {
  if (!analyticsAvailable || getConsent() !== 'granted') return Promise.resolve(null)
  loading ??= (native ? startNative() : startWeb()).catch((err) => {
    console.warn('Analítica no disponible', err)
    return null
  })
  return loading
}

/** Android: SDK nativo de Firebase (lee android/app/google-services.json). */
async function startNative(): Promise<Client> {
  const { FirebaseAnalytics } = await import('@capacitor-firebase/analytics')
  await FirebaseAnalytics.setEnabled({ enabled: true })
  return {
    log: (name, params) => FirebaseAnalytics.logEvent({ name, params }),
    setEnabled: (enabled) => FirebaseAnalytics.setEnabled({ enabled }),
  }
}

/** PC y web: SDK de JavaScript de Firebase. */
async function startWeb(): Promise<Client> {
  const [{ initializeApp }, ga] = await Promise.all([import('firebase/app'), import('firebase/analytics')])
  const { initializeAnalytics, logEvent, setAnalyticsCollectionEnabled } = ga
  // Solo estadísticas: nada de publicidad (modo de consentimiento de Google).
  ga.setConsent({ analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' })
  const app = initializeApp(CONFIG as Required<typeof CONFIG>)
  const analytics = initializeAnalytics(app, {
    config: {
      send_page_view: false,
      // La dirección de la app incluye identificadores internos de libros y el título de la ventana
      // puede ser el de un libro: se envían fijos.
      page_location: `${location.origin}/`,
      page_referrer: '',
      page_title: 'Readora',
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    },
  })
  setAnalyticsCollectionEnabled(analytics, true)
  return {
    log: async (name, params) => logEvent(analytics, name, params),
    setEnabled: async (enabled) => setAnalyticsCollectionEnabled(analytics, enabled),
  }
}

/** Google Analytics solo admite textos y números: las listas se unen y los sí/no pasan a "true"/"false". */
function toParams(props: object): Params {
  const out: Params = {}
  for (const [k, v] of Object.entries(props)) {
    out[k] = Array.isArray(v) ? v.join(',') : typeof v === 'boolean' ? String(v) : (v as string | number)
  }
  return out
}

/** Envía un evento (no hace nada sin permiso o sin configuración). */
export function track<E extends keyof Events>(event: E, props: Events[E]) {
  if (!analyticsAvailable || getConsent() !== 'granted') return
  void start().then((c) => c?.log(event, toParams(props)).catch(() => {}))
}

/** Pantalla actual, sin identificadores: "leer/abc-123" → "leer". */
export function trackScreen(section: string) {
  track('screen_viewed', { screen: section || 'inicio' })
}

/** Se llama al abrir la app. */
export function initAnalytics() {
  track('app_opened', { platform, language: i18n.resolvedLanguage ?? 'en', version: __APP_VERSION__ })
}
