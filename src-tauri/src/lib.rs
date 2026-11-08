/// Arranque de la app de escritorio de Readora (Windows / Linux).
///
/// Toda la app es la versión web compilada (`dist`). Rust solo aporta:
/// - `http`: descargas de libros sin la restricción CORS del navegador (lista blanca en capabilities/default.json).
/// - `notification`: avisos nativos del sistema para los recordatorios.
/// - `opener`: abrir enlaces externos en el navegador del usuario.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("no se pudo iniciar Readora");
}
