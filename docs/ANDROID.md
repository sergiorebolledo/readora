# App Android (Capacitor)

La app de Android es la misma app web empaquetada con **Capacitor 8**. El proyecto nativo está en `android/` (generado por Capacitor; se puede abrir en Android Studio).

| Dato | Valor |
|---|---|
| Nombre | Readora |
| Identificador (appId) | `app.readora` |
| Configuración | [`capacitor.config.ts`](../capacitor.config.ts) |
| Plugins | `@capacitor/app` (botón atrás), `@capacitor/local-notifications` (recordatorios) |

## Requisitos (una sola vez)

- **Android Studio**, que trae el JDK (`jbr`) y el SDK de Android.
- En esta PC el `java` del PATH es Java 8, que no sirve: hay que usar el JDK de Android Studio (Java 21).
- El archivo `android/local.properties` indica dónde está el SDK (`sdk.dir=C\:\\Users\\<usuario>\\AppData\\Local\\Android\\Sdk`). No se sube al repositorio.

## Compilar el APK de prueba

```bash
npm run build
```

```bash
npx cap sync android
```

En PowerShell:

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
cd android; .\gradlew.bat assembleDebug
```

El APK queda en `android/app/build/outputs/apk/debug/app-debug.apk`. Para instalarlo:
- copiarlo al teléfono y abrirlo (hay que permitir "instalar apps de origen desconocido"), o
- con el teléfono conectado por USB y la depuración activada: `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`.

También se puede abrir `android/` en Android Studio (`npx cap open android`) y pulsar ▶ para ejecutarla en un emulador.

## Publicar una versión de prueba (GitHub Releases)

1. Compilar el APK (ver arriba).
2. Crear el Release con la etiqueta de la versión y adjuntar el APK renombrado:

```bash
gh release create v0.1.0 Readora-0.1.0-debug.apk --title "Readora 0.1.0 (prueba)" --notes-file notas.md --prerelease
```

Se marca como *prerelease* mientras sea un APK de depuración. Publicada: [v0.1.0](https://github.com/sergiorebolledo/readora/releases/tag/v0.1.0) (2026-11-06).

## Íconos y pantalla de inicio

Se generan desde [`public/logo.svg`](../public/logo.svg):

```bash
node scripts/make-icons.mjs
```

```bash
npx capacitor-assets generate --android --iconBackgroundColor "#6c47f2" --splashBackgroundColor "#0d0b1f"
```

El primer comando crea `resources/icon-only.png`, `icon-foreground.png` (solo el libro, para íconos adaptativos), `icon-background.png` (degradado violeta) y `splash*.png`. El segundo genera todas las densidades dentro de `android/app/src/main/res/`.

## Qué cambia en Android respecto de la web

| Función | Web (navegador) | Android |
|---|---|---|
| Descargas de Explorar | Proxy de Vite en desarrollo (por CORS) | `CapacitorHttp` nativo, sin restricción de CORS ([`src/lib/net.ts`](../src/lib/net.ts)) |
| Recordatorios | Revisión cada 30 s, solo con la app abierta | **Notificaciones locales nativas** que se repiten cada semana y llegan con la app cerrada ([`src/lib/reminders.ts`](../src/lib/reminders.ts)). Se reprograman al cambiar recordatorios o libros. Al tocarla, abre el libro. |
| Botón atrás | Navegador | Vuelve a la pantalla anterior; en Inicio cierra la app |
| Datos | IndexedDB del navegador | IndexedDB del WebView (se borran si se desinstala la app) |

## Detalles del proyecto nativo

- `android/app/src/main/res/values/styles.xml`: fondo de ventana `#0d0b1f` para que las barras del sistema se vean oscuras (en Android 15 la app ocupa toda la pantalla y el fondo se ve detrás de ellas).
- `capacitor.config.ts`: `loggingBehavior: "production"` para no volcar al registro las descargas (varios MB en base64).
- Copia del último APK de prueba: `Readora-debug.apk` en la raíz del proyecto.

## Pendiente

- [ ] Abrir archivos desde otras apps ("Abrir con Readora") y elegir libros del almacenamiento del teléfono.
- [ ] APK/AAB **firmado** para Google Play (crear keystore y guardarlo fuera del repositorio).
- [x] Probado en emulador (Android 15): inicio, Explorar, descarga nativa de *Pride and Prejudice* (EPUB de 24 MB), lector EPUB, barras del sistema oscuras.
- [ ] Probar en un teléfono real (notificaciones, lectores PDF/CBZ, rendimiento con PDF grandes).
- [ ] Guardar los archivos en el almacenamiento de la app en vez de IndexedDB si los libros son muy pesados.
