/// <reference types="vite/client" />

// Tauri webview extends File with a `path` property for drag-drop
interface File {
  path: string;
}
