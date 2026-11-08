import { Capacitor } from '@capacitor/core'
import { isTauri } from '@tauri-apps/api/core'

/**
 * ¿Dónde se está ejecutando Readora?
 * - 'android': app de Android (Capacitor).
 * - 'desktop': app de escritorio para Windows / Linux / Steam (Tauri).
 * - 'web': navegador (desarrollo o versión web).
 */
export const isDesktop = isTauri()
export const platform: 'android' | 'desktop' | 'web' = Capacitor.getPlatform() === 'android' ? 'android' : isDesktop ? 'desktop' : 'web'

/**
 * En escritorio, los enlaces externos (`target="_blank"`) se abren en el navegador del usuario.
 * Sin esto, la ventana de Tauri no hace nada al pulsarlos.
 */
export function openExternalLinksInBrowser() {
  if (!isDesktop) return
  document.addEventListener('click', (e) => {
    const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
    if (!a || !/^(https?:|mailto:)/.test(a.href)) return
    if (a.target !== '_blank' && new URL(a.href).origin === window.location.origin) return
    e.preventDefault()
    import('@tauri-apps/plugin-opener').then(({ openUrl }) => openUrl(a.href)).catch((err) => console.warn('No se pudo abrir el enlace', err))
  })
}
