// Sin ventana de consola en Windows en la versión final. NO QUITAR.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    readora_lib::run();
}
