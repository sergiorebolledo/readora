import type { PostHog } from 'posthog-js'
import { platform } from './platform'
import i18n from '../i18n'

/**
 * Analítica de uso con PostHog (servidor en la Unión Europea).
 *
 * Privacidad (ver docs/PRIVACIDAD.md):
 * - Solo funciona si la persona acepta ("Compartir estadísticas anónimas"); se puede cambiar en Ajustes.
 * - Solo se envían los eventos de este archivo. Nunca títulos, autores, textos buscados ni archivos.
 * - Sin grabación de sesiones, sin captura automática de clics y sin perfiles de persona.
 * - Sin clave (`VITE_POSTHOG_KEY` en `.env.local`) la analítica queda apagada; así las copias del
 *   código abierto no envían datos a nuestra cuenta.
 */

const KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined
const HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) || 'https://eu.i.posthog.com'
const CONSENT_KEY = 'estante:analitica'

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
  explore_searched: { language: string }
  source_toggled: { source: string; enabled: boolean }
  language_changed: { language: string }
  shortcut_used: { shortcut: string }
}

let client: PostHog | null = null
let loading: Promise<PostHog | null> | null = null

/** ¿Esta compilación tiene analítica configurada? (Si no, no se pregunta nada a la persona.) */
export const analyticsAvailable = !!KEY

export function getConsent(): Consent {
  try {
    const v = localStorage.getItem(CONSENT_KEY)
    return v === 'granted' || v === 'denied' ? v : 'unset'
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
  if (value === 'granted') {
    const ph = await start()
    ph?.opt_in_capturing()
  } else if (client) {
    client.opt_out_capturing()
    client.reset()
  }
  window.dispatchEvent(new Event('readora:consent'))
}

/** Carga PostHog solo cuando hay clave y permiso (el código no se descarga si la persona dice que no). */
function start(): Promise<PostHog | null> {
  if (!KEY || getConsent() !== 'granted') return Promise.resolve(null)
  if (client) return Promise.resolve(client)
  loading ??= import('posthog-js').then(({ default: posthog }) => {
    posthog.init(KEY, {
      api_host: HOST,
      persistence: 'localStorage',
      person_profiles: 'identified_only',
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      rageclick: false,
      capture_dead_clicks: false,
      capture_heatmaps: false,
      capture_exceptions: false,
      capture_performance: false,
      disable_session_recording: true,
      disable_surveys: true,
      disable_product_tours: true,
      disable_conversations: true,
      disable_web_experiments: true,
      disable_external_dependency_loading: true,
      advanced_disable_flags: true,
      // La URL de la app incluye identificadores internos de libros: se reemplaza por la pantalla.
      before_send: (event) => {
        if (!event) return event
        for (const p of ['$current_url', '$pathname', '$referrer', '$initial_current_url', '$initial_pathname']) delete event.properties[p]
        if (event.$set_once) {
          delete event.$set_once.$initial_current_url
          delete event.$set_once.$initial_pathname
        }
        return event
      },
    })
    client = posthog
    return posthog
  })
  return loading
}

/** Envía un evento (no hace nada sin permiso o sin clave). */
export function track<E extends keyof Events>(event: E, props: Events[E]) {
  if (!KEY || getConsent() !== 'granted') return
  start().then((ph) => ph?.capture(event, props))
}

/** Pantalla actual, sin identificadores: "leer/abc-123" → "leer". */
export function trackScreen(section: string) {
  track('screen_viewed', { screen: section || 'inicio' })
}

/** Se llama al abrir la app. */
export function initAnalytics() {
  track('app_opened', { platform, language: i18n.resolvedLanguage ?? 'en', version: __APP_VERSION__ })
}
