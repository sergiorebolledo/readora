import { BarChart3, Check, Code2, ExternalLink, Heart, Keyboard, Languages, Scale } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { APP_NAME, DONATE_URL, PRIVACY_URL, SOURCE_URL } from '../brand'
import { adPrivacyOptionsRequired, adsSupported, showAdPrivacyOptions } from '../lib/ads'
import { analyticsAvailable, setConsent, track } from '../lib/analytics'
import { LANGUAGES } from '../i18n'
import { LANGS } from '../sources'
import { useConsent } from './ConsentBanner'
import { ShortcutsTable } from './ShortcutsHelp'

const LICENSE_URL = 'https://github.com/sergiorebolledo/readora/blob/main/LICENSE-EXCEPTION.md'

const CREDITS = [
  { name: 'Stremio', url: 'https://github.com/Stremio/stremio-web' },
  { name: 'Project Gutenberg', url: 'https://www.gutenberg.org' },
  { name: 'Open Library', url: 'https://openlibrary.org' },
  { name: 'Lucide', url: 'https://lucide.dev' },
  { name: 'PDF.js', url: 'https://mozilla.github.io/pdf.js/' },
  { name: 'epub.js', url: 'https://github.com/futurepress/epub.js' },
]

/** Página "Ajustes": idioma de la app, acerca de y créditos. */
export function SettingsPage() {
  const { t, i18n } = useTranslation()
  const current = i18n.resolvedLanguage

  function changeLanguage(code: string) {
    i18n.changeLanguage(code)
    track('language_changed', { language: code })
    // El idioma de los libros en Explorar acompaña al de la app (se puede cambiar después en Explorar).
    if ((LANGS as string[]).includes(code)) localStorage.setItem('estante:explorar:idioma', JSON.stringify(code))
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-8 sm:px-8">
      <h1 className="text-2xl font-bold">{t('settings.title')}</h1>

      <section className="mt-8">
        <h2 className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent-2">
          <Languages className="h-4 w-4" /> {t('settings.language')}
        </h2>
        <p className="mb-3 text-sm text-muted">{t('settings.languageHelp')}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label={t('settings.language')}>
          {LANGUAGES.map((l) => {
            const on = current === l.code
            return (
              <button
                key={l.code}
                role="radio"
                aria-checked={on}
                lang={l.code}
                onClick={() => changeLanguage(l.code)}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                  on ? 'border-accent bg-accent/20 font-semibold' : 'border-line bg-surface hover:bg-surface-2'
                }`}
              >
                {l.name}
                {on && <Check className="h-4 w-4 text-accent-2" />}
              </button>
            )
          })}
        </div>
      </section>

      {/* Atajos de teclado: solo en pantallas grandes (en el celular no hay teclado físico). */}
      <section className="mt-10 hidden sm:block">
        <h2 className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent-2">
          <Keyboard className="h-4 w-4" /> {t('shortcuts.title')}
        </h2>
        <p className="mb-4 text-sm text-muted">{t('shortcuts.hint')}</p>
        <div className="rounded-2xl border border-line bg-surface p-5">
          <ShortcutsTable />
        </div>
      </section>

      <section className="mt-10 flex items-center gap-4 rounded-2xl border border-line bg-surface p-5">
        <img src="/logo.svg" alt="" className="h-16 w-16 rounded-2xl shadow-lg shadow-accent/30" />
        <div>
          <h2 className="text-lg font-bold">
            {APP_NAME} <span className="text-sm font-normal text-muted">v{__APP_VERSION__}</span>
          </h2>
          <p className="text-sm text-muted">{t('settings.aboutText', { name: APP_NAME })}</p>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent-2">
          <Scale className="h-4 w-4" /> {t('settings.license')}
        </h2>
        <p className="text-sm text-muted">{t('settings.licenseText', { name: APP_NAME })}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href={SOURCE_URL} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-sm font-semibold shadow-lg shadow-accent/30 hover:bg-accent-2">
            <Code2 className="h-4 w-4" /> {t('settings.sourceLink')}
          </a>
          <a href={LICENSE_URL} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-full border border-line px-4 py-1.5 text-sm text-muted hover:text-white">
            {t('settings.licenseLink')} (GPL-3.0) <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </section>

      {DONATE_URL && (
        <section className="mt-8 flex items-center gap-4 rounded-2xl border border-accent/40 bg-accent/10 p-5">
          <Heart className="h-6 w-6 shrink-0 text-pink-300" />
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold">{t('settings.donateTitle')}</h2>
            <p className="text-sm text-muted">{t('settings.donateText', { name: APP_NAME })}</p>
          </div>
          <a href={DONATE_URL} target="_blank" rel="noreferrer" className="shrink-0 rounded-full bg-pink-400 px-4 py-2 text-sm font-semibold text-black hover:bg-pink-300">
            {t('settings.donateButton')}
          </a>
        </section>
      )}

      <PrivacySection />

      <section className="mt-8">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent-2">{t('settings.credits')}</h2>
        <p className="text-sm text-muted">{t('settings.creditsText')}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {CREDITS.map((c) => (
            <a key={c.name} href={c.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-full bg-surface px-3 py-1 text-xs text-muted hover:bg-surface-2 hover:text-white">
              {c.name} <ExternalLink className="h-3 w-3" />
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}

/** Privacidad: permiso de estadísticas anónimas y enlace a la política. */
function PrivacySection() {
  const { t } = useTranslation()
  const consent = useConsent()
  const on = consent === 'granted'
  const [adOptions, setAdOptions] = useState(false)
  useEffect(() => {
    if (adsSupported) adPrivacyOptionsRequired().then(setAdOptions)
  }, [])
  return (
    <section className="mt-8">
      <h2 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent-2">
        <BarChart3 className="h-4 w-4" /> {t('privacy.title')}
      </h2>
      {analyticsAvailable && (
        <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-line bg-surface p-4">
          <span>
            <span className="block text-sm font-semibold">{t('privacy.settingTitle')}</span>
            <span className="mt-0.5 block text-sm text-muted">{t('privacy.settingText')}</span>
          </span>
          <button
            role="switch"
            aria-checked={on}
            onClick={() => setConsent(on ? 'denied' : 'granted')}
            className={`relative mt-1 h-6 w-11 shrink-0 rounded-full transition-colors ${on ? 'bg-accent' : 'bg-surface-2'}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
          </button>
        </label>
      )}
      {adOptions && (
        <button onClick={() => showAdPrivacyOptions()} className="mt-3 rounded-full border border-line px-4 py-1.5 text-sm hover:bg-surface-2">
          {t('privacy.adOptions')}
        </button>
      )}
      <p className="mt-2 text-sm text-muted">
        {t('privacy.adsNote')}{' '}
        <a href={PRIVACY_URL} target="_blank" rel="noreferrer" className="text-accent-2 hover:text-white">
          {t('privacy.policyLink')}
        </a>
      </p>
    </section>
  )
}
