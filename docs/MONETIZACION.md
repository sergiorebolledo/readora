# Analítica, anuncios y donaciones

Readora es gratis. Para sostenerla y saber cómo se usa tiene tres piezas, todas opcionales y configurables con `.env.local` (copiar de [`.env.example`](../.env.example); ese archivo no se sube a git).

| Pieza | Servicio | Dónde | Archivo |
|---|---|---|---|
| Estadísticas de uso | [PostHog](https://posthog.com) (plan gratis: 1 millón de eventos al mes) | Web, Android, PC | `src/lib/analytics.ts` |
| Anuncios | [Google AdMob](https://admob.google.com) | Solo Android | `src/lib/ads.ts` |
| Donaciones | GitHub Sponsors, Ko-fi… (un enlace) | Todas | `src/brand.ts` (`DONATE_URL`) |

La política de privacidad pública está en [PRIVACIDAD.md](PRIVACIDAD.md). Google Play pide su enlace. Cómo publicar en cada tienda: [PUBLICAR.md](PUBLICAR.md).

> **Steam prohíbe los anuncios** y en PC no hay SDK de AdMob: la versión de escritorio se sostiene solo con donaciones.

## Analítica (PostHog)

- **Opt-in**: nada se envía hasta que la persona acepta el aviso "¿Nos ayudas a mejorar Readora?". Se puede cambiar en Ajustes → Privacidad. La decisión se guarda en `localStorage` (`estante:analitica`).
- **Sin clave no hay analítica**: si `VITE_POSTHOG_KEY` está vacío, PostHog ni se descarga y el aviso no aparece.
- **Solo eventos manuales**:
  - sin autocaptura de clics;
  - sin grabación de sesiones;
  - sin encuestas.
  - `before_send` borra las URLs.
- **Servidor en la UE**: `https://eu.i.posthog.com`; se cambia con `VITE_POSTHOG_HOST`.

### Eventos

| Evento | Propiedades | Dónde se envía |
|---|---|---|
| `app_opened` | platform, language, version | `initAnalytics` |
| `screen_viewed` | screen | `App.tsx` |
| `books_imported` | added, duplicated, unsupported, formats | `Importer.tsx` |
| `book_downloaded` / `book_download_failed` | source, format, other_language | `ItemDetail.tsx` |
| `book_opened` | format | `Reader.tsx` |
| `reading_session` | format, minutes, pages | `Reader.tsx` |
| `book_finished` | format | `db.ts` |
| `reminder_created` | days, for_book | `Reminders.tsx` |
| `explore_searched` | language (nunca el texto buscado) | `Explore.tsx` |
| `source_toggled` | source, enabled | `sources/index.ts` |
| `language_changed` | language | `SettingsPage.tsx` |
| `shortcut_used` | shortcut (sin pasar página) | `Shortcuts.tsx` |

**Regla**: nunca enviar títulos, autores, nombres de archivo, texto de búsquedas ni contenido de libros. Si se agrega un evento, sumarlo al tipo `Events` y a la lista de [PRIVACIDAD.md](PRIVACIDAD.md).

### Configurar

1. Crear una cuenta en https://eu.posthog.com (región UE) y un proyecto "Readora".
2. Copiar la *Project API key* (`phc_…`) en `.env.local` como `VITE_POSTHOG_KEY=phc_…`.
3. `npm run build` (o reiniciar `npm run dev`). Los eventos se ven en PostHog → Activity.

## Anuncios (AdMob, solo Android)

- **Un solo banner adaptable**, encima de la barra de pestañas y **solo en Inicio y Explorar**. Nunca aparece en el lector ni en Ajustes.
- El contenido deja espacio para el banner con la variable CSS `--ad-h`.
- **Consentimiento**: antes de pedir anuncios se usa el formulario oficial de Google (UMP) cuando la ley lo exige (UE, Reino Unido…).
  - En Ajustes → Privacidad aparece "Opciones de privacidad de anuncios" si Google lo pide.
  - El formulario se diseña en la consola de AdMob, en "Privacidad y mensajes".
- **Sin `VITE_ADMOB_BANNER_ID` se usan los anuncios DE PRUEBA de Google.** Nunca tocar anuncios reales propios: AdMob puede cerrar la cuenta.

### Configurar

1. Crear la cuenta en https://admob.google.com y agregar la app Android `app.readora`.
2. Copiar el **ID de la app** (`ca-app-pub-XXXX~YYYY`) en `android/app/src/main/res/values/strings.xml` → `admob_app_id`. Ahora tiene el ID de prueba.
3. Crear un bloque de anuncios **Banner** y poner su ID (`ca-app-pub-XXXX/ZZZZ`) en `.env.local` como `VITE_ADMOB_BANNER_ID`.
4. Crear el mensaje de consentimiento GDPR en "Privacidad y mensajes".
5. Publicar `app-ads.txt` cuando la app esté en Google Play.
6. Para probar con anuncios reales en tu teléfono, regístralo como dispositivo de prueba en AdMob.

## Donaciones

Poner el enlace en `.env.local` como `VITE_DONATE_URL=https://ko-fi.com/…` (o GitHub Sponsors). Con el enlace puesto aparece la tarjeta "Apoya a Readora" en Ajustes. También se puede crear `.github/FUNDING.yml` para que GitHub muestre el botón "Sponsor".

> Google Play no permite donaciones con enlaces externos si a cambio se da algo dentro de la app. Un enlace de donación simple, sin recompensa, está permitido.

## Licencia

PostHog (MIT/Apache-2.0) es libre. El SDK de Google Mobile Ads, UMP y el SDK de Steamworks no lo son. Por eso la licencia de Readora (GPL-3.0) trae una **excepción** que permite enlazarlos: ver [LICENSE-EXCEPTION.md](../LICENSE-EXCEPTION.md).
