import { AdMob, AdmobConsentStatus, BannerAdPluginEvents, BannerAdPosition, BannerAdSize } from '@capacitor-community/admob'
import { Capacitor } from '@capacitor/core'
import { useEffect } from 'react'

/**
 * Anuncios (solo en la app de Android) con Google AdMob.
 *
 * Reglas de Readora:
 * - Solo un banner, y solo en Inicio y Explorar. Nunca en el lector ni en Ajustes.
 * - Antes de pedir anuncios se muestra el formulario de consentimiento de Google (UMP) cuando la ley
 *   lo exige (Unión Europea, Reino Unido…).
 * - Sin `VITE_ADMOB_BANNER_ID` en `.env.local` se usan los anuncios DE PRUEBA de Google
 *   (nunca hacer clic en anuncios reales propios: AdMob puede cerrar la cuenta).
 * - El ID de la APP de AdMob va en android/app/src/main/res/values/strings.xml (admob_app_id).
 *
 * El SDK de Google no es software libre; la licencia de Readora lo permite expresamente
 * (ver LICENSE-EXCEPTION.md).
 */

const TEST_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111'
const BANNER_ID = (import.meta.env.VITE_ADMOB_BANNER_ID as string | undefined) || TEST_BANNER_ID
const IS_TEST = BANNER_ID === TEST_BANNER_ID

export const adsSupported = Capacitor.getPlatform() === 'android'

let ready: Promise<boolean> | null = null
let bannerCreated = false
let privacyOptionsRequired = false

/** Pide el consentimiento (si hace falta) e inicia AdMob. Devuelve si se pueden mostrar anuncios. */
function startAds(): Promise<boolean> {
  if (!adsSupported) return Promise.resolve(false)
  ready ??= (async () => {
    try {
      let info = await AdMob.requestConsentInfo()
      if (info.isConsentFormAvailable && info.status === AdmobConsentStatus.REQUIRED) info = await AdMob.showConsentForm()
      privacyOptionsRequired = info.privacyOptionsRequirementStatus === ('REQUIRED' as typeof info.privacyOptionsRequirementStatus)
      if (!info.canRequestAds) return false
      await AdMob.initialize({ initializeForTesting: IS_TEST })
      // Deja espacio bajo el contenido para que el banner no tape nada (variable CSS --ad-h, usada en App.tsx).
      AdMob.addListener(BannerAdPluginEvents.SizeChanged, ({ height }) => {
        document.documentElement.style.setProperty('--ad-h', `${height}px`)
      })
      return true
    } catch (e) {
      console.warn('AdMob no disponible', e)
      return false
    }
  })()
  return ready
}

/** Muestra el banner mientras `visible` sea true (encima de la barra de pestañas). */
export function useBannerAd(visible: boolean) {
  useEffect(() => {
    if (!adsSupported) return
    let cancelled = false
    startAds().then(async (ok) => {
      if (!ok || cancelled) return
      if (!visible) {
        if (bannerCreated) await AdMob.hideBanner().catch(() => {})
        document.documentElement.style.setProperty('--ad-h', '0px')
        return
      }
      if (bannerCreated) {
        await AdMob.resumeBanner().catch(() => {})
        return
      }
      bannerCreated = true
      const tabBar = document.getElementById('tabbar')
      await AdMob.showBanner({
        adId: BANNER_ID,
        isTesting: IS_TEST,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        // Sobre la barra de pestañas inferior (en el WebView 1 px de CSS = 1 dp).
        margin: tabBar ? Math.round(tabBar.getBoundingClientRect().height) : 0,
      }).catch((e) => {
        bannerCreated = false
        console.warn('No se pudo mostrar el banner', e)
      })
    })
    return () => {
      cancelled = true
    }
  }, [visible])
}

/** ¿Hay que ofrecer "Opciones de privacidad de anuncios" en Ajustes? (exigido en la UE). */
export async function adPrivacyOptionsRequired() {
  if (!(await startAds().catch(() => false)) && !privacyOptionsRequired) return false
  return privacyOptionsRequired
}

export function showAdPrivacyOptions() {
  return AdMob.showPrivacyOptionsForm()
}
