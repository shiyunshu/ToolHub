mod database;
mod drag_drop;
mod icon_extractor;
mod import_export;
mod launcher;

use database::Database;
use tauri::Manager;
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, ShortcutState};

#[tauri::command]
fn get_categories(state: tauri::State<'_, Database>) -> Result<Vec<database::Category>, String> {
    state.get_all_categories().map_err(|e| e.to_string())
}

#[tauri::command]
fn create_category(
    state: tauri::State<'_, Database>,
    id: String,
    name: String,
    parent_id: Option<String>,
) -> Result<(), String> {
    state
        .create_category(&id, &name, parent_id.as_deref())
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn update_category(
    state: tauri::State<'_, Database>,
    id: String,
    name: String,
) -> Result<(), String> {
    state.update_category(&id, &name).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_category(state: tauri::State<'_, Database>, id: String) -> Result<(), String> {
    state.delete_category(&id).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_tools(
    state: tauri::State<'_, Database>,
    category_id: String,
) -> Result<Vec<database::Tool>, String> {
    state
        .get_tools_by_category(&category_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_all_tools(state: tauri::State<'_, Database>) -> Result<Vec<database::Tool>, String> {
    state.get_all_tools().map_err(|e| e.to_string())
}

#[tauri::command]
fn search_tools(
    state: tauri::State<'_, Database>,
    query: String,
) -> Result<Vec<database::Tool>, String> {
    state.search_tools(&query).map_err(|e| e.to_string())
}

#[tauri::command]
fn create_tool(
    state: tauri::State<'_, Database>,
    id: String,
    name: String,
    path: String,
    category_id: String,
    icon_path: Option<String>,
    remarks: Option<String>,
    tags: Option<String>,
) -> Result<(), String> {
    state
        .create_tool(
            &id,
            &name,
            &path,
            &category_id,
            icon_path.as_deref(),
            remarks.as_deref(),
            tags.as_deref(),
        )
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn update_tool(
    state: tauri::State<'_, Database>,
    id: String,
    name: String,
    path: String,
    category_id: String,
    icon_path: Option<String>,
    remarks: Option<String>,
    tags: Option<String>,
) -> Result<(), String> {
    state
        .update_tool(
            &id,
            &name,
            &path,
            &category_id,
            icon_path.as_deref(),
            remarks.as_deref(),
            tags.as_deref(),
        )
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_tool(state: tauri::State<'_, Database>, id: String) -> Result<(), String> {
    state.delete_tool(&id).map_err(|e| e.to_string())
}

#[tauri::command]
fn increment_launch_count(state: tauri::State<'_, Database>, id: String) -> Result<(), String> {
    state.increment_launch_count(&id).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_recent_tools(
    state: tauri::State<'_, Database>,
    limit: i32,
) -> Result<Vec<database::Tool>, String> {
    state.get_recent_tools(limit).map_err(|e| e.to_string())
}

#[tauri::command]
fn launch_tool(path: String) -> Result<(), String> {
    launcher::launch_tool(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn parse_dropped_file(path: String) -> Option<drag_drop::DroppedFile> {
    drag_drop::parse_dropped_file(&path)
}

#[tauri::command]
fn export_data(state: tauri::State<'_, Database>) -> Result<String, String> {
    import_export::export_to_json(state.inner())
}

#[tauri::command]
fn import_data(state: tauri::State<'_, Database>, json: String) -> Result<(), String> {
    import_export::import_from_json(state.inner(), &json)
}

#[tauri::command]
fn write_text_file(path: String, content: String) -> Result<(), String> {
    std::fs::write(&path, &content).map_err(|e| e.to_string())
}

#[tauri::command]
fn read_text_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn extract_icon(path: String) -> Result<Option<String>, String> {
    Ok(icon_extractor::extract_icon_base64(&path))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(move |app, shortcut, event| {
                    if event.state == ShortcutState::Pressed
                        && shortcut.matches(Modifiers::CONTROL | Modifiers::ALT, Code::KeyT)
                    {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(),
        )
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("failed to get app data dir");
            let db = Database::new(app_data_dir).expect("failed to initialize database");
            app.manage(db);

            // Register global shortcut
            app.global_shortcut()
                .register(tauri_plugin_global_shortcut::Hotkey::new(
                    Some(Modifiers::CONTROL | Modifiers::ALT),
                    Code::KeyT,
                ))
                .ok();

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_categories,
            create_category,
            update_category,
            delete_category,
            get_tools,
            get_all_tools,
            search_tools,
            create_tool,
            update_tool,
            delete_tool,
            increment_launch_count,
            get_recent_tools,
            launch_tool,
            parse_dropped_file,
            export_data,
            import_data,
            write_text_file,
            read_text_file,
            extract_icon,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
