use rusqlite::{Connection, Result, params};
use serde::Serialize;
use std::path::PathBuf;
use std::sync::Mutex;

pub struct Database {
    conn: Mutex<Connection>,
}

#[derive(Debug, Serialize)]
pub struct Category {
    pub id: String,
    pub name: String,
    pub parent_id: Option<String>,
    pub sort_order: i32,
    pub created_at: String,
}

#[derive(Debug, Serialize)]
pub struct Tool {
    pub id: String,
    pub name: String,
    pub path: String,
    pub category_id: String,
    pub icon_path: Option<String>,
    pub remarks: Option<String>,
    pub tags: Option<String>,
    pub sort_order: i32,
    pub launch_count: i32,
    pub last_launched_at: Option<String>,
    pub created_at: String,
}

impl Database {
    pub fn new(app_data_dir: PathBuf) -> Result<Self> {
        std::fs::create_dir_all(&app_data_dir).ok();
        let db_path = app_data_dir.join("toolhub.db");
        let conn = Connection::open(db_path)?;
        conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")?;
        let db = Database {
            conn: Mutex::new(conn),
        };
        db.initialize_tables()?;
        Ok(db)
    }

    fn initialize_tables(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS categories (
                id         TEXT PRIMARY KEY,
                name       TEXT NOT NULL,
                parent_id  TEXT REFERENCES categories(id) ON DELETE CASCADE,
                sort_order INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
            CREATE TABLE IF NOT EXISTS tools (
                id               TEXT PRIMARY KEY,
                name             TEXT NOT NULL,
                path             TEXT NOT NULL,
                category_id      TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
                icon_path        TEXT,
                remarks          TEXT,
                tags             TEXT,
                sort_order       INTEGER NOT NULL DEFAULT 0,
                launch_count     INTEGER NOT NULL DEFAULT 0,
                last_launched_at TEXT,
                created_at       TEXT NOT NULL DEFAULT (datetime('now'))
            );
            CREATE INDEX IF NOT EXISTS idx_tools_category ON tools(category_id);
            CREATE INDEX IF NOT EXISTS idx_tools_name ON tools(name);",
        )?;
        Ok(())
    }

    pub fn get_all_categories(&self) -> Result<Vec<Category>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, parent_id, sort_order, created_at FROM categories ORDER BY sort_order, name",
        )?;
        let rows = stmt.query_map([], |row| {
            Ok(Category {
                id: row.get(0)?,
                name: row.get(1)?,
                parent_id: row.get(2)?,
                sort_order: row.get(3)?,
                created_at: row.get(4)?,
            })
        })?;
        rows.collect()
    }

    pub fn create_category(&self, id: &str, name: &str, parent_id: Option<&str>) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO categories (id, name, parent_id) VALUES (?1, ?2, ?3)",
            params![id, name, parent_id],
        )?;
        Ok(())
    }

    pub fn update_category(&self, id: &str, name: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE categories SET name = ?1 WHERE id = ?2",
            params![name, id],
        )?;
        Ok(())
    }

    pub fn delete_category(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM categories WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn get_tools_by_category(&self, category_id: &str) -> Result<Vec<Tool>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, path, category_id, icon_path, remarks, tags,
                    sort_order, launch_count, last_launched_at, created_at
             FROM tools WHERE category_id = ?1
             ORDER BY launch_count DESC, sort_order, name",
        )?;
        let rows = stmt.query_map(params![category_id], |row| {
            Ok(Tool {
                id: row.get(0)?,
                name: row.get(1)?,
                path: row.get(2)?,
                category_id: row.get(3)?,
                icon_path: row.get(4)?,
                remarks: row.get(5)?,
                tags: row.get(6)?,
                sort_order: row.get(7)?,
                launch_count: row.get(8)?,
                last_launched_at: row.get(9)?,
                created_at: row.get(10)?,
            })
        })?;
        rows.collect()
    }

    pub fn get_all_tools(&self) -> Result<Vec<Tool>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, path, category_id, icon_path, remarks, tags,
                    sort_order, launch_count, last_launched_at, created_at
             FROM tools ORDER BY launch_count DESC, sort_order, name",
        )?;
        let rows = stmt.query_map([], |row| {
            Ok(Tool {
                id: row.get(0)?,
                name: row.get(1)?,
                path: row.get(2)?,
                category_id: row.get(3)?,
                icon_path: row.get(4)?,
                remarks: row.get(5)?,
                tags: row.get(6)?,
                sort_order: row.get(7)?,
                launch_count: row.get(8)?,
                last_launched_at: row.get(9)?,
                created_at: row.get(10)?,
            })
        })?;
        rows.collect()
    }

    pub fn search_tools(&self, query: &str) -> Result<Vec<Tool>> {
        let conn = self.conn.lock().unwrap();
        let pattern = format!("%{}%", query);
        let mut stmt = conn.prepare(
            "SELECT id, name, path, category_id, icon_path, remarks, tags,
                    sort_order, launch_count, last_launched_at, created_at
             FROM tools WHERE name LIKE ?1
             ORDER BY launch_count DESC, sort_order, name",
        )?;
        let rows = stmt.query_map(params![pattern], |row| {
            Ok(Tool {
                id: row.get(0)?,
                name: row.get(1)?,
                path: row.get(2)?,
                category_id: row.get(3)?,
                icon_path: row.get(4)?,
                remarks: row.get(5)?,
                tags: row.get(6)?,
                sort_order: row.get(7)?,
                launch_count: row.get(8)?,
                last_launched_at: row.get(9)?,
                created_at: row.get(10)?,
            })
        })?;
        rows.collect()
    }

    pub fn create_tool(
        &self,
        id: &str,
        name: &str,
        path: &str,
        category_id: &str,
        icon_path: Option<&str>,
        remarks: Option<&str>,
        tags: Option<&str>,
    ) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO tools (id, name, path, category_id, icon_path, remarks, tags)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![id, name, path, category_id, icon_path, remarks, tags],
        )?;
        Ok(())
    }

    pub fn update_tool(
        &self,
        id: &str,
        name: &str,
        path: &str,
        category_id: &str,
        icon_path: Option<&str>,
        remarks: Option<&str>,
        tags: Option<&str>,
    ) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE tools SET name=?1, path=?2, category_id=?3, icon_path=?4,
             remarks=?5, tags=?6 WHERE id=?7",
            params![name, path, category_id, icon_path, remarks, tags, id],
        )?;
        Ok(())
    }

    pub fn delete_tool(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM tools WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn increment_launch_count(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE tools SET launch_count = launch_count + 1, last_launched_at = datetime('now')
             WHERE id = ?1",
            params![id],
        )?;
        Ok(())
    }

    pub fn get_recent_tools(&self, limit: i32) -> Result<Vec<Tool>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, path, category_id, icon_path, remarks, tags,
                    sort_order, launch_count, last_launched_at, created_at
             FROM tools WHERE last_launched_at IS NOT NULL
             ORDER BY last_launched_at DESC LIMIT ?1",
        )?;
        let rows = stmt.query_map(params![limit], |row| {
            Ok(Tool {
                id: row.get(0)?,
                name: row.get(1)?,
                path: row.get(2)?,
                category_id: row.get(3)?,
                icon_path: row.get(4)?,
                remarks: row.get(5)?,
                tags: row.get(6)?,
                sort_order: row.get(7)?,
                launch_count: row.get(8)?,
                last_launched_at: row.get(9)?,
                created_at: row.get(10)?,
            })
        })?;
        rows.collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn setup_test_db() -> Database {
        let dir = std::env::temp_dir().join(format!("toolhub_test_{}", uuid::Uuid::new_v4()));
        Database::new(dir).unwrap()
    }

    #[test]
    fn test_create_and_get_categories() {
        let db = setup_test_db();
        db.create_category("c1", "开发工具", None).unwrap();
        db.create_category("c2", "系统工具", None).unwrap();
        let cats = db.get_all_categories().unwrap();
        assert_eq!(cats.len(), 2);
        assert_eq!(cats[0].name, "开发工具");
    }

    #[test]
    fn test_create_and_get_tools() {
        let db = setup_test_db();
        db.create_category("c1", "开发工具", None).unwrap();
        db.create_tool("t1", "VS Code", "C:\\Code.exe", "c1", None, None, None)
            .unwrap();
        let tools = db.get_tools_by_category("c1").unwrap();
        assert_eq!(tools.len(), 1);
        assert_eq!(tools[0].name, "VS Code");
    }

    #[test]
    fn test_search_tools() {
        let db = setup_test_db();
        db.create_category("c1", "开发工具", None).unwrap();
        db.create_tool(
            "t1",
            "Visual Studio Code",
            "C:\\Code.exe",
            "c1",
            None,
            None,
            None,
        )
        .unwrap();
        db.create_tool("t2", "Git Bash", "C:\\git.exe", "c1", None, None, None)
            .unwrap();
        let results = db.search_tools("visual").unwrap();
        assert_eq!(results.len(), 1);
    }

    #[test]
    fn test_increment_launch_count() {
        let db = setup_test_db();
        db.create_category("c1", "开发工具", None).unwrap();
        db.create_tool("t1", "VS Code", "C:\\Code.exe", "c1", None, None, None)
            .unwrap();
        db.increment_launch_count("t1").unwrap();
        let tools = db.get_tools_by_category("c1").unwrap();
        assert_eq!(tools[0].launch_count, 1);
    }

    #[test]
    fn test_get_recent_tools() {
        let db = setup_test_db();
        db.create_category("c1", "开发工具", None).unwrap();
        db.create_tool("t1", "VS Code", "C:\\Code.exe", "c1", None, None, None)
            .unwrap();
        db.increment_launch_count("t1").unwrap();
        let recent = db.get_recent_tools(5).unwrap();
        assert_eq!(recent.len(), 1);
    }

    #[test]
    fn test_delete_tool() {
        let db = setup_test_db();
        db.create_category("c1", "开发工具", None).unwrap();
        db.create_tool("t1", "VS Code", "C:\\Code.exe", "c1", None, None, None)
            .unwrap();
        db.delete_tool("t1").unwrap();
        let tools = db.get_tools_by_category("c1").unwrap();
        assert_eq!(tools.len(), 0);
    }
}
