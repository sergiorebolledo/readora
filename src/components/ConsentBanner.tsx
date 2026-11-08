import { BarChart3 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PRIVACY_URL } from '../brand'
import { analyticsAvailable, getConsent, setConsent, type Consent } from '../lib/analytics'

/** Estado del permiso de estadísticas, actualizado cuando cambia (aviso inicial o Ajustes). */
export function useConsent() {
  const [consent, set] = useState<Consent>(getConsent)
  useEffect(() => {
    const update = () => set(getConsent())
    window.addEventListener('readora:consent', update)
    return () => window.removeEventListener('readora:consent', update)
  }, [])
  return consent
}

/** Pregunta una sola vez si la persona quiere compartir estadísticas anónimas. */
export function ConsentBanner() {
  const { t } = useTranslation()
  const consent = useConsent()
  if (!analyticsAvailable || consent !== 'unset') return null

  return (
    <div role="dialog" aria-labelledby="consent-title" className="fixed inset-x-3 bottom-[calc(6rem+var(--ad-h,0px))] z-50 rounded-2xl border border-line bg-surface-2 p-4 shadow-2xl sm:bottom-6 sm:left-24 sm:right-auto sm:max-w-md">
      <div className="flex gap-3">
        <BarChart3 className="mt-0.5 h-5 w-5 shrink-0 text-accent-2" />
        <div className="min-w-0">
          <p id="consent-title" className="font-semibold">
            {t('privacy.bannerTitle')}
          </p>
          <p className="mt-1 text-sm text-muted">
            {t('privacy.bannerText')}{' '}
            <a href={PRIVACY_URL} target="_blank" rel="noreferrer" className="text-accent-2 underline-offset-2 hover:underline">
              {t('privacy.policyLink')}
            </a>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => setConsent('granted')} className="rounded-full bg-accent px-4 py-1.5 text-sm font-semibold hover:bg-accent-2">
              {t('privacy.accept')}
            </button>
            <button onClick={() => setConsent('denied')} className="rounded-full border border-line px-4 py-1.5 text-sm text-muted hover:text-white">
              {t('privacy.decline')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
