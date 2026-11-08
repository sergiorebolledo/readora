import { Check, ExternalLink, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { locale } from '../i18n'
import { buyPremium, premiumSupported, restorePremium, usePremium } from '../lib/premium'

/** Ajustes → "Readora sin anuncios" (suscripción mensual, solo Android). */
export function PremiumSection() {
  const { t } = useTranslation()
  const premium = usePremium()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  if (!premiumSupported) return null

  const date = premium.expires ? new Date(premium.expires).toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' }) : ''

  async function buy() {
    setBusy(true)
    setMessage(null)
    try {
      if ((await buyPremium()) === 'success') setMessage({ kind: 'ok', text: t('premium.thanks') })
    } catch (e) {
      const msg = (e as Error).message
      setMessage({ kind: 'error', text: msg === 'unavailable' ? t('premium.unavailable') : t('premium.error', { message: msg }) })
    } finally {
      setBusy(false)
    }
  }

  async function restore() {
    setBusy(true)
    setMessage(null)
    try {
      setMessage((await restorePremium()) ? { kind: 'ok', text: t('premium.restored') } : { kind: 'error', text: t('premium.notFound') })
    } catch {
      setMessage({ kind: 'error', text: t('premium.unavailable') })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section id="sin-anuncios" className="mt-8 rounded-2xl border border-accent/40 bg-accent/10 p-5">
      <h2 className="flex items-center gap-2 font-semibold">
        <Sparkles className="h-5 w-5 text-accent-2" /> {t('premium.title')}
      </h2>

      {premium.active ? (
        <>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-emerald-300">
            <Check className="h-4 w-4" /> {t('premium.active')}
          </p>
          {date && <p className="mt-1 text-sm text-muted">{premium.willRenew ? t('premium.renews', { date }) : t('premium.until', { date })}</p>}
          <a href={premium.manageUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 rounded-full border border-line px-4 py-1.5 text-sm hover:bg-surface-2">
            {t('premium.manage')} <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </>
      ) : (
        <>
          <p className="mt-2 text-sm text-muted">{premium.price ? t('premium.text', { price: premium.price }) : t('premium.textNoPrice')}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={buy}
              disabled={busy || !premium.price}
              className="rounded-full bg-accent px-5 py-2 text-sm font-semibold shadow-lg shadow-accent/30 hover:bg-accent-2 disabled:opacity-50"
            >
              {premium.price ? t('premium.buy', { price: premium.price }) : premium.ready ? t('premium.unavailableShort') : t('common.loading')}
            </button>
            <button onClick={restore} disabled={busy} className="rounded-full px-3 py-2 text-sm text-muted hover:text-white disabled:opacity-50">
              {t('premium.restore')}
            </button>
          </div>
          <p className="mt-2 text-xs text-muted">{t('premium.terms')}</p>
        </>
      )}

      {message && (
        <p role="status" className={`mt-3 text-sm ${message.kind === 'ok' ? 'text-emerald-300' : 'text-red-300'}`}>
          {message.text}
        </p>
      )}
    </section>
  )
}
