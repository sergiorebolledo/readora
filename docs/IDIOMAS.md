# Idiomas (i18n)

Readora es multilingüe. Usa **i18next** + **react-i18next** y detecta el idioma del sistema.

| Idioma | Archivo |
|---|---|
| Español | [`src/i18n/locales/es.json`](../src/i18n/locales/es.json) |
| English | [`src/i18n/locales/en.json`](../src/i18n/locales/en.json) (idioma de respaldo) |
| Português | [`src/i18n/locales/pt.json`](../src/i18n/locales/pt.json) |
| Français | [`src/i18n/locales/fr.json`](../src/i18n/locales/fr.json) |

## Cómo funciona

- Al abrir la app se usa el idioma guardado en **Ajustes** (`localStorage` → `estante:idioma-app`) o, si no hay, el del sistema (`es-CL` → `es`, `pt-BR` → `pt`). Si no está disponible, se usa inglés.
- En los componentes: `const { t } = useTranslation()` y `t('seccion.clave')`.
- Plurales: claves con `_one` / `_other` (por ejemplo `import.added_one`) y `t('import.added', { count })`.
- Fechas: `toLocaleDateString(locale(), …)` con el idioma actual.
- El idioma de los libros en **Explorar** empieza igual que el de la app (Español, English, Português, Français o todos) y se puede cambiar aparte.
- Los nombres de catálogos (`catalog.<id>`), descripciones de fuentes (`sources.<id>.description` / `.note`) y nombres de idiomas de libros (`bookLangs.<id>`) también se traducen.

## Agregar un idioma

1. Copiar `src/i18n/locales/en.json` a `src/i18n/locales/<código>.json` y traducir los valores (no las claves).
2. En [`src/i18n/index.ts`](../src/i18n/index.ts): importarlo y sumarlo a `resources` y a `LANGUAGES`.
3. Si también se quieren libros en ese idioma en Explorar: sumar el código a `Lang` (`src/sources/types.ts`), a `LANGS` (`src/sources/index.ts`) y su código de 3 letras a `LANG3` en `src/sources/openlibrary.ts`.

Las claves que falten en un idioma se muestran en inglés.

## ¿Y las traducciones de Stremio?

El repositorio [stremio-translations](https://github.com/Stremio/stremio-translations) tiene licencia **MIT** (se puede reutilizar con atribución) y cubre ~60 idiomas. Pero sus ~2.100 textos son casi todos de películas y series ("stream", "subtítulos", "temporada"…), así que se aprovechan pocos. Nos sirve como **referencia** de cómo organizar traducciones comunitarias (un JSON por idioma) y, más adelante, para invitar a la comunidad a traducir (por ejemplo con Weblate o Crowdin).
