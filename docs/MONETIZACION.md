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

✅ Configurado el 2026-11-08: proyecto en la región **UE**, clave en `.env.local` del PC de compilación.

> ⚠️ **Comprobar la región de la clave.** Una clave de un proyecto de EE. UU. enviada a `eu.i.posthog.com` recibe igual **200 OK**, pero los eventos se pierden. Para saber de qué región es una clave:
>
> ```bash
> curl -s -o /dev/null -w "%{http_code}" -X POST "https://eu.i.posthog.com/flags/?v=2" -H "Content-Type: application/json" -d '{"api_key":"phc_TU_CLAVE","distinct_id":"prueba"}'
> ```
>
> 200 = proyecto UE · 401 = la clave no es de la UE (probar con `us.i.posthog.com`).

> PostHog muestra durante el registro varios asistentes ("Install Logs", "Workflows", `npx @posthog/wizard`…). **No hay que instalarlos**: modificarían el código y Readora ya trae su integración. La clave sale con el botón **"Copy project token"**.

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

PostHog (MIT/Apache-2.0) y el plugin de RevenueCat (MIT) son libres. El SDK de Google Mobile Ads, UMP, Google Play Billing y el SDK de Steamworks no lo son. Por eso la licencia de Readora (GPL-3.0) trae una **excepción** que permite enlazarlos: ver [LICENSE-EXCEPTION.md](../LICENSE-EXCEPTION.md).
