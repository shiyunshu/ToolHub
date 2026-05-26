export interface ToolCategory {
  id: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
  created_at: string;
}

export interface ToolItem {
  id: string;
  name: string;
  path: string;
  category_id: string;
  icon_path: string | null;
  remarks: string | null;
  tags: string | null;
  sort_order: number;
  launch_count: number;
  last_launched_at: string | null;
  created_at: string;
}

export interface ToolFormValues {
  name: string;
  path: string;
  category_id: string;
  remarks?: string;
  tags?: string;
}

export interface CategoryFormValues {
  name: string;
  parent_id: string | null;
}

export interface DroppedFile {
  path: string;
  name: string;
  extension: string;
}
