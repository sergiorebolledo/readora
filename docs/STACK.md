# Stack tecnológico

> Decisión tomada el 2026-11-05. Este documento explica **qué** usamos y **por qué**.

## Objetivo del producto

Una biblioteca personal de libros "tipo Netflix" para **PC (Windows, y luego Linux/macOS)**, **Android** y **Steam**:
portadas grandes, filas de "Continuar leyendo", historial de lectura, página actual guardada y recordatorios.

## Resumen

| Capa | Tecnología | Por qué |
|---|---|---|
| Lenguaje | TypeScript | Tipos = menos errores en un proyecto que va a crecer. |
| Interfaz | React 19 + Vite | Un solo código para todas las plataformas; ecosistema enorme. |
| Estilos | Tailwind CSS v4 | Tema oscuro y diseño responsive (celular/PC) rápido. |
| Base de datos local | Dexie (IndexedDB) | Funciona offline y guarda archivos (Blob) dentro del navegador/app. Se puede migrar a SQLite nativo más adelante. |
| Lector PDF | pdf.js (`pdfjs-dist`, Mozilla) | Estándar de facto; también genera la portada desde la página 1. |
| Lector EPUB | epub.js (`epubjs`) | Paginación, CFI (posición exacta) y extracción de portada. |
| Cómics CBZ | JSZip | Un CBZ es un ZIP de imágenes. |
| TXT | Nativo | Se pagina por bloques de texto. |
| App Android | Capacitor | Empaqueta la app web como APK/AAB nativo (Play Store). |
| App PC / Steam | Tauri 2 | Instalador liviano (~10 MB) para Windows, Linux (Steam Deck) y macOS. |
| Recordatorios | Notification API (web) / `@capacitor/local-notifications` (Android) | Avisos locales sin servidor. |
| Idiomas | i18next + react-i18next | Traducciones en JSON, plurales y detección del idioma del sistema ([IDIOMAS.md](IDIOMAS.md)). |
| Iconos | lucide-react (ISC) | Iconos de línea consistentes. |
| Sincronización (fase 2) | Supabase | Cuentas + Postgres + Storage para seguir leyendo en otro dispositivo. |

## Alternativas descartadas

- **Flutter**: muy buen rendimiento, pero casi no hay lectores EPUB de calidad y prácticamente nada para MOBI/AZW3/FB2. El objetivo "todos los formatos" pesa más.
- **Electron (en vez de Tauri)**: más fácil de integrar con Steamworks (`steamworks.js`), pero pesa ~150 MB por instalación. Se mantiene como **plan B** si la integración de Steam con Tauri da problemas (ver [STEAM.md](STEAM.md)).
- **App nativa separada (Kotlin + C#)**: dos códigos que mantener; no tiene sentido para un equipo pequeño.

## Formatos

| Formato | Estado | Librería |
|---|---|---|
| PDF | ✅ MVP | pdf.js |
| EPUB | ✅ MVP | epub.js |
| TXT | ✅ MVP | nativo |
| CBZ | ✅ MVP | JSZip |
| MOBI / AZW3 / FB2 | 🔜 Fase 2 | foliate-js (reemplazaría a epub.js para unificar lectores) |
| CBR | 🔜 Fase 2 | unrar compilado a WebAssembly |
| DOCX | 🔜 Fase 2 | mammoth.js |

> ⚠️ Los libros con **DRM** (Kindle, algunas tiendas) no se pueden abrir: es una restricción legal, no técnica.
