# Lanzamiento en Steam

Steam acepta aplicaciones que no son juegos (categoría **Software / Utilities**), así que una app de lectura es válida.

## Requisitos

1. **Cuenta de Steamworks** y pago de **Steam Direct: 100 USD por app** (se recupera tras 1.000 USD en ventas).
2. Datos fiscales y bancarios en Steamworks.
3. Página de tienda: capsule images, capturas, tráiler, descripción. Valve la revisa (~1–5 días hábiles).
4. La build se revisa antes de publicarse. La página "Próximamente" debe estar visible **al menos 2 semanas** antes del lanzamiento.

## Cómo encaja con nuestro stack

- La versión de PC se compila con **Tauri** → genera `.exe` (Windows), binario Linux (Steam Deck) y `.app` (macOS).
- Esa carpeta se sube a Steam con **SteamPipe** (`steamcmd` + scripts `app_build.vdf`).
- **Integración Steamworks** (opcional pero recomendada):
  - Logros ("Leíste tu primer libro", "Racha de 7 días") y **Steam Cloud** para sincronizar progreso sin servidor propio.
  - Con Tauri: crate de Rust `steamworks` (steamworks-rs) expuesto como comandos de Tauri.
  - Plan B: Electron + `steamworks.js` si la integración en Rust da problemas.
- **Steam Deck**: la interfaz ya es tipo "TV/Netflix", ideal para mando. Habrá que agregar navegación con gamepad (fase 3).

## Modelo: gratis (decidido 2026-11-05)

- Readora será **gratuita** en Steam y en Android. Steam permite publicar apps gratis ("Free"); igual hay que pagar los 100 USD de Steam Direct (en apps gratis no se recuperan).
- Al ser gratis no hacen falta datos de impuestos para cobrar ventas, pero Steamworks igual pide completar el perfil (identidad y, a veces, datos bancarios/fiscales para activar la cuenta).
- En Steam **no** se pueden vender libros con nuestro propio sistema de pago dentro de la app; la app es un lector para archivos propios del usuario y libros de dominio público.
- Readora es **GPL-3.0-or-later con excepción** (desde v0.2, 2026-11-08; ver [LICENSE-EXCEPTION.md](../LICENSE-EXCEPTION.md)). Steam acepta apps de código abierto, pero hay que ofrecer el código fuente (enlace al repositorio en la página de la tienda).

## ✅ GPL y el SDK de Steamworks (resuelto en v0.2)

El SDK de Steamworks (logros, Steam Cloud) **no es software libre**. Con la v0.1 (GPL-2.0 con código de stremio-web) no se podía unir a la app.

En la v0.2 se reescribió ese código y la licencia pasó a GPL-3.0 con una **excepción propia** que permite enlazar Steamworks. La opción 3 que se había planteado ya está hecha, así que **Steamworks se puede integrar**.

## Checklist (fase 3)

- [ ] Crear cuenta Steamworks y pagar Steam Direct
- [ ] Empaquetar con Tauri para Windows y Linux
- [x] Decidir cómo integrar Steamworks sin romper la GPL (excepción en v0.2)
- [ ] Integrar Steamworks (logros, Steam Cloud)
- [ ] Soporte de mando / Steam Deck
- [ ] Página de tienda + "Próximamente"
- [ ] Subir build con SteamPipe y pedir revisión
