// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::path::PathBuf;

#[tauri::command]
fn read_pdf_text(path: String) -> Result<String, String> {
    let path_buf = PathBuf::from(path);

    // Check if file exists
    if !path_buf.exists() {
        return Err("Datei wurde nicht gefunden.".to_string());
    }

    // Extract text using pdf-extract
    match pdf_extract::extract_text(&path_buf) {
        Ok(text) => Ok(text),
        Err(e) => Err(format!("Fehler beim Extrahieren des PDF-Textes: {}", e)),
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![read_pdf_text])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
