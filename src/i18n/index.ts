import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import es from './locales/es.json'
import fr from './locales/fr.json'
import pt from './locales/pt.json'

/**
 * Idiomas de la interfaz. Para agregar uno:
 * 1. Copiar `locales/en.json` a `locales/<código>.json` y traducirlo.
 * 2. Importarlo aquí y sumarlo a `resources` y a `LANGUAGES`.
 * Las claves que falten se muestran en inglés.
 */
export const LANGUAGES = [
  { code: 'es', name: 'Español' },
  { code: 'en', name: 'English' },
  { code: 'pt', name: 'Português' },
  { code: 'fr', name: 'Français' },
] as const

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, es: { translation: es }, pt: { translation: pt }, fr: { translation: fr } },
    fallbackLng: 'en',
    supportedLngs: LANGUAGES.map((l) => l.code),
    // "es-CL" → "es", "pt-BR" → "pt"
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    interpolation: { escapeValue: false },
    detection: { order: ['localStorage', 'navigator'], lookupLocalStorage: 'estante:idioma-app', caches: ['localStorage'] },
    returnObjects: false,
  })

document.documentElement.lang = i18n.resolvedLanguage ?? 'en'
i18n.on('languageChanged', (lng) => (document.documentElement.lang = lng))

/** Idioma actual para formatear fechas con toLocaleDateString, etc. */
export const locale = () => i18n.resolvedLanguage ?? 'en'

export default i18n
