# Bitácora de desarrollo

Registro de lo hecho en cada sesión de trabajo (lo más reciente arriba).

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
