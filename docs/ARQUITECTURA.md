# Arquitectura

## Estructura de carpetas

```
biblioteca-app/
├── docs/                  Documentación (este archivo, stack, hoja de ruta, Steam, bitácora)
├── index.html             Punto de entrada HTML
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
- **Recordatorios en la web**: solo funcionan con la app abierta (aunque sea en otra pestaña). En Android/PC se usarán notificaciones locales nativas que funcionan con la app cerrada.

## Atajos de teclado

- Definiciones: [`src/lib/shortcuts/definitions.ts`](../src/lib/shortcuts/definitions.ts) (grupos, nombres, teclas y clave de traducción).
- Motor: [`src/lib/shortcuts/Shortcuts.tsx`](../src/lib/shortcuts/Shortcuts.tsx) — `ShortcutsProvider` escucha el teclado; los atajos generales los resuelve `App.tsx` y cada pantalla se suscribe a los suyos con `useShortcut('nombre', fn)` (el lector usa `nextPage`, `prevPage`, etc.).
- Ayuda: `?` o Ctrl + / abre [`ShortcutsModal`](../src/components/ShortcutsModal.tsx); la misma lista está en Ajustes.
- Para agregar un atajo: sumarlo a `definitions.ts`, traducir su `label` en los 4 idiomas (sección `shortcuts`) y manejarlo en `App.tsx` o con `useShortcut`.
- Código adaptado de stremio-web (GPL-2.0): ver [IDEAS-STREMIO.md](IDEAS-STREMIO.md).
