# Explorar y Fuentes

Sistema inspirado en los **addons de Stremio**: cada *fuente* declara catálogos (filas) y sabe buscar libros. La sección **Explorar** muestra los catálogos de todas las fuentes activas; la página **Fuentes** permite activarlas o desactivarlas.

## Fuentes disponibles

| Fuente | Qué ofrece | Formatos | Catálogos | Notas |
|---|---|---|---|---|
| **Project Gutenberg** (vía [Gutendex](https://gutendex.com)) | +75.000 libros de dominio público, con sinopsis | EPUB, TXT | Más populares, Novela, Aventura, Ciencia ficción, Poesía, Teatro, Infantil, Filosofía, Historia | Gutendex puede tardar **30–60 s** por consulta. Las consultas van de a una y se guardan 12 h en el dispositivo. |
| **Open Library** (Internet Archive) | Ediciones escaneadas de dominio público | EPUB, PDF | Clásicos, Novela, Poesía, Infantil, Historia, Ciencia | Al abrir la ficha se consulta archive.org para elegir una edición descargable. Algunos archivos de archive.org fallan (error 500); se prueban alternativas. |
| **Carpeta local** | Importa todos los libros de una carpeta (y subcarpetas) | PDF, EPUB, TXT, CBZ | — | No duplica libros (compara nombre y tamaño), así que sirve para volver a sincronizar. |

**Idioma**: en Explorar se elige Español, Inglés o Todos. En Open Library se usa la edición en ese idioma (p. ej. "Orgullo y prejuicio" en vez de "Pride and Prejudice"). Si la edición en ese idioma no se puede descargar en ese momento, se usa otra y la app lo **avisa**.

## Cómo funciona por dentro

```
src/sources/
├── types.ts        Contrato de una fuente (Source, CatalogItem, CatalogPage)
├── gutenberg.ts    Fuente Project Gutenberg
├── openlibrary.ts  Fuente Open Library (+ resolve() con la API de metadatos de archive.org)
└── index.ts        Registro de fuentes, fuentes activas, idioma y caché (memoria + localStorage 12 h)

src/components/explore/
├── Explore.tsx     Portada de Explorar (filas por fuente), búsqueda y cuadrícula "Ver todo"
├── ItemDetail.tsx  Ficha del libro externo + "Agregar a mi biblioteca"
├── ExploreCard.tsx Tarjeta con portada remota y marca "Tuyo"
└── useCatalog.ts   Carga con caché y paginación ("Cargar más")

src/components/SourcesPage.tsx   Activar/desactivar fuentes + importar carpeta local
src/lib/net.ts                   Descarga de archivos (ver CORS abajo)
```

Rutas: `#/explorar`, `#/explorar/:fuente/:catalogo`, `#/fuentes`.

### Contrato de una fuente

```ts
interface Source {
  id, name, description, homepage, contentNote
  catalogs: { id, name }[]
  getCatalog(catalogId, lang, cursor?) → { items, next }
  search(query, lang, cursor?)         → { items, next }
  resolve?(item, lang)                 → item con `downloads` completos (opcional)
}
```

**Agregar una fuente nueva** = crear `src/sources/mifuente.ts` que exporte un `Source` y sumarlo a `SOURCES` en `src/sources/index.ts`. Nada más.

### Qué pasa al pulsar "Agregar a mi biblioteca"

1. Se descargan los archivos de `downloads` **en orden** hasta que uno funcione (EPUB antes que PDF/TXT).
2. Se descarga la portada de la fuente (se usa solo si el archivo no trae una).
3. Se importa con `importFile()` usando el título, autor y sinopsis de la fuente, y se guarda `origin = { sourceId, itemId }`.
4. Gracias a `origin`, el libro aparece marcado **"Tuyo"** en Explorar y la ficha muestra **"Leer ahora"**.

## ⚠️ CORS: por qué hay un proxy

Los catálogos (Gutendex, Open Library, metadatos de archive.org) **sí** permiten llamadas desde el navegador. Pero las **descargas** de gutenberg.org y archive.org **no** (no envían el encabezado `Access-Control-Allow-Origin`).

| Entorno | Solución |
|---|---|
| Desarrollo (`npm run dev`) | Proxy de Vite en `/__proxy?url=…` (`vite.config.ts`), solo para gutenberg.org, archive.org y openlibrary.org |
| App Android (Capacitor) | Cliente HTTP nativo (`CapacitorHttp`), sin restricción CORS |
| App PC / Steam (Tauri) | Plugin HTTP de Tauri, sin restricción CORS |
| Si se publicara como web | Haría falta un proxy propio (p. ej. una función serverless) |

→ Al empaquetar para Android/PC hay que cambiar `fetchBlob()` en `src/lib/net.ts` para usar el cliente nativo.

## Próximas fuentes

- **Calibre / OPDS**: conectar el servidor de Calibre del usuario (OPDS es el estándar de catálogos de ebooks).
- **Standard Ebooks**: clásicos con ediciones muy cuidadas.
- **Carpeta vigilada**: detectar libros nuevos automáticamente (en Tauri/Capacitor, con acceso al sistema de archivos).
