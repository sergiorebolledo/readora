# Arquitectura

## Estructura de carpetas

```
biblioteca-app/
├── docs/                  Documentación (este archivo, stack, hoja de ruta, Steam, bitácora)
├── index.html             Punto de entrada HTML
├── android/               Proyecto de Android (Capacitor), ver ANDROID.md
├── src-tauri/             App de escritorio (Tauri 2): Rust, íconos, permisos e instaladores
├── src/
│   ├── main.tsx           Arranque de React
│   ├── App.tsx            Enrutado por secciones + programador de recordatorios
│   ├── db.ts              Base de datos local (Dexie/IndexedDB): libros, sesiones, recordatorios
│   ├── index.css          Tailwind + estilos globales
│   ├── lib/
│   │   ├── import.ts      Importar archivos: detecta formato, extrae título/autor/portada/páginas
│   │   ├── formats.ts     Utilidades por formato (paginar TXT, leer imágenes de CBZ)
│   │   ├── pdf.ts         Configuración de pdf.js (worker)
│   │   ├── cover.ts       Portada generada cuando el archivo no trae una
│   │   ├── reminders.ts   Programador de recordatorios + notificaciones
│   │   ├── net.ts         Descargas (fetchBlob): HTTP nativo en Android y PC, fetch en web
│   │   ├── platform.ts    ¿Android, escritorio (Tauri) o web? + enlaces externos en el navegador
│   │   └── hooks.ts       Enrutador por hash, preferencias, utilidades de fechas
│   ├── components/
│   │   ├── Navbar.tsx     Barra lateral de iconos (PC), buscador superior y pestañas inferiores (celular)
│   │   ├── Home.tsx       Inicio: filas por estante con "Ver todo"
│   │   ├── LibraryPage.tsx Biblioteca: cuadrícula con filtros y orden
│   │   ├── BookCard.tsx   Portada, tarjeta y fila horizontal
│   │   ├── BookDetail.tsx Ficha del libro (estado, favorito, historial, eliminar)
│   │   ├── Importer.tsx   Botón y lógica para agregar libros (también arrastrar y soltar)
│   │   ├── History.tsx    Historial global: racha, tiempo, gráfico 7 días, sesiones por día
│   │   └── Reminders.tsx  Crear/activar/eliminar recordatorios
│   ├── sources/           Fuentes externas (ver docs/FUENTES.md)
│   └── reader/
│       ├── Reader.tsx     "Carcasa" común: barra superior/inferior, teclado, zonas táctiles, sesiones
│       ├── PdfReader.tsx  Lector PDF (canvas + zoom)
│       ├── EpubReader.tsx Lector EPUB (paginado, temas, tamaño de letra)
│       ├── TxtReader.tsx  Lector TXT paginado
│       ├── CbzReader.tsx  Lector de cómics
│       └── types.ts       Contrato común de los lectores
```

## Rutas (hash)

| Ruta | Pantalla |
|---|---|
| `#/` | Inicio |
| `#/biblioteca` y `#/biblioteca/:estante` | Biblioteca en cuadrícula (filtrada) |
| `#/explorar`, `#/explorar/:fuente/:catalogo` | Explorar libros gratis de las fuentes |
| `#/fuentes` | Activar fuentes e importar carpeta local |
| `#/libro/:id` | Ficha del libro (ventana sobre el inicio) |
| `#/leer/:id` | Lector a pantalla completa |
| `#/historial` | Historial y estadísticas |
| `#/recordatorios` y `#/recordatorios/:idLibro` | Recordatorios |

Se usa enrutado por **hash** porque funciona igual en navegador, Capacitor (Android) y Tauri (PC/Steam) sin configurar servidor.

## Modelo de datos (`src/db.ts`)

- **books**: archivo original (Blob), portada (Blob), título, autor, formato, `totalPages`, `currentPage`, `progress` (0–1), `location` (posición exacta: CFI en EPUB, nº de página en el resto), `status`, `favorite`, fechas.
- **sessions**: cada vez que se abre un libro → inicio, fin, segundos, página inicial y final. Se ignoran sesiones de menos de 5 s. Si la app pasa a segundo plano (celular) la sesión se cierra.
- **reminders**: hora `HH:MM`, días de la semana, libro opcional, mensaje, activo, `lastFired` (para no avisar dos veces el mismo día).

## Cómo se agrega un lector nuevo (p. ej. MOBI)

1. Añadir la extensión en `detectFormat` y `ACCEPTED` (`lib/import.ts`) y en el tipo `BookFormat` (`db.ts`).
2. Escribir el extractor de metadatos/portada en `lib/import.ts`.
3. Crear `reader/MobiReader.tsx` que cumpla `FormatReaderProps`: llamar a `onLocate(página, total, ubicación)` y registrar `nav.current = { prev, next, goTo }`.
4. Registrarlo en `READERS` dentro de `reader/Reader.tsx`.

## Decisiones y limitaciones conocidas

- **Archivos dentro de IndexedDB**: simple y offline, pero el navegador puede limitar el espacio. En las apps nativas se moverán a disco (sistema de archivos de Capacitor/Tauri) y se guardará solo la ruta.
- **Páginas de EPUB**: un EPUB no tiene páginas fijas; se calculan bloques de 1.200 caracteres y se guardan en caché (`localStorage`). El progreso exacto se guarda con CFI, así que no se pierde la posición aunque cambie el tamaño de letra.
- **Recordatorios**: en Android son notificaciones programadas que llegan con la app cerrada. En la web y en PC (Tauri) solo llegan con la app abierta: Tauri no puede programar avisos en escritorio. En PC el aviso es una notificación nativa de Windows/Linux.

## Atajos de teclado

- Definiciones: [`src/lib/shortcuts/definitions.ts`](../src/lib/shortcuts/definitions.ts) (grupos, nombres, teclas y clave de traducción).
- Motor: [`src/lib/shortcuts/Shortcuts.tsx`](../src/lib/shortcuts/Shortcuts.tsx) — `ShortcutsProvider` escucha el teclado; los atajos generales los resuelve `App.tsx` y cada pantalla se suscribe a los suyos con `useShortcut('nombre', fn)` (el lector usa `nextPage`, `prevPage`, etc.).
- Teclas: [`src/lib/shortcuts/keys.ts`](../src/lib/shortcuts/keys.ts) — `pressedKey` y `comboMatches`:
  - varias teclas en un combo son alternativas (`1`…`7`);
  - `Mod` significa Ctrl, o ⌘ en Mac;
  - los símbolos se comparan por carácter, así que funcionan con teclado español e inglés.
- Ayuda: `?` o Ctrl + / abre `ShortcutsDialog` ([`ShortcutsHelp.tsx`](../src/components/ShortcutsHelp.tsx)); la misma tabla (`ShortcutsTable`) está en Ajustes.
- Para agregar un atajo: sumarlo a `definitions.ts`, traducir su `label` en los 4 idiomas (sección `shortcuts`) y manejarlo en `App.tsx` o con `useShortcut`.
- Escrito desde cero en v0.2 (ya no contiene código de stremio-web).

## Analítica y anuncios

- [`src/lib/analytics.ts`](../src/lib/analytics.ts):
  - `track(evento, props)` está tipado con la interfaz `Events` y no hace nada sin consentimiento o sin clave;
  - PostHog se carga con `import()` solo cuando hace falta;
  - [`ConsentBanner.tsx`](../src/components/ConsentBanner.tsx) pregunta una vez y `useConsent()` sigue el estado (evento `readora:consent`).
- [`src/lib/ads.ts`](../src/lib/ads.ts):
  - `useBannerAd(visible)` en `App.tsx` muestra u oculta el banner nativo según la sección;
  - la altura del banner se publica en `--ad-h` para dejarle espacio;
  - el consentimiento UMP se pide en `startAds()`.
- Detalle y configuración: [MONETIZACION.md](MONETIZACION.md).

## App de escritorio (Tauri)

La app de PC (Windows, Linux y, más adelante, Steam) es la misma versión web compilada (`dist`) dentro de una ventana de Tauri 2. Rust solo aporta tres plugins.

| Archivo | Qué hace |
|---|---|
| `src-tauri/tauri.conf.json` | Nombre "Readora", `identifier` `app.readora`, versión tomada de `package.json`, ventana (1200×800, mínimo 360×500), instaladores (NSIS y MSI en Windows; `.deb` y AppImage en Linux). |
| `src-tauri/src/lib.rs` | Registra los plugins `http`, `notification` y `opener`. |
| `src-tauri/capabilities/default.json` | Permisos de la ventana. El plugin HTTP solo puede pedir a `https://` de gutenberg.org, gutendex.com, openlibrary.org y archive.org (y sus subdominios). |
| `src-tauri/icons/` | Generados con `npx tauri icon resources/icon-only.png`. |
| `src/lib/platform.ts` | `isDesktop` (con `isTauri()`), `platform` (`android` / `desktop` / `web`) y `openExternalLinksInBrowser()`. |

Cómo se comporta cada parte en escritorio:

- **Descargas** (`net.ts`): `fetchBlob` usa el `fetch` de `@tauri-apps/plugin-http`. La petición la hace Rust, así que no la frena el CORS de Gutenberg y archive.org. Un dominio fuera de la lista blanca da error de red.
- **Recordatorios** (`reminders.ts`): la misma revisión cada 30 s que en la web, pero el aviso sale con `sendNotification` de `@tauri-apps/plugin-notification`.
- **Anuncios** (`ads.ts`): `adsSupported` solo es verdadero en Android (`Capacitor.getPlatform()` devuelve `web` en Tauri), así que AdMob nunca se inicia en PC. Steam prohíbe anuncios.
- **Enlaces externos**: los `target="_blank"` se abren con `openUrl` (plugin `opener`) en el navegador del usuario.
- **Arrastrar y soltar**: `dragDropEnabled: false` en la ventana, para que la página reciba los archivos soltados (si no, Tauri se los queda).
- **CSP** (`vite.config.ts`): la página se sirve desde `http://tauri.localhost` (Windows) o `tauri://localhost` (Linux), que cuenta como `'self'`. Se agregaron `ipc:` y `http://ipc.localhost` a `connect-src`, que es el canal entre la página y Rust. En `tauri.conf.json` `security.csp` queda en `null` para no tener dos políticas distintas.
- **Datos**: IndexedDB del WebView2, en `%LOCALAPPDATA%\app.readora\EBWebView`. Desinstalar con "borrar datos" los elimina.

Comandos:

```bash
npm run desktop:dev     # ventana de Tauri con recarga en caliente (Vite en :5173)
npm run desktop:build   # instaladores en src-tauri/target/release/bundle/
```
