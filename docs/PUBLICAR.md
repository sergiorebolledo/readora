# Cómo publicar Readora en las tiendas

Guía paso a paso para **Google Play**, **Microsoft Store** y **Steam**. Revisada el 8 de noviembre de 2026; las tiendas cambian sus reglas, así que conviene confirmar en sus páginas oficiales antes de enviar.

| Tienda | Costo de la cuenta | Qué se sube | ¿Anuncios? | Estado de Readora |
|---|---|---|---|---|
| Google Play | 25 USD (una vez) | `.aab` firmado | ✅ AdMob | Lista para preparar (falta la firma y las cuentas) |
| Microsoft Store | Gratis (personas) | `.msix` o instalador `.exe`/`.msi` | ❌ (no hay SDK de anuncios para PC) | App de escritorio lista (Tauri); falta cuenta y envío |
| Steam | 100 USD por app (Steam Direct) | Build de Windows/Linux con SteamPipe | ❌ **Prohibidos** por Valve | App de escritorio lista (Tauri); falta cuenta y envío |

---

## 0. Dónde van las claves

Ninguna clave se escribe en el código. Hay tres lugares, y **ninguno se sube a GitHub** (están en `.gitignore`):

| Qué | Dónde | Ejemplo |
|---|---|---|
| Clave de PostHog | `.env.local` (en la carpeta del proyecto) | `VITE_POSTHOG_KEY=phc_abc123…` |
| ID del **banner** de AdMob | `.env.local` | `VITE_ADMOB_BANNER_ID=ca-app-pub-1234…/5678…` |
| Enlace de donaciones | `.env.local` | `VITE_DONATE_URL=https://ko-fi.com/readora` |
| ID de la **app** de AdMob | `android/app/src/main/res/values/strings.xml` → `admob_app_id` | `ca-app-pub-1234…~9876…` |
| Contraseñas de la firma Android | `android/keystore.properties` | ver paso 1.2 |

Para crear `.env.local`:

```bash
cp .env.example .env.local
```

Después ábrelo con cualquier editor y rellena las líneas. Cada vez que cambies `.env.local` hay que volver a compilar (`npm run build`).

> El ID de la **app** de AdMob (`strings.xml`) sí queda en el repositorio: es público (cualquiera lo ve dentro del APK), no es un secreto. La clave de PostHog `phc_…` también es pública por diseño (solo sirve para *enviar* eventos), pero se deja en `.env.local` para que quien copie el código no te mande sus datos.

Lo que **sí es secreto** y nunca se comparte: el archivo `readora-upload.jks` y su contraseña. Si se pierde, Google puede reemplazar la clave de subida, pero es un trámite; guarda una copia en un lugar seguro (por ejemplo un gestor de contraseñas o un USB).

---

## 1. Google Play (Android)

### 1.1 Cuentas

1. **Google Play Console**: https://play.google.com/console → cuenta **personal**, pago único de 25 USD y verificación de identidad.
2. **AdMob**: https://admob.google.com → agregar la app Android `app.readora`. Copiar:
   - el ID de la **app** en `strings.xml`;
   - el ID de un bloque **Banner** en `.env.local`.
3. **PostHog**: https://eu.posthog.com (región UE) → proyecto "Readora". Copiar la clave `phc_…` a `.env.local`.

### 1.2 Crear la firma (una sola vez)

Google exige que el archivo esté firmado. En una terminal, dentro de la carpeta del proyecto:

```bash
"/c/Program Files/Android/Android Studio/jbr/bin/keytool" -genkeypair -v -keystore android/readora-upload.jks -alias readora -keyalg RSA -keysize 2048 -validity 10000
```

Te pedirá una contraseña y tus datos (nombre, país). Luego crea `android/keystore.properties`:

```properties
storeFile=readora-upload.jks
storePassword=LA_CONTRASEÑA
keyAlias=readora
keyPassword=LA_CONTRASEÑA
```

`android/app/build.gradle` ya lee este archivo cuando existe.

### 1.3 Compilar el paquete `.aab`

```bash
npm run build && npx cap sync android && cd android && ./gradlew.bat bundleRelease
```

El archivo queda en `android/app/build/outputs/bundle/release/app-release.aab`.

Antes de cada versión nueva, sube `versionCode` (y `versionName`) en `android/app/build.gradle` y la versión en `package.json`.

### 1.4 Prueba cerrada obligatoria (cuentas personales nuevas)

Las cuentas personales creadas después de noviembre de 2023 deben hacer una **prueba cerrada con al menos 12 personas durante 14 días seguidos** antes de poder publicar en producción.
- Play Console → Pruebas → **Prueba cerrada** → crear versión → subir el `.aab`.
- Agrega los correos de Gmail de 12 o más personas (familia, amigos, compañeros) y envíales el enlace de "unirse a la prueba".
- Deben **quedarse inscritas** los 14 días. Si se pausa la prueba, el conteo vuelve a empezar.
- Después, Play Console habilita "Solicitar acceso a producción", que pide responder unas preguntas sobre la prueba.

### 1.5 Formularios de Play Console (respuestas para Readora)

**Política de privacidad**
- Enlace: `https://github.com/sergiorebolledo/readora/blob/main/docs/PRIVACIDAD.md`

**Anuncios**
- "¿Tu app contiene anuncios?" → **Sí**.

**ID de publicidad**
- "¿Usa el ID de publicidad?" → **Sí**.
- Motivos: **Publicidad o marketing** y **Analíticas** (los usa AdMob).

**Seguridad de los datos**
- Datos recopilados:
  - **Identificadores del dispositivo u otros** (ID de publicidad), lo recoge AdMob.
    - Se comparte con Google.
    - Fines: publicidad y analíticas.
  - **Actividad en la app → Interacciones con la app**, lo recoge PostHog.
    - Es **opcional**.
    - Fin: analíticas.
  - **Información y rendimiento de la app → Registros de fallos y diagnósticos**, lo recoge AdMob.
  - **Información financiera → Historial de compras**, lo recogen RevenueCat y Google Play.
    - Solo si la persona se suscribe.
    - Fin: funcionalidad de la app (saber si tiene "sin anuncios").
- Cifrado en tránsito: **Sí**.
- Eliminación de datos: indica que se pide por el enlace de contacto de la política (issues de GitHub).
- Google publica una guía de qué declarar por el SDK de AdMob: búscala como "AdMob data disclosure".

**Clasificación del contenido**
- Cuestionario IARC: app de **referencia/educación**, sin violencia.
- Ojo: los libros de dominio público pueden tener temas adultos. Responde según el contenido que la app *ofrece* (catálogos generales).

**Público objetivo**
- **13 años o más.**
- No marques menores: con niños, AdMob exige otra configuración (anuncios para familias).

**Acceso a la app**
- "Toda la funcionalidad está disponible sin restricciones" (no hay inicio de sesión).

**Ficha de la tienda**
- Icono de 512×512.
- Imagen destacada de 1024×500.
- Al menos 2 capturas de teléfono.
- Descripción corta (80 caracteres) y larga, en cada idioma.

### 1.6 Requisitos técnicos (ya cumplidos)

- Las apps nuevas deben apuntar a **Android 16 (API 36)** desde el 31-08-2026. Readora usa `targetSdkVersion = 36` ✅.
- Se quitó el permiso de **alarmas exactas**, que exige justificarse. Los recordatorios funcionan con alarmas normales ✅.
- `app-ads.txt`:
  - AdMob lo pide para pagar bien los anuncios;
  - va en la raíz del **sitio web de desarrollador** que pongas en la ficha de Play.
  - Opción gratis: crear el repositorio `sergiorebolledo.github.io` con GitHub Pages y poner ahí el archivo `app-ads.txt` que te da AdMob.

### 1.7 Después de publicar

- **No toques tus propios anuncios reales.** Registra tu teléfono como "dispositivo de prueba" en AdMob.
- Revisa "Android vitals" (fallos) en Play Console y los eventos en PostHog.

---

## 2. Microsoft Store (Windows)

La app de escritorio ya existe (Tauri 2, `src-tauri/`, desde el 2026-11-08). Descarga los libros con HTTP nativo, así que Gutenberg y archive.org funcionan aunque no permitan CORS.

### 2.1 Generar el paquete

Requisitos (una sola vez; ver [STACK.md](STACK.md#herramientas-para-compilar-la-app-de-escritorio-windows)): Rust y Visual Studio Build Tools con C++.

```bash
npm run desktop:build
```

Sale en `src-tauri/target/release/bundle/`:

| Archivo | Para qué |
|---|---|
| `nsis/Readora_<versión>_x64-setup.exe` | Instalador recomendado. Se instala para el usuario actual (sin pedir administrador), en 4 idiomas. |
| `msi/Readora_<versión>_x64_es-ES.msi` y `_en-US.msi` | Instalador MSI (empresas, Intune, `winget`). |
| `../Readora.exe` | El programa sin instalador (para Steam). |

La versión sale de `package.json`: subirla ahí antes de cada envío.

> **MSIX**: Tauri **no** genera MSIX. Para la Store hay dos caminos.

### 2.2 Opción A (recomendada para empezar): subir el instalador `.exe`

Partner Center acepta apps Win32 con instalador `.exe`/`.msi`:

1. Subir `Readora_<versión>_x64-setup.exe` a una **URL HTTPS fija con versión** (por ejemplo, un asset de GitHub Releases). La URL no puede cambiar de contenido después.
2. El instalador debe estar **firmado** con un certificado de firma de código de una autoridad reconocida (Microsoft no lo firma por ti en esta opción). Alternativa más barata: **Azure Trusted Signing** (aprox. 10 USD/mes).
   - Con el certificado: rellenar `bundle.windows.certificateThumbprint` (o `signCommand`) en `tauri.conf.json` y volver a compilar.
3. En Partner Center → "Paquetes", elegir **EXE/MSI**, pegar la URL, arquitectura x64 e idiomas.
4. **Instalación silenciosa**: con NSIS el parámetro es `/S`.

### 2.3 Opción B: empaquetar como MSIX

Con MSIX **Microsoft firma el paquete al publicar** (no hace falta certificado propio) y la Store gestiona las actualizaciones.

1. Instalar **MSIX Packaging Tool** (gratis, desde la Microsoft Store).
2. "Paquete de aplicación" → crear a partir de `Readora_<versión>_x64-setup.exe`, en una máquina limpia o VM, con instalación silenciosa `/S`.
3. Identidad del paquete: copiar **Name**, **Publisher** (`CN=…`) y **PublisherDisplayName** de Partner Center → Administración de productos → Identidad del producto. Si no coinciden, la Store rechaza el paquete.
4. Subir el `.msix` en Partner Center → Paquetes.

Más adelante se puede automatizar con `makeappx` (SDK de Windows) y un `AppxManifest.xml` propio en lugar de la herramienta gráfica.

### 2.4 Cuenta y ficha

1. **Cuenta**:
   - https://storedeveloper.microsoft.com → cuenta **individual (gratis)**;
   - verificación con documento de identidad y selfie.
2. **Reservar el nombre** "Readora" en Partner Center → Apps y juegos → Nueva app.
3. **Ficha**:
   - descripción;
   - capturas de 1366×768 o más;
   - icono;
   - clasificación por edad (cuestionario IARC);
   - enlace a la política de privacidad (obligatorio, porque hay analítica).
4. **Precio**: Gratis. **Sin anuncios**: AdMob es solo para móviles (en PC `ads.ts` no lo carga) y Microsoft cerró su SDK de anuncios para apps. En PC, Readora se sostiene con donaciones.
5. **Enviar a certificación**: suele tardar de unas horas a 3 días hábiles. Si la rechazan, el informe dice qué corregir.

---

## 3. Steam

> La **app de escritorio (Tauri)** ya está lista: para Steam se sube `src-tauri/target/release/Readora.exe` (ver [STEAM.md](STEAM.md)).
>
> **Steam prohíbe los anuncios**: Valve no permite modelos con publicidad. La versión de Steam es **sin anuncios** (como ya está diseñado: AdMob solo se activa en Android). Las donaciones se pueden mantener como un enlace externo. Si tienes dudas, consulta las reglas en "Advertising on Steam" de la documentación de Steamworks.

1. **Cuenta**:
   - https://partner.steamgames.com → registro de socio;
   - datos fiscales (entrevista de impuestos) y bancarios;
   - verificación de identidad.
2. **Steam Direct**:
   - pago de **100 USD por app**;
   - en apps gratis no se recupera, porque solo se devuelve con ventas.
   - Tras pagar hay un **período de espera de 30 días** antes de poder lanzar la primera app.
3. **Tipo de producto**:
   - Readora entra como **Software** (no juego). La categoría "Software" de Steam acepta lectores y herramientas.
   - Precio: **Free**.
4. **Página de la tienda**:
   - cápsulas (imágenes en varios tamaños);
   - capturas;
   - descripción;
   - requisitos del sistema.
   - Debe estar visible como **"Próximamente" al menos 2 semanas** antes del lanzamiento.
   - Valve revisa la página (unos días).
5. **Build**:
   - subir los archivos de Tauri (Windows, y opcionalmente Linux para Steam Deck) con **SteamPipe** (herramienta `steamcmd` del SDK);
   - Valve revisa la build (3–5 días hábiles).
6. **Licencia**:
   - el SDK de Steamworks no es libre, pero la excepción de [LICENSE-EXCEPTION.md](../LICENSE-EXCEPTION.md) permite usarlo;
   - hay que poner el enlace al código fuente en la página de la tienda (obligación de la GPL).
7. **Steam Deck**: pide la verificación "Deck Verified". Para eso falta la navegación con mando (ver ROADMAP).

---

## 4. Lista antes de enviar a cualquier tienda

- [ ] Claves reales en `.env.local` y `strings.xml` (sin IDs de prueba de AdMob)
- [ ] `versionCode`/`versionName` y `package.json` actualizados
- [ ] Probar el `.aab`/build final en un dispositivo real: descargar un libro, leer EPUB y PDF, recordatorio, cambiar idioma
- [ ] Aviso de estadísticas: aceptar y rechazar, y comprobar en PostHog
- [ ] Anuncio visible solo en Inicio y Explorar (Android)
- [ ] Política de privacidad al día si se agregó un evento o un servicio
- [ ] Bitácora y ROADMAP actualizados

## 5. Seguridad (revisión del 2026-11-08)

- **Libros con código**:
  - los EPUB se muestran en un marco aislado sin permiso para ejecutar scripts (verificado: el navegador los bloquea);
  - además, la versión compilada tiene una **política de seguridad de contenido (CSP)** que limita de dónde se cargan scripts y estilos.
- **Descargas**: solo por `https://`. El proxy de descargas existe únicamente en `npm run dev`, con una lista blanca de dominios.
- **Datos personales**: todo queda en el dispositivo. La analítica es opcional y no envía títulos, búsquedas ni URLs.
- **Permisos de Android**:
  - internet;
  - notificaciones (recordatorios);
  - ID de publicidad (AdMob);
  - estado de red.
  - No pide archivos, cámara, ubicación ni contactos.
- **Dependencias**: `npm audit` avisa de `@xmldom/xmldom` dentro de `epubjs`.
  - Ese parser solo se usa fuera del navegador; dentro de la app se usa el `DOMParser` nativo, así que el riesgo es mínimo.
  - El resto de avisos son de herramientas de desarrollo (`@capacitor/assets`) que no van dentro de la app.
- **Secretos**: `.env.local`, `keystore.properties` y `*.jks` están en `.gitignore`.
