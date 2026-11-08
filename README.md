# Readora 📚

Biblioteca personal de libros con estilo de catálogo (inspirado en Stremio) para PC, Android y Steam.
Agrega tus PDF, EPUB, TXT y cómics CBZ y verás sus portadas, sabrás en qué página vas, tendrás tu historial de lectura y recordatorios.

> App **gratuita**, **de código abierto (GPL-3.0)** y **multilingüe** (español, inglés, portugués y francés).

## Descargar

- **Android**: APK de prueba en [Releases](https://github.com/sergiorebolledo/readora/releases) (Android 7.0 o superior).

## Cómo ejecutarlo

Requisitos: [Node.js](https://nodejs.org) 20 o superior.

```bash
npm install
```

```bash
npm run dev
```

Abre http://localhost:5173 en el navegador.

Otros comandos:

- `npm run build`: genera la versión de producción en `dist/`.
- `npm run typecheck`: revisa los tipos de TypeScript.
- App Android: ver [docs/ANDROID.md](docs/ANDROID.md).

## Funciones (MVP)

- Inicio con filas (Continuar leyendo, Recientes, Favoritos, Por leer, Terminados…) y "Ver todo".
- Biblioteca en cuadrícula con filtros y orden.
- **Explorar**: descarga libros gratis y legales de Project Gutenberg y Open Library (como los addons de Stremio).
- **Fuentes**: activa o desactiva catálogos e importa una carpeta completa de tu PC.
- Importar libros con botón o arrastrando archivos; portada y metadatos automáticos.
- Lectores PDF, EPUB, TXT y CBZ que guardan la página donde vas.
- Historial: sesiones, tiempo leído, racha y gráfico semanal.
- Recordatorios por hora y día de la semana.
- Funciona sin internet; los datos quedan en el dispositivo.
- **Ajustes**: idioma de la app (ES, EN, PT, FR), acerca de y créditos.
- **Android**: APK con notificaciones nativas para los recordatorios.
- **Atajos de teclado**: `1`–`7` secciones, `/` buscar, `F` pantalla completa, `?` ver todos; en el lector ← → Espacio, `+`/`-` letra, `H` ocultar controles.

## Licencia

Readora es software libre bajo la [GNU GPL versión 3 o posterior](LICENSE), con una [excepción](LICENSE-EXCEPTION.md) que permite usar los SDK de Google Mobile Ads y Steamworks. Código fuente: https://github.com/sergiorebolledo/readora
(La v0.1.0 se publicó como GPL-2.0 con código de stremio-web; desde la v0.2.0 ese código se reescribió.)

## Privacidad, anuncios y donaciones

- Estadísticas de uso **anónimas y opcionales** con Google Analytics para Firebase. Nunca se envían libros, títulos ni búsquedas.
- La versión de Android muestra un banner de AdMob en Inicio y Explorar (nunca en el lector).
- Política: [docs/PRIVACIDAD.md](docs/PRIVACIDAD.md) · Configuración: [docs/MONETIZACION.md](docs/MONETIZACION.md)

## Documentación

| Documento | Contenido |
|---|---|
| [docs/STACK.md](docs/STACK.md) | Tecnologías elegidas y por qué |
| [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md) | Carpetas, modelo de datos y cómo agregar formatos |
| [docs/DISENO.md](docs/DISENO.md) | Paleta de colores y decisiones visuales |
| [docs/IDEAS-STREMIO.md](docs/IDEAS-STREMIO.md) | Qué aprovechar de Stremio (y qué no, por licencia) |
| [docs/FUENTES.md](docs/FUENTES.md) | Explorar y Fuentes: cómo funcionan y cómo agregar una |
| [docs/IDIOMAS.md](docs/IDIOMAS.md) | Traducciones y cómo agregar un idioma |
| [docs/ANDROID.md](docs/ANDROID.md) | Compilar e instalar la app de Android |
| [docs/MONETIZACION.md](docs/MONETIZACION.md) | Analítica (Firebase), anuncios (AdMob) y donaciones |
| [docs/PRIVACIDAD.md](docs/PRIVACIDAD.md) | Política de privacidad (es/en) |
| [docs/PUBLICAR.md](docs/PUBLICAR.md) | Dónde van las claves y cómo publicar en Google Play, Microsoft Store y Steam |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Fases del proyecto |
| [docs/STEAM.md](docs/STEAM.md) | Plan para publicar en Steam |
| [docs/BITACORA.md](docs/BITACORA.md) | Registro de avances por sesión |
