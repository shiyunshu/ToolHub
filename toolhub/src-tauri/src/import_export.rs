use crate::database::{Database, Tool, Category};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ExportData {
    pub categories: Vec<Category>,
    pub tools: Vec<Tool>,
}

pub fn export_to_json(db: &Database) -> Result<String, String> {
    let categories = db.get_all_categories().map_err(|e| e.to_string())?;
    let tools = db.get_all_tools().map_err(|e| e.to_string())?;
    let data = ExportData { categories, tools };
    serde_json::to_string_pretty(&data).map_err(|e| e.to_string())
}

pub fn import_from_json(db: &Database, json: &str) -> Result<(), String> {
    let data: ExportData = serde_json::from_str(json).map_err(|e| e.to_string())?;
    db.bulk_import(&data.categories, &data.tools)
        .map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::database::Database;

    fn setup_db() -> Database {
        let dir = std::env::temp_dir().join(format!("toolhub_export_test_{}", uuid::Uuid::new_v4()));
        Database::new(dir).unwrap()
    }

    #[test]
    fn test_roundtrip_export_import() {
        let db = setup_db();
        db.create_category("c1", "\u{5F00}\u{53D1}\u{5DE5}\u{5177}", None).unwrap();
        db.create_tool("t1", "VS Code", "C:\\Code.exe", "c1", None, None, None).unwrap();

        let json = export_to_json(&db).unwrap();
        assert!(json.contains("VS Code"));

        let db2 = setup_db();
        import_from_json(&db2, &json).unwrap();
        let tools = db2.get_all_tools().unwrap();
        assert_eq!(tools.len(), 1);
        assert_eq!(tools[0].name, "VS Code");
    }
}
