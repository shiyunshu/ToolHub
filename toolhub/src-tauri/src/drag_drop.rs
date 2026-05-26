use std::path::Path;

#[derive(Debug, serde::Serialize)]
pub struct DroppedFile {
    pub path: String,
    pub name: String,
    pub extension: String,
}

pub fn parse_dropped_file(path: &str) -> Option<DroppedFile> {
    let p = Path::new(path);
    if !p.exists() {
        return None;
    }
    let name = p.file_stem()?.to_str()?.to_string();
    let extension = p.extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();
    Some(DroppedFile {
        path: path.to_string(),
        name,
        extension,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_exe_path() {
        let dir = std::env::temp_dir().join("toolhub_drag_test");
        std::fs::create_dir_all(&dir).unwrap();
        let file_path = dir.join("notepad.exe");
        std::fs::File::create(&file_path).unwrap();
        let result = parse_dropped_file(file_path.to_str().unwrap());
        assert!(result.is_some());
        let f = result.unwrap();
        assert_eq!(f.name, "notepad");
        assert_eq!(f.extension, "exe");
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn test_parse_non_existent_path() {
        let result = parse_dropped_file("Z:\\does_not_exist\\foo.exe");
        assert!(result.is_none());
    }
}
