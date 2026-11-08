# Analítica, anuncios y donaciones

Readora es gratis. Para sostenerla y saber cómo se usa tiene tres piezas, todas opcionales y configurables con `.env.local` (copiar de [`.env.example`](../.env.example); ese archivo no se sube a git).

| Pieza | Servicio | Dónde | Archivo |
|---|---|---|---|
| Estadísticas de uso | [Firebase / Google Analytics](https://firebase.google.com/products/analytics) (gratis) | Web, Android, PC | `src/lib/analytics.ts` |
| Anuncios | [Google AdMob](https://admob.google.com) | Solo Android | `src/lib/ads.ts` |
| Donaciones | GitHub Sponsors, Ko-fi… (un enlace) | Todas | `src/brand.ts` (`DONATE_URL`) |

La política de privacidad pública está en [PRIVACIDAD.md](PRIVACIDAD.md). Google Play pide su enlace. Cómo publicar en cada tienda: [PUBLICAR.md](PUBLICAR.md).

> **Steam prohíbe los anuncios** y en PC no hay SDK de AdMob: la versión de escritorio se sostiene solo con donaciones.

## Analítica (Firebase / Google Analytics)

Hasta la 0.2.0 se usaba PostHog (UE). Desde la 0.2.1 se usa **Firebase** (proyecto `readora-c6e11`, cuenta de Google Analytics "Sergio Rebolledo"): es gratis, sin límite de eventos, y trae listos los informes de versiones, países y dispositivos.

- **Opt-in**: nada se envía hasta que la persona acepta el aviso "¿Nos ayudas a mejorar Readora?". Se puede cambiar en Ajustes → Privacidad. La decisión se guarda en `localStorage` (`estante:analitica-firebase`). Quien había aceptado PostHog vuelve a ver el aviso; quien había dicho que no, sigue en "no".
- **Android**: SDK nativo con `@capacitor-firebase/analytics`. La recolección viene **apagada en `AndroidManifest.xml`** (`firebase_analytics_collection_enabled=false`) y solo se enciende con permiso. También apagados: ID de publicidad (`google_analytics_adid_collection_enabled`), SSAID, personalización de anuncios y registro automático de pantallas. Al rechazar se llama a `resetAnalyticsData` (borra el identificador de instalación).
- **PC y web**: SDK de JavaScript (`firebase`), que **ni se descarga** hasta que la persona acepta. Modo de consentimiento con anuncios denegados (`ad_storage`, `ad_user_data`, `ad_personalization` = denied), dirección fija (`page_location` = origen, sin el `#/…` que lleva identificadores de libros) y título fijo "Readora".
- **Sin configuración no hay analítica**: sin `VITE_FIREBASE_APP_ID` y `VITE_FIREBASE_MEASUREMENT_ID` en `.env.local`, el aviso no aparece. En Android además hace falta `android/app/google-services.json` (no se sube a git; sin él el plugin de Google Services no se aplica).
- **Solo eventos manuales**. Google Analytics solo admite textos y números: las listas se envían unidas por comas y los sí/no como `"true"`/`"false"`. Firebase agrega por su cuenta `first_open`, `session_start` y `user_engagement`.

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
| `highlight_created` | color, with_note | `Reader.tsx` |
| `premium_purchase` | result | `premium.ts` |
| `explore_searched` | language (nunca el texto buscado) | `Explore.tsx` |
| `source_toggled` | source, enabled | `sources/index.ts` |
| `language_changed` | language | `SettingsPage.tsx` |
| `shortcut_used` | shortcut (sin pasar página) | `Shortcuts.tsx` |

**Regla**: nunca enviar títulos, autores, nombres de archivo, texto de búsquedas ni contenido de libros. Si se agrega un evento, sumarlo al tipo `Events` y a la lista de [PRIVACIDAD.md](PRIVACIDAD.md).

### Configurar

1. https://console.firebase.google.com → proyecto con Google Analytics activado.
2. Agregar una app **Android** con el paquete `app.readora` → descargar `google-services.json` a `android/app/`.
3. Agregar una app **web** → copiar los valores de `firebaseConfig` a `.env.local` (`VITE_FIREBASE_*`, ver `.env.example`). Son públicos (van dentro de la app), pero se dejan fuera del código para que las copias no envíen datos a nuestra cuenta.
4. `npm run build` (o reiniciar `npm run dev`).
5. Ver los eventos al momento: Firebase console → Analytics → **DebugView**. En el emulador o teléfono de pruebas:
   ```bash
   adb shell setprop debug.firebase.analytics.app app.readora
   ```
   (para apagarlo: `adb shell setprop debug.firebase.analytics.app .none.`). Los informes normales tardan hasta 24 h.

✅ Configurado el 2026-11-08: proyecto `readora-c6e11`, app Android `app.readora`, app web "Readora Web y escritorio" (`G-T6T1QHBWFE`). Probado en web (eventos a `google-analytics.com` con `npa=1`) y en el emulador Android (`screen_viewed` enviado; sin ID de publicidad; al rechazar se apaga y se borra).

## Anuncios (AdMob, solo Android)

- **Un solo banner adaptable**, encima de la barra de pestañas y **solo en Inicio y Explorar**. Nunca aparece en el lector ni en Ajustes.
- El contenido deja espacio para el banner con la variable CSS `--ad-h`.
- **Consentimiento**: antes de pedir anuncios se usa el formulario oficial de Google (UMP) cuando la ley lo exige (UE, Reino Unido…).
  - En Ajustes → Privacidad aparece "Opciones de privacidad de anuncios" si Google lo pide.
  - El formulario se diseña en la consola de AdMob, en "Privacidad y mensajes".
- **Sin `VITE_ADMOB_BANNER_ID` se usan los anuncios DE PRUEBA de Google.** Nunca tocar anuncios reales propios: AdMob puede cerrar la cuenta.

### Configurar

1. Crear la cuenta en https://admob.google.com y agregar la app Android `app.readora`.
2. Copiar el **ID de la app** (`ca-app-pub-XXXX~YYYY`) en `android/app/src/main/res/values/strings.xml` → `admob_app_id`. ✅ Hecho (2026-11-08): `ca-app-pub-7176254903754964~3796187388`.
3. ✅ Hecho (2026-11-08): bloque **Banner** `ca-app-pub-7176254903754964/1956492108`, guardado en `.env.local` del PC de compilación (ese archivo no se sube a git: en otro PC hay que crearlo de nuevo). Crear un bloque de anuncios de tipo **Banner** y poner su ID (`ca-app-pub-XXXX/ZZZZ`) en `.env.local` como `VITE_ADMOB_BANNER_ID`.
4. Crear el mensaje de consentimiento GDPR en "Privacidad y mensajes".
   - Sin él, Google responde *"no form(s) configured for the input app ID"*.
   - Desde el 2026-11-08 la app igual pide anuncios en ese caso, pero en Europa no podrá pedir permiso y saldrán pocos anuncios o ninguno.

> ⚠️ El bloque debe ser **Banner**, no "Nativo avanzado": el plugin de Readora solo muestra banners y un ID nativo no da anuncios.
5. Publicar `app-ads.txt` cuando la app esté en Google Play.
6. Para probar con anuncios reales en tu teléfono, regístralo como dispositivo de prueba en AdMob.

## Suscripción "sin anuncios" (Google Play + RevenueCat)

Por **2 USD al mes**, la persona no ve anuncios. La suscripción se renueva sola y se cancela desde Google Play. Google se queda con el 15 %.

- Código: [`src/lib/premium.ts`](../src/lib/premium.ts) (estado y compra) y [`PremiumSection.tsx`](../src/components/PremiumSection.tsx) (Ajustes).
- Con la suscripción activa, `App.tsx` no muestra el banner, y AdMob ni siquiera se inicia (no aparece el formulario de consentimiento de anuncios).
- RevenueCat verifica el pago en sus servidores. La app guarda el último estado para que quien pagó no vea un anuncio al abrir sin internet.
- Sin `VITE_REVENUECAT_KEY` la sección no aparece.
- Plan gratis de RevenueCat: hasta 2.500 USD de ingresos al mes.

### Configurar (en este orden)

1. **Play Console → Configuración → Perfil de pagos**: crear el perfil de comerciante (datos bancarios y fiscales). Sin él no se puede cobrar.
2. **Subir la app a Play Console**, al menos a "Prueba interna". Los productos solo se pueden crear después de subir un `.aab` que incluya la librería de cobros, cosa que esta versión ya hace. Ver [PUBLICAR.md](PUBLICAR.md).
3. **Play Console → Monetizar → Suscripciones → Crear suscripción**:
   - ID del producto: `readora_sin_anuncios`.
   - Nombre: "Readora sin anuncios".
   - Plan base: ID `mensual`, renovación automática **mensual**, precio **2 USD**. Play convierte el precio a cada moneda.
   - Activar el plan base.
4. **RevenueCat** (https://app.revenuecat.com):
   1. Crear el proyecto "Readora" y agregar una app **Google Play** con el paquete `app.readora`.
   2. Subir las **credenciales de cuenta de servicio** de Google (archivo JSON). RevenueCat explica paso a paso cómo crearlas en Google Cloud y darles acceso en Play Console. Pueden tardar hasta 36 horas en activarse.
   3. **Product catalog → Entitlements**: crear el permiso con identificador exacto `sin_anuncios`.
   4. **Products**: importar `readora_sin_anuncios:mensual` y asignarlo al permiso `sin_anuncios`.
   5. **Offerings**: en la oferta `default` (marcada como actual), agregar un paquete **Monthly** con ese producto.
   6. **API keys**: copiar la clave **pública** de Android (empieza con `goog_`) a `.env.local` como `VITE_REVENUECAT_KEY`.
5. **Probar sin Google Play** (opcional): RevenueCat → API keys → clave de **Test Store** (empieza con `test_`).
   - Úsala solo al compilar, sin guardarla: `VITE_REVENUECAT_KEY=test_… npm run build`.
   - Muestra un diálogo de compra simulada ("Test valid purchase").
   - **Nunca** la publiques: RevenueCat cierra la app si la detecta en producción.
   - El permiso puede llamarse `sin_anuncios` u otro nombre (p. ej. `readora_pro`): la app acepta cualquier permiso activo.
6. **Probar**: en Play Console → Configuración → **Pruebas de licencia**, agregar tu cuenta de Gmail.
   - Instala la app desde el enlace de la prueba interna (no por cable).
   - Las compras de prueba no se cobran y las suscripciones de prueba se renuevan cada pocos minutos.

## Donaciones

Poner el enlace en `.env.local` como `VITE_DONATE_URL=https://ko-fi.com/…` (o GitHub Sponsors). Con el enlace puesto aparece la tarjeta "Apoya a Readora" en Ajustes. También se puede crear `.github/FUNDING.yml` para que GitHub muestre el botón "Sponsor".

> Google Play no permite donaciones con enlaces externos si a cambio se da algo dentro de la app. Un enlace de donación simple, sin recompensa, está permitido.

## Licencia

El SDK de JavaScript de Firebase (Apache-2.0), su plugin de Capacitor (MIT) y el plugin de RevenueCat (MIT) son libres. El SDK de Firebase Analytics para Android, el SDK de Google Mobile Ads, UMP, Google Play Billing y el SDK de Steamworks no lo son. Por eso la licencia de Readora (GPL-3.0) trae una **excepción** que permite enlazarlos: ver [LICENSE-EXCEPTION.md](../LICENSE-EXCEPTION.md).
