# Qué podemos aprovechar de Stremio

Stremio es una biblioteca de películas y series (~15 mil ⭐ en GitHub). Revisamos [github.com/Stremio](https://github.com/Stremio) y [stremio-web](https://github.com/Stremio/stremio-web) para llevar sus buenas ideas a una biblioteca de **libros**.

## ✅ Decisión (2026-11-06): Readora es GPL-2.0

El usuario decidió publicar Readora como **código abierto GPL-2.0** para poder reutilizar código de stremio-web.
- Licencia en [`LICENSE.md`](../LICENSE.md) y `"license": "GPL-2.0-only"` en `package.json`.
- Se eligió **GPL-2.0-only** (no GPL-3.0) porque stremio-web declara `gpl-2.0` sin "o posterior"; mezclar su código en una app GPL-3.0 no estaría permitido.
- Cada archivo con código de Stremio mantiene el aviso `Copyright (C) 2017-2023 Smart code 203358507` y dice qué se cambió.
- Obligación: quien reciba la app (APK, Steam) debe poder obtener el **código fuente completo**. Cuando se publique, hay que subir el repositorio (p. ej. a GitHub) y enlazarlo desde Ajustes y la página de Steam.

### Código adaptado de stremio-web

| Archivo de Readora | Origen en stremio-web | Cambios |
|---|---|---|
| `src/lib/shortcuts/keyboard.ts` | `src/common/Shortcuts/keyboard.ts` | Detección de plataforma con `navigator`; teclas Re Pág / Av Pág |
| `src/lib/shortcuts/Shortcuts.tsx` | `src/common/Shortcuts/Shortcuts.tsx` + `useShortcut.ts` | Shift opcional en símbolos (teclados español/inglés), alias de teclado numérico, Escape dentro de campos de texto |
| `src/lib/shortcuts/definitions.ts` | `src/common/Shortcuts/shortcuts.json` | Atajos propios de un lector de libros |
| `src/components/ShortcutsModal.tsx` | `src/App/ShortcutsModal`, `src/components/ShortcutsGroup`, `Keys` | Tailwind y Lucide en vez de LESS y stremio-icons |

Otras partes de stremio-web dependen de `stremio-core` (WebAssembly), de su router y de sus estilos LESS, así que no conviene copiarlas tal cual; se siguen tomando como **referencia de diseño**.

## Licencias de los repositorios de Stremio

| Repositorio | Licencia | ¿Podemos copiar código? |
|---|---|---|
| `stremio-web` (la interfaz) | **GPL-2.0** | **Sí**, porque Readora ahora también es GPL-2.0 (ver arriba). |
| `stremio-core` (lógica, sistema de addons) | MIT | Sí, con atribución. Está en Rust; nos sirve como **referencia**. |
| `stremio-addon-sdk` | MIT | Sí, con atribución. Buen modelo para nuestro sistema de "fuentes". |
| `stremio-translations` | MIT | Sí, con atribución. Pero sus textos son de películas/series; ver [IDIOMAS.md](IDIOMAS.md). |
| `stremio-local-addon` | MIT | Referencia para indexar una carpeta local de libros. |

Las ideas, la distribución de pantallas y el estilo visual no tienen copyright; el código sí.

## Pantallas de Stremio y su equivalente para libros

Stremio tiene estas secciones (`src/routes` de stremio-web): Board, Discover, Library, Calendar, Addons, Settings, Search, MetaDetails, Player.

| Stremio | Estante | Estado |
|---|---|---|
| **Board**: filas de catálogos | **Inicio**: filas por estante con "Ver todo" | ✅ Hecho |
| **Library**: cuadrícula con filtros y orden | **Biblioteca**: chips (Leyendo, Favoritos, Por leer, Terminados, PDF, EPUB, Cómics) y orden (último leído, recientes, título, autor, progreso) | ✅ Hecho |
| **Continue Watching** | **Continuar leyendo** con barra de progreso y "Pág. X de Y" | ✅ Hecho |
| **MetaDetails**: ficha | Ficha del libro | ✅ Hecho (falta sinopsis/géneros) |
| **Player** con control total por teclado | Lector con ← → Espacio Re Pág/Av Pág, + / − letra, H controles, Esc | ✅ Con el sistema de atajos de Stremio |
| **Search** | Buscador en la barra superior | ✅ Solo en tu biblioteca; falta buscar en fuentes externas |
| **Discover**: explorar catálogos | **Explorar**: libros gratis y legales de fuentes externas | ✅ Hecho ([FUENTES.md](FUENTES.md)) |
| **Addons**: sistema de complementos | **Fuentes**: catálogos que se pueden activar o desactivar | ✅ Hecho (Gutenberg, Open Library, carpeta local) |
| **Calendar**: estrenos | **Calendario de lectura**: días leídos, metas y recordatorios en un calendario | 🔜 Fase 2 |
| **Settings** | **Ajustes**: idioma, acerca de, créditos (falta tema, color de acento, copia de seguridad) | ✅ Básico |

## Las 3 ideas más valiosas

### 1. Sistema de "Fuentes" (como los addons de Stremio)
En Stremio, un addon es un servicio con un `manifest` que declara qué catálogos ofrece; la app los muestra como filas. Para libros:

- **Project Gutenberg** (vía la API Gutendex): más de 70.000 libros de dominio público, con EPUB y portadas.
- **Open Library**: metadatos, portadas y préstamo de libros.
- **Standard Ebooks**: clásicos con ediciones cuidadas.
- **Carpeta local**: vigilar una carpeta del PC o del teléfono e importar sola los libros nuevos (como `stremio-local-addon`).
- **Calibre / OPDS**: conectar con el servidor de Calibre del usuario (OPDS es un estándar de catálogos de ebooks).

Así la app no solo organiza tus libros: también **descubres** libros nuevos y legales sin salir de ella.

### 2. Sincronizar en todos tus dispositivos
"Tu biblioteca y Continuar viendo te siguen entre dispositivos". Para nosotros: Supabase o Steam Cloud para seguir leyendo en el celular en la misma página donde quedaste en el PC.

### 3. Control total por teclado y mando
El reproductor de Stremio se maneja sin mouse. Para libros: navegar todo el Inicio con flechas y Enter, atajos en el lector (`F` pantalla completa, `+`/`-` letra, `B` marcador) y **soporte de mando para Steam Deck**.

## Otras ideas
- **Varios idiomas** (Stremio tiene más de 50, traducidos por la comunidad): ✅ hecho con español, inglés, portugués y francés ([IDIOMAS.md](IDIOMAS.md)).
- **"Casting" → enviar a e-reader**: mandar un libro al Kindle o Kobo por correo, o abrirlo en otro dispositivo.
- **Subtítulos → diccionario y traducción**: tocar una palabra para ver su definición o traducción.
