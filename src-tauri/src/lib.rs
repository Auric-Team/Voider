use std::fs;
use voider_core::types::{BasicBlockInfo, BinaryAnalysis, DecompiledFunction, FunctionInfo};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! Voider Core is ready.", name)
}

#[tauri::command]
fn analyze_binary_file(path: String) -> Result<BinaryAnalysis, String> {
    let bytes = fs::read(&path).map_err(|e| format!("Failed to read file '{}': {}", path, e))?;
    let filename = std::path::Path::new(&path)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("binary.bin");
    voider_core::analyze_binary(&bytes, filename)
}

#[tauri::command]
fn analyze_binary_bytes(bytes: Vec<u8>, filename: String) -> Result<BinaryAnalysis, String> {
    voider_core::analyze_binary(&bytes, &filename)
}

#[tauri::command]
fn decompile_function_cmd(
    func: FunctionInfo,
    blocks: Vec<BasicBlockInfo>,
) -> Result<DecompiledFunction, String> {
    Ok(voider_core::decompile(&func, &blocks))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            analyze_binary_file,
            analyze_binary_bytes,
            decompile_function_cmd
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
