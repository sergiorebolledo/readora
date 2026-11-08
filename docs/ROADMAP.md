# Hoja de ruta

## Fase 1 — MVP web ✅ (2026-11-05)
- [x] Biblioteca estilo Netflix: destacado, filas "Continuar leyendo", "Agregados recientemente", "Favoritos", "Terminados", "Toda la biblioteca"
- [x] Importar libros (PDF, EPUB, TXT, CBZ) con portada y metadatos automáticos
- [x] Lectores por formato que guardan la página actual
- [x] Ficha del libro: estado (por leer / leyendo / terminado), favorito, eliminar
- [x] Historial: sesiones de lectura, tiempo, páginas por día, racha
- [x] Recordatorios diarios con notificación
- [x] Búsqueda por título/autor

## Fase 1.5 — Rediseño ✅ (2026-11-05)
- [x] Paleta violeta y distribución inspirada en Stremio (ver [DISENO.md](DISENO.md))
- [x] Barra lateral de iconos, buscador centrado, filas con "Ver todo"
- [x] Página Biblioteca con filtros y orden

## Fase 2 — Más formatos y apps nativas
- [x] **Explorar + Fuentes** (como los addons de Stremio): Project Gutenberg, Open Library, carpeta local — ver [FUENTES.md](FUENTES.md)
- [ ] Más fuentes: Calibre/OPDS, Standard Ebooks, carpeta vigilada
- [x] Nombre definitivo **Readora**, logo e íconos
- [x] Multilingüe: español, inglés, portugués y francés ([IDIOMAS.md](IDIOMAS.md))
- [x] Descargas con HTTP nativo en Android
- [ ] Descargas con HTTP nativo en PC (Tauri)
- [x] Ajustes: idioma, acerca de, créditos
- [x] Licencia GPL-2.0 y atajos de teclado adaptados de stremio-web (v0.1)
- [x] v0.2: licencia GPL-3.0 + excepción, atajos reescritos sin código de Stremio
- [x] v0.2: analítica opcional con PostHog, banner AdMob en Android, donaciones ([MONETIZACION.md](MONETIZACION.md))
- [ ] Cuentas reales de PostHog y AdMob, enlace de donaciones, `app-ads.txt`
- [x] Revisión de seguridad (CSP, descargas solo HTTPS, permisos mínimos) y de UX/UI (2026-11-08)
- [ ] Publicar en Google Play: firma, prueba cerrada (12 personas, 14 días), formularios ([PUBLICAR.md](PUBLICAR.md))
- [ ] App de escritorio con Tauri (requisito para Microsoft Store y Steam)
- [ ] Publicar en Microsoft Store y Steam (sin anuncios en PC)
- [x] Código fuente público en GitHub y enlazado desde Ajustes
- [ ] Ajustes: tema, color de acento, copia de seguridad
- [ ] Calendario de lectura y metas
- [ ] Navegación completa con teclado (flechas por las filas) y mando (Steam Deck)
- [x] Repositorio git (github.com/sergiorebolledo/readora)
- [ ] Probar CBZ y libros grandes
- [ ] MOBI, AZW3, FB2 (foliate-js), CBR, DOCX
- [ ] Marcadores y notas/resaltados
- [ ] Colecciones propias ("Universidad", "Ciencia ficción"...)
- [ ] Portadas y metadatos desde Open Library cuando el archivo no los trae
- [x] App Android con Capacitor: APK de prueba, notificaciones nativas, botón atrás ([ANDROID.md](ANDROID.md))
- [ ] Android: abrir archivos desde otras apps, probar en teléfono real, APK firmado
- [ ] App de escritorio con Tauri
- [ ] Migrar almacenamiento a SQLite nativo + archivos en disco

## Fase 3 — Nube y Steam
- [ ] Cuentas y sincronización entre dispositivos (Supabase)
- [ ] Lanzamiento en Steam (ver [STEAM.md](STEAM.md))
- [ ] Publicación en Google Play
