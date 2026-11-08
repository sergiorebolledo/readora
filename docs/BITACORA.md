# Bitácora de desarrollo

Registro de lo hecho en cada sesión de trabajo (lo más reciente arriba).

## 2026-11-08 (12) — RevenueCat conectado con Google Play

- El usuario subió la clave JSON de la cuenta de servicio a la app de Google Play en RevenueCat (`app182759b469`, paquete `app.readora`). RevenueCat la marca como **"Valid credentials"**.
- **Products → Import**: se importó `readora_sin_anuncios:mensual` desde Google Play (estado "Published").
- **Entitlements → `sin_anuncios`**: se le asignó `readora_sin_anuncios:mensual`.
- **Offerings → `default` → paquete Monthly (`$rc_monthly`)**: producto de Google Play `readora_sin_anuncios:mensual`. Mantiene también el `monthly` de Test Store para pruebas.
- Queda un producto antiguo mal creado, `readora_sin_anuncios` con identificador `default:default` (estado "Not found"). Se puede borrar desde Products; no afecta.
- Opcional pendiente: "Google developer notifications" (Pub/Sub). Sirve para que RevenueCat se entere al instante de renovaciones y cancelaciones; sin esto se entera igual, pero con retraso.

## 2026-11-08 (11) — Declaraciones de "Contenido de la aplicación" en Play Console

Completadas en el navegador de la app, con la sesión del usuario y su confirmación. Play Console quedó en "Ya estás al día".

| Declaración | Respuesta |
|---|---|
| Política de privacidad | `https://github.com/sergiorebolledo/readora/blob/main/docs/PRIVACIDAD.md` |
| Datos de inicio de sesión | No: ninguna parte de la app está restringida |
| Anuncios | Sí, contiene anuncios |
| ID de publicidad | Sí: análisis y publicidad (SDK de AdMob) |
| Aplicaciones gubernamentales | No |
| Funciones financieras | Ninguna |
| Salud | Ninguna |
| Estado de operador | Sí, se aplica (la cuenta está declarada como operador); sin URL de términos |
| Audiencia objetivo | 13-15, 16-17 y 18+ (no dirigida a niños) |
| Categoría | Libros y obras de consulta |
| Contacto | `srebolledolopez@gmail.com` y la web del repositorio (puesto por la API) |

**Clasificación de contenido (IARC)**
- Categoría "Todos los demás tipos de aplicaciones".
- El paquete de la app no trae contenido sujeto a clasificación.
- Sí hay **contenido en línea**: el catálogo de Gutenberg y Open Library. Se declaró, con honestidad, que puede incluir:
  - violencia, sexualidad, lenguaje ofensivo (leve, moderado y discriminatorio) y referencias a drogas;
  - solo en texto, no como imágenes, y sin ser el objetivo de la app.
- Se pueden comprar contenidos digitales (la suscripción), sin cajas de botín.
- Resultado: ESRB 13+, ClassInd 14+, USK 12, PEGI "supervisión parental", IARC genérico 12+.

**Seguridad de los datos**
- Se recogen datos; van cifrados en tránsito; la app no tiene cuentas.
- **Historial de compras**: se recoge (RevenueCat), no se comparte. Es opcional y sirve para la funcionalidad y para prevenir fraudes.
- **Interacciones con la app, registros de fallos, diagnósticos e ID de dispositivo**: se recogen y se comparten (AdMob y PostHog). Son necesarios y sirven para análisis, publicidad y prevención de fraudes.

## 2026-11-08 (10) — Ficha de Play completa y suscripción creada

**Ficha de la tienda** (subida por la API, en `en-US`, `es-419`, `es-ES`, `pt-BR` y `fr-FR`)
- Título, descripción corta y descripción completa: [`store/play/listings.json`](../store/play/listings.json).
- Icono de 512 px y banner de 1024×500 (`store/play/feature-1024x500.png`).
- 4 capturas por idioma (`store/play/<idioma>/shot-1..4.png`): Inicio, Explorar, lector y Biblioteca, con texto arriba.
  - Se tomaron en el emulador, con libros de dominio público descargados desde la misma app.
  - Para las fotos se ocultó el banner de anuncios (`AdMob.hideBanner()` desde DevTools), como pidió el usuario.
  - Historial quedó fuera: con 2 minutos de lectura se veía vacío.

**Suscripción `readora_sin_anuncios`**
- El usuario creó el perfil de pagos.
- Creada y **activada** por la API: plan base `mensual`, P1M, 2 USD.
  - Precios convertidos por Google a 174 regiones (p. ej. CLP 2.000 y MXN 43). Para otras regiones: 2 USD / 2 EUR.
  - Ficha de la suscripción en 5 idiomas.
- Detalle técnico: hay que crear con la versión de regiones que devuelve `pricing:convertRegionPrices` (era `2026/01`). Con `2022/02` falla: "Expected USD but got ARS".

**Pendiente (usuario)**
- RevenueCat:
  - subir el JSON de la cuenta de servicio;
  - importar `readora_sin_anuncios:mensual`;
  - asignarlo al permiso;
  - agregarlo a la oferta `default` como Monthly.
- Formularios de Play Console (contenido de la app, seguridad de los datos) antes de pasar a producción.

## 2026-11-08 (9) — App creada en Play Console; logo subido por la API

**Comprobado con la API de Google Play** (cuenta de servicio `gplay-967`)
- Hay acceso a `app.readora`.
- Prueba interna: versión 2 (0.2.0) en estado "completed".
- El bundle subido es idéntico al generado aquí (SHA-256 `a4e09fd1…`).
- Idioma predeterminado de la ficha: `en-US`. Solo tenía el título, sin descripciones ni imágenes.

**Hecho**
- Icono de tienda de 512×512 en [`store/play/icon-512.png`](../store/play/icon-512.png), subido a la ficha.
  - Es cuadrado completo (Play redondea las esquinas solo).
  - Se armó con las capas de fondo y frente del icono adaptable, con el libro más grande.
- Scripts de la API (fuera del repo, en el directorio temporal de la sesión):
  - firman un JWT con la clave de la cuenta de servicio;
  - usan `edits` para la ficha y `subscriptions` para productos.

**Bloqueado**
- No se pudo crear la suscripción `readora_sin_anuncios`. Google responde: *"Cannot create a subscription without first registering a payments profile for the developer account."*
- Falta que el usuario cree el **perfil de pagos**, con datos bancarios y fiscales que solo puede ingresar él. Después la suscripción se crea por la API en un minuto.

## 2026-11-08 (8) — Clave de firma, cuenta de servicio y primer .aab

**Hecho**
- Cuenta de servicio de Google Cloud `gplay-967@project-1f53a53d-dc65-4cd1-b3d.iam.gserviceaccount.com`.
  - Su clave JSON está en `C:\Users\srebo\claves\` (fuera del repositorio).
  - Probada: Google entrega el token y la API de Play responde. Contesta "Package not found" porque la app aún no existe en Play Console.
- **Clave de subida** `readora-upload.jks` (alias `readora`) creada en `C:\Users\srebo\claves\`.
  - La contraseña es aleatoria. Está en `readora-upload-CONTRASEÑA.txt` (misma carpeta) y en `android/keystore.properties`, que git ignora.
  - Hay que guardar una copia de los dos archivos fuera del PC.
  - Por qué la creé yo: `keytool` daba "token inesperado" en PowerShell.
- Primer `.aab` firmado: `C:\Users\srebo\claves\Readora-0.2.0.aab` (versión 0.2.0, código 2).

**Pendiente (usuario)**
- Crear la app en Play Console y subir ese `.aab` a prueba interna.
- Dar permisos a la cuenta de servicio en Play Console → Usuarios y permisos.

## 2026-11-08 (7) — RevenueCat conectado y probado en el emulador

**Hecho**
- Clave pública de Android (`goog_…`) guardada en `.env.local` (solo en este PC, no se sube a GitHub).
- Probado con la clave de **Test Store** de RevenueCat (compras simuladas), solo en una compilación de prueba:
  - el precio aparece en Ajustes;
  - "Test valid purchase" activa la suscripción;
  - Ajustes muestra "Activo" con la fecha de renovación;
  - el banner desaparece de Inicio.
- La versión normal se compiló de nuevo con la clave `goog_`. Se comprobó que la clave de Test Store **no** está en `dist` ni en el APK.

**Errores encontrados y corregidos**
- `"Purchases.then()" is not implemented on android`: el plugin de Capacitor es un proxy y no se puede devolver desde una promesa. Ahora se guarda en una variable del módulo.
- El permiso del proyecto de RevenueCat se llama `readora_pro`, no `sin_anuncios`. Como Readora solo vende "sin anuncios", ahora vale cualquier permiso activo (primero `sin_anuncios`).
- El mensaje "¡Gracias!" salía aunque la compra no activara ningún permiso. Ahora solo sale si el permiso queda activo; si no, se muestra un error.

**Importante**
- La clave `test_…` nunca debe ir en `.env.local` ni en una versión publicada: RevenueCat cierra la app a propósito si detecta una clave de Test Store en producción.

## 2026-11-08 (6) — Suscripción "Readora sin anuncios"

**Pedido del usuario**: un pago de 2 USD para quitar la publicidad por un mes.

**Decisiones del usuario**:
- **suscripción mensual** con renovación automática (no un pase suelto);
- verificación con **RevenueCat**, recomendado: comprueba los pagos en su servidor y es gratis hasta 2.500 USD de ingresos al mes.

**Hecho**
- `@revenuecat/purchases-capacitor` 13.8.0 (MIT), que usa Google Play Billing.
- `src/lib/premium.ts`:
  - estado de la suscripción (permiso `sin_anuncios`);
  - compra, restauración y caché local.
- `PremiumSection` en Ajustes, en 4 idiomas:
  - el precio sale de Google Play en la moneda local;
  - "Restaurar compra" y "Gestionar suscripción";
  - si la suscripción está cancelada, muestra hasta qué fecha sigue sin anuncios.
- Con la suscripción activa no hay banner y AdMob no se inicia.
- Evento de analítica `premium_purchase` (éxito, cancelada o error), sin datos de pago.
- Licencia: se agregó **Google Play Billing Library** a la excepción.
- Privacidad (es/en) y formulario de Play ("Historial de compras") actualizados.
- Guía de configuración: [MONETIZACION.md](MONETIZACION.md).

**Pendiente (usuario)**
- Perfil de pagos en Play Console.
- Subir la app a prueba interna.
- Crear la suscripción `readora_sin_anuncios` / `mensual` a 2 USD.
- Configurar RevenueCat y pasar la clave `goog_…`.
- La compra real solo se puede probar con la app instalada desde Google Play y una cuenta de "prueba de licencia".

## 2026-11-08 (5) — Analítica PostHog activada

**Pedido del usuario**: activar PostHog con la clave del proyecto (`phc_…`).

**Problema encontrado**
- La primera clave era de un proyecto en **EE. UU.** La app envía a la UE (lo dice la política de privacidad), así que esos eventos se perdieron.
- PostHog responde 200 igual, por eso la primera prueba parecía correcta.
- El usuario creó un proyecto en la **UE** (`eu.posthog.com`) y pasó la nueva clave.
- Verificado con el endpoint `/flags`:
  - nueva clave: UE → 200, EE. UU. → 401;
  - clave anterior: al revés.

**Hecho**
- Clave en `.env.local`, que no se sube a git.
- No se usó el asistente de PostHog (`npx @posthog/wizard`, ni "ai-observability", que es para apps con IA): habría cambiado la integración propia de Readora.

**Probado**
- **Navegador**:
  - sin aceptar, **no** se envía nada;
  - con "Compartir", envíos a `eu.i.posthog.com` con la clave UE.
- **Emulador** (versión compilada con CSP):
  - aparece el aviso;
  - tras "Share", 2 envíos a la UE con la clave nueva, comprobados por DevTools del WebView.

## 2026-11-08 (4) — ID real de AdMob

**Pedido del usuario**: colocar los IDs de AdMob que creó.

**Hecho**
- ID de la **app** `ca-app-pub-7176254903754964~3796187388` en `strings.xml`.
- El bloque que creó (`…/6935541951`) es **Nativo avanzado**. El plugin de Readora solo muestra **banners**, así que **no se usó**: hace falta crear un bloque **Banner**. Mientras tanto sigue el banner de prueba de Google.
- **Problema encontrado**: con el ID real el banner desapareció.
  - Google respondía *"no form(s) configured for the input app ID"*, porque falta el mensaje de consentimiento en AdMob.
  - La app tomaba ese error como "no pedir anuncios".
  - Ahora, si falla la consulta de consentimiento (configuración o red), igual se inicializa AdMob.
  - Verificado en el emulador: el banner vuelve a aparecer.

- **Bloque Banner** creado por el usuario: `ca-app-pub-7176254903754964/1956492108`, en `.env.local`.
  - Verificado en el emulador: la petición sale con el ID real y Google la marca como dispositivo de prueba.
  - Google responde "Ad failed to load: 3" (**sin anuncio disponible**). Es normal en bloques recién creados y en cuentas nuevas: pueden pasar horas, y la cuenta y la app deben quedar aprobadas (vincular la app a Google Play al publicarla).
  - Sin anuncio, la app no deja espacio vacío.

**Pendiente (usuario)**
- Crear el mensaje GDPR en AdMob → Privacidad y mensajes.
- Pasar la clave `phc_…` de PostHog.

## 2026-11-08 (3) — App de escritorio con Tauri 2 (Windows)

**Pedido**: empaquetar Readora como app de escritorio para Windows (y Linux si es fácil). Es requisito para Microsoft Store y Steam.

**Hecho**
- **Tauri 2** en `src-tauri/`:
  - `identifier` `app.readora`, nombre "Readora", versión tomada de `package.json`;
  - íconos generados desde `resources/icon-only.png`;
  - ventana de 1200×800 con fondo oscuro;
  - arrastre de archivos de Tauri desactivado para que siga funcionando soltar libros en la página.
- **Descargas** (`net.ts`): en escritorio `fetchBlob` usa `@tauri-apps/plugin-http`. Rust hace la petición, sin CORS.
  - Lista blanca en `src-tauri/capabilities/default.json`: solo `https://` de gutenberg.org, gutendex.com, openlibrary.org y archive.org, con sus subdominios.
- **Recordatorios** (`reminders.ts`): notificación nativa con `@tauri-apps/plugin-notification`. Solo con la app abierta, porque Tauri no programa avisos en escritorio.
- **Enlaces externos** (`platform.ts`): se abren en el navegador del usuario con `@tauri-apps/plugin-opener`.
- **Anuncios**: confirmado que AdMob no se carga en Tauri. `adsSupported` exige Android y en Tauri `Capacitor.getPlatform()` devuelve `web`.
- **CSP**: `connect-src` suma `ipc:` y `http://ipc.localhost`, el canal de Tauri. El origen `http://tauri.localhost` ya cuenta como `'self'`.
- **Analítica**: `platform` ahora distingue `android`, `desktop` y `web`.
- **Herramientas instaladas** con `winget`, con permiso del usuario: Rust (rustup, stable MSVC) y Visual Studio 2022 Build Tools (C++ y SDK de Windows). Tauri descargó NSIS y WiX solo.
- Scripts nuevos: `npm run desktop:dev` y `npm run desktop:build`.

**Resultado** (`npm run desktop:build`):
- `Readora_0.2.0_x64-setup.exe` (NSIS, 2,9 MB, se instala para el usuario sin pedir administrador);
- `Readora_0.2.0_x64_es-ES.msi` y `_en-US.msi` (3,75 MB cada uno).
- Tauri **no genera MSIX**. [PUBLICAR.md](PUBLICAR.md) explica las dos vías para la Store: subir el `.exe` firmado o convertirlo con MSIX Packaging Tool.

**Probado** con la app instalada (WebView2 manejado por el protocolo de depuración):
- abre en `http://tauri.localhost` sin errores en consola;
- Explorar: descarga un EPUB de **Project Gutenberg** (El crimen y el castigo, 637 KB) y otro de **archive.org** vía Open Library (La isla del Tesoro, 2,2 MB);
- lector **EPUB**: abre y avanza páginas;
- lector **PDF**: abre un PDF de prueba de 3 páginas y pasa de página (pdf.js funciona con la CSP);
- idioma: cambio a francés y de vuelta a español;
- permisos:
  - `https://example.com` y `http://www.gutenberg.org` se **rechazan** ("url not allowed on the configured scope");
  - la notificación nativa se envía sin error.

**Pendiente**
- Compilar y probar la versión de Linux (`.deb`, AppImage). Hace falta Linux, WSL o GitHub Actions; desde Windows no se puede.
- Firmar el instalador (certificado o Azure Trusted Signing) o empaquetar MSIX para la Store.
- No se probó a mano:
  - abrir un enlace externo en el navegador;
  - soltar un archivo sobre la ventana.

## 2026-11-08 (2) — Revisión completa: seguridad, UX/UI y guía de publicación

**Pedido del usuario**:
- dónde poner las claves;
- un análisis completo: UX/UI, seguridad y que todo funcione;
- cómo subir la app a Microsoft Store, Play Store y Steam.

**Probado** (navegador en escritorio y móvil, y emulador Android con la versión compilada):
- Inicio, Explorar (descargar un libro), ficha del libro, lector EPUB, Historial, Recordatorios, Fuentes y Ajustes;
- atajos de teclado;
- el banner de prueba.

**Problemas encontrados y corregidos**
- **Lector EPUB, tema oscuro**: textos con color propio del libro (p. ej. "Translator: …") salían negros sobre negro. Ahora el tema fuerza el color en todo el texto.
- **Ficha del libro**: la portada se estiraba al alto del panel y quedaba recortada.
- "1 sesiones" → plurales correctos en los 4 idiomas.
- Botón "+" del celular sin nombre para lectores de pantalla → `aria-label`.
- Biblioteca vacía sin salida → botón "Buscar libros gratis".
- Textos visibles que nombraban a **Stremio** (Fuentes, créditos) → quitados: las tiendas revisan el uso de marcas ajenas.

**Seguridad**
- **CSP** en la versión compilada (`vite.config.ts`). En el emulador bloqueaba los estilos de los EPUB (`blob:`); se agregó `blob:` a `style-src` y se volvió a verificar.
- Las descargas solo aceptan `https://` (`net.ts`).
- Los EPUB no ejecutan scripts (verificado: el marco aislado los bloquea).
- Se quitó el permiso `SCHEDULE_EXACT_ALARM`: Google Play pide justificarlo y los recordatorios funcionan sin él.
- **Firma de Android** preparada:
  - `build.gradle` lee `android/keystore.properties`;
  - ese archivo y `*.jks` están en `.gitignore`.
- `npm audit`: el aviso de `@xmldom/xmldom` (dentro de epubjs) no aplica en la app, que usa el parser del navegador. Los demás avisos son de herramientas de desarrollo.

**Documentado**: [PUBLICAR.md](PUBLICAR.md) explica:
- dónde va cada clave;
- la firma;
- Google Play: prueba cerrada de 12 personas por 14 días y respuestas de los formularios;
- Microsoft Store: cuenta gratis;
- Steam: 100 USD y **anuncios prohibidos**.

**Hallazgo importante**: para Microsoft Store y Steam hace falta la **app de escritorio con Tauri**. La versión web no puede descargar de Project Gutenberg (CORS).

## 2026-11-08 — v0.2: analítica, anuncios, donaciones y licencia GPL-3.0

**Pedido del usuario**: un servicio de analítica gratuito (PostHog) para ver cómo se usa la app, y ponerle publicidad. Respuestas: monetizar con **anuncios y donaciones** ("Ambos"); analítica **con PostHog**.

**Hecho**
- **Analítica con PostHog** (`src/lib/analytics.ts`):
  - opt-in con aviso inicial e interruptor en Ajustes → Privacidad;
  - servidor UE y solo eventos manuales (13 eventos, ninguno con títulos ni búsquedas);
  - sin clave en `.env.local` queda apagada.
- **Anuncios AdMob solo en Android** (`src/lib/ads.ts`):
  - un banner sobre la barra de pestañas, solo en Inicio y Explorar;
  - consentimiento de Google (UMP) y botón "Opciones de privacidad de anuncios";
  - usa los IDs de prueba de Google hasta tener cuenta.
- **Donaciones**: tarjeta "Apoya a Readora" en Ajustes; aparece cuando se define `VITE_DONATE_URL`.
- **Política de privacidad** pública en [PRIVACIDAD.md](PRIVACIDAD.md) (es/en). Guía de configuración en [MONETIZACION.md](MONETIZACION.md). Plantilla en `.env.example`.
- **Licencia: GPL-3.0-or-later + excepción.** Dos motivos:
  - los SDK de anuncios y Steamworks no son libres;
  - pdf.js y Dexie son Apache-2.0, incompatibles con GPL-2.0.

  Para poder cambiar la licencia se **reescribieron desde cero los atajos de teclado**, sin código de stremio-web (`keys.ts`, `Shortcuts.tsx`, `ShortcutsHelp.tsx`). Detalle en [LICENSE-EXCEPTION.md](../LICENSE-EXCEPTION.md). La v0.1.0 publicada sigue siendo GPL-2.0.
- Versión **0.2.0** (`package.json`, Android `versionCode 2`). La versión de Ajustes ahora se lee de `package.json`.

**Problemas encontrados**
- Las teclas `1`–`7` no cambiaban de sección: el combo tenía 7 teclas y el comparador solo aceptaba una. Ahora varias teclas en un combo son alternativas.
- La versión de Ajustes mostraba 0.1.0: `npm_package_version` no siempre existe. Se importa `package.json` en `vite.config.ts`.
- El plugin de AdMob no exporta `PrivacyOptionsRequirementStatus`: se compara con el texto `'REQUIRED'`.

**Probado**
- **Navegador**:
  - `1`, `2` y `7` navegan;
  - `?` y Ctrl + / abren la ayuda y Esc la cierra;
  - `0` enfoca el buscador;
  - Ajustes muestra v0.2.0 y GPL-3.0;
  - sin clave de PostHog no aparece el aviso.
- **Emulador**: el banner "Test Ad" aparece en Inicio y Explorar sobre las pestañas y desaparece en Biblioteca.

**Pendiente (lo tiene que hacer el usuario)**
- Crear cuenta de PostHog (UE) y pasar la clave `phc_…`.
- Crear cuenta de AdMob y pasar el ID de la app y del banner.
- Elegir el enlace de donaciones (Ko-fi o GitHub Sponsors).

## 2026-11-06 — Claude Code en Android Studio, licencia GPL y atajos de teclado

**Pedidos del usuario**: conectar Claude Code a Android Studio ("muestra los bugs"); hacer Readora **GPL** para aprovechar código de stremio-web.

**Hecho**
- Instalado el **CLI de Claude Code** (2.1.319, en `%USERPROFILE%\.local\bin`, agregado al PATH) y el plugin **Claude Code [Beta] 0.1.14** en Android Studio 2026.1.2. Verificado: el `claude` de la terminal de Android Studio queda conectado al IDE.
- Readora pasa a ser **GPL-2.0-only** (`LICENSE`, `package.json`, sección "Código abierto" en Ajustes).
- **Atajos de teclado** adaptados de stremio-web: `1`–`7` secciones, `/` o `0` buscar, Retroceso volver, `F` pantalla completa, `?` o Ctrl + / ver atajos. En el lector: ← → Espacio Re Pág/Av Pág, `+`/`-` letra, `H` ocultar controles, Esc cerrar. Ventana de ayuda y lista en Ajustes, en los 4 idiomas.

**Problemas encontrados**
- En Windows `shortcuts.ts` y `Shortcuts.tsx` chocaban (mismo nombre sin distinguir mayúsculas) → las definiciones pasaron a `definitions.ts`.
- En el teclado español "?" está en la tecla que en inglés es "-": los atajos de símbolos se reconocen por el carácter, no por la tecla física.

**Probado en el navegador**: `2` → Explorar, `0` → buscador, `?` y Ctrl + / (teclado inglés y español) → ventana de atajos; en el lector, → / Espacio / ← cambian de página, `+` agranda la letra, `1` no saca del lector, Esc vuelve a la ficha.

- **Código publicado** en https://github.com/sergiorebolledo/readora (repositorio público). Ajustes tiene el botón "Ver el código fuente". El APK no se sube al repositorio (`.gitignore`); se compartirá en Releases.
- **Release v0.1.0 (prueba)** en GitHub con el APK `Readora-0.1.0-debug.apk` (SHA-256 `c079806f…e89c`): https://github.com/sergiorebolledo/readora/releases/tag/v0.1.0

**Pendiente**
- Decidir cómo integrar Steamworks (ver [STEAM.md](STEAM.md)).

## 2026-11-05 (madrugada) — Readora: nombre, logo, idiomas y Android

**Pedidos del usuario**: "Empaquetar Android"; que sea **multilingüe** (usando lo que sirva de stremio-translations); **nombre en inglés** con logo y diseño; la app será **gratis** en Steam, así que usar lo que se pueda de stremio-web y mejorar UX/UI.

**Hecho**
- Nombre **Readora** y **logo** nuevo (libro abierto con cinta dorada sobre violeta). Favicon, barra lateral y título actualizados. Ver [DISENO.md](DISENO.md).
- **Multilingüe** con i18next: español, inglés, portugués y francés; todas las pantallas traducidas, detección del idioma del sistema y nueva página **Ajustes** (`#/ajustes`) para cambiarlo. Ver [IDIOMAS.md](IDIOMAS.md).
- Explorar ahora ofrece libros en **portugués y francés** y arranca en el idioma de la app.
- **Android** con Capacitor 8 (`app.readora`): proyecto `android/`, íconos adaptativos y pantalla de inicio generados desde el logo, **APK de prueba** compilado. Ver [ANDROID.md](ANDROID.md).
- **Recordatorios nativos** en Android (notificaciones semanales que llegan con la app cerrada; al tocarlas se abre el libro).
- **Descargas nativas** en Android con `CapacitorHttp` (sin el problema de CORS).
- Botón **atrás** de Android.
- La base de datos sigue llamándose `estante` para no perder los libros ya guardados.

**Decisiones**
- **Licencias de Stremio**: stremio-web es **GPL-2.0**. Que Readora sea gratis no alcanza: copiar su código obliga a publicar todo Readora como código abierto GPL-2.0. Por ahora no se copió código; solo ideas y diseño. stremio-translations es MIT, pero sus textos son de películas/series, así que se tradujo desde cero.
- Steam: la app será **gratuita** (ver [STEAM.md](STEAM.md)).

**Problemas encontrados**
- El `java` del sistema es Java 8 → se compila con el JDK de Android Studio (Java 21).
- El logo tenía una franja negra bajo las líneas de texto (relleno por defecto de los trazos) → `fill="none"`.

**Probado**
- Navegador: Ajustes, cambio a inglés en Explorar y Fuentes.
- Emulador Android 15: inicio, Explorar, descarga nativa desde Gutenberg, lector EPUB (614 páginas), barras del sistema oscuras.
- Arreglos tras probar en Android: botón "Agregar libros" con el ícono encima del texto, botones Anterior/Siguiente del lector (en el celular solo flechas), barra de estado blanca.

**Pendiente**
- Probar el APK en un teléfono real.
- Decidir si Readora será código abierto GPL (para poder reutilizar código de stremio-web).

## 2026-11-05 (noche) — Explorar y Fuentes

**Pedido del usuario**: "Hacer Explorar y Fuentes" (la idea de los addons de Stremio).

**Hecho** (detalle en [FUENTES.md](FUENTES.md))
- Sistema de **Fuentes** con un contrato común (`src/sources/`): cada fuente declara catálogos, busca y opcionalmente "resuelve" qué archivo descargar.
- Fuente **Project Gutenberg** (vía Gutendex): 9 catálogos, búsqueda, sinopsis, EPUB/TXT.
- Fuente **Open Library**: 6 catálogos, búsqueda; elige la **edición en el idioma pedido** y verifica en archive.org qué archivo se puede descargar.
- Pantalla **Explorar** (`#/explorar`): filas por fuente con "Ver todo", cuadrícula con "Cargar más", selector de idioma (Español/Inglés/Todos), búsqueda con el buscador de arriba.
- Ficha de libro externo con **"Agregar a mi biblioteca"**; los libros ya descargados se marcan **"Tuyo"** y muestran "Leer ahora".
- Página **Fuentes** (`#/fuentes`): activar/desactivar fuentes e **importar una carpeta local** completa.
- Importación sin duplicados (mismo nombre y tamaño de archivo).
- La ficha de tus libros muestra la sinopsis si la fuente la trae.
- Barra lateral: nuevos iconos Explorar (brújula) y Fuentes (pieza de puzle). En el celular, Explorar va en las pestañas y Fuentes se abre desde Explorar.

**Problemas encontrados y cómo se resolvieron**
- **CORS**: gutenberg.org y archive.org no permiten descargar desde una página web → proxy de desarrollo en Vite con lista blanca de dominios. En Android/PC se usará HTTP nativo.
- **Gutendex muy lento** (~40 s por consulta, y falla con varias a la vez) → consultas en fila, un reintento y caché de 12 h en el dispositivo.
- **Open Library mostraba libros en inglés** con el idioma en Español → se pide la edición que coincide con el idioma (`language:spa` en la consulta) y se descartan audiolibros de LibriVox y ediciones solo de préstamo.
- **archive.org devolvía error 500** en algunos archivos → se juntan varias alternativas y se prueban en orden; si se usa otra edición/idioma, la app lo avisa.
- **Búsquedas sin resultados quedaban en blanco** → mensaje "Sin resultados" con sugerencias (tildes, idioma).

**Probado en el navegador**
- Explorar carga las 8 filas (4 de Gutenberg + 4 de Open Library).
- Descarga desde Gutenberg: *Don Quijote* (EPUB) → aparece como "Tuyo".
- Descarga desde Open Library: *La letra escarlata* (tras fallar los archivos de la edición en español en archive.org, usó otra edición — esto motivó el aviso de idioma).
- Búsqueda "Bécquer": *Obras escogidas* (Gutenberg); *Rimas*, *Rimas y Leyendas*, *Leyendas* (Open Library).
- Desactivar Open Library en Fuentes → Explorar muestra solo Gutenberg.

**Pendiente / no probado**
- Importar carpeta local: el selector se verificó, pero no se importó una carpeta real (requiere elegirla a mano).
- Con la pestaña del navegador en segundo plano, epub.js no termina de contar las páginas de un EPUB (el navegador pausa las animaciones); en primer plano funciona.

## 2026-11-05 (tarde) — Rediseño inspirado en Stremio

**Pedido del usuario**: no le gustaba el diseño ni el color (estilo Netflix rojo/negro). Envió una captura de Stremio y el repositorio [Stremio/stremio-web](https://github.com/Stremio/stremio-web) como referencia.

**Decisiones**
- Nueva paleta "noche violeta" y distribución tipo Stremio (ver [DISENO.md](DISENO.md)).
- Stremio-web es **GPL-2.0**: se toman ideas y diseño, **no código** (copiarlo obligaría a liberar nuestra app como GPL). Análisis completo en [IDEAS-STREMIO.md](IDEAS-STREMIO.md).

**Hecho**
- Paleta centralizada en `src/index.css` (`@theme`): cambiar un color ahí cambia toda la app.
- Barra lateral de iconos (PC) y pestañas inferiores con iconos (celular); iconos con lucide-react.
- Barra superior con buscador en forma de píldora centrado.
- Inicio sin banner gigante: filas con **"Ver todo ›"**.
- Nueva página **Biblioteca** (`#/biblioteca/:estante`): cuadrícula, chips de filtro y selector de orden.
- Tarjetas con portada redondeada, borde violeta al pasar el mouse, título centrado y "Pág. X de Y".
- Estantes definidos en un solo lugar (`src/lib/shelves.ts`), usados por el Inicio y por la Biblioteca.
- Arrastrar y soltar libros funciona desde cualquier pantalla (antes solo en el Inicio).
- Portadas generadas en tonos azul-violeta-magenta.

**Probado en el navegador**: Inicio (PC y celular), "Ver todo" → Biblioteca filtrada en "Continuar leyendo (3)", cambio de filtros y orden. Sin errores nuevos en la consola.

## 2026-11-05 — Inicio del proyecto y MVP web

**Decisiones**
- Stack definido (ver [STACK.md](STACK.md)): React + TypeScript + Vite + Tailwind, Dexie, pdf.js, epub.js, JSZip. Capacitor para Android y Tauri para PC/Steam.
- Se descartó Flutter por el soporte limitado de formatos de ebook.
- Nombre provisional de la app: **Estante**.
- Se agregó el objetivo de lanzar en **Steam** (ver [STEAM.md](STEAM.md)).

**Hecho**
- Proyecto creado en `Desktop/biblioteca-app`.
- Base de datos local con libros, sesiones de lectura y recordatorios.
- Importación de PDF, EPUB, TXT y CBZ con botón o arrastrando archivos; extrae título, autor, portada y nº de páginas. Si no hay portada, se genera una con el título.
- Inicio estilo Netflix: libro destacado con fondo difuminado, filas "Continuar leyendo", "Agregados recientemente", "Mis favoritos", "Por leer", "Terminados", por formato y A–Z. Búsqueda por título/autor.
- Ficha del libro: progreso, estado, favorito, historial del libro, crear recordatorio, quitar.
- Lectores:
  - PDF: ajuste a pantalla y zoom.
  - EPUB: paginado, temas oscuro/sepia/claro, tamaño de letra.
  - TXT: paginado, temas, tamaño de letra.
  - CBZ: una imagen por página.
  - En todos: teclado (← → Espacio Esc), zonas táctiles para pasar página, barra para saltar de página y guardado automático de la posición.
- Historial: racha de días, tiempo total, sesiones, libros terminados, gráfico de los últimos 7 días y sesiones por día.
- Recordatorios: hora + días de la semana + libro opcional + mensaje; notificación del sistema y aviso dentro de la app.
- Diseño adaptado a celular (barra de pestañas inferior).

**Probado en el navegador** (con libros de prueba PDF, EPUB y TXT)
- Importación con portadas y metadatos correctos.
- PDF: avanzar páginas guarda "Página 4 de 12".
- EPUB: paginación calculada (16 págs.) y se reanuda en la página guardada tras recargar.
- TXT: 30 páginas, progreso guardado.
- Historial: 3 sesiones registradas con páginas y duración; racha de 1 día.
- Recordatorio programado para el minuto actual: se disparó y mostró el aviso.

**Corregido durante las pruebas**
- epub.js lanzaba errores al cerrar el libro durante la importación → se espera a que termine de cargar.
- Pasar página en EPUB antes de que terminara de abrir daba error → el lector solo se habilita cuando está listo.
- En celular el botón "Agregar libros" se cortaba → barra inferior de pestañas y botón compacto.

**Pendiente / no probado**
- CBZ no se probó con un archivo real (el código está, falta un cómic de prueba).
- No se probó con libros grandes (PDF de cientos de páginas, EPUB pesados).
- Aún no hay control de versiones (git) ni empaquetado para Android/PC.
