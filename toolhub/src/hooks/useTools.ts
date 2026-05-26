import { message } from 'antd';
import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ToolCategory, ToolItem, ToolFormValues, CategoryFormValues } from '../types';

export function useTools() {
  const [categories, setCategories] = useState<ToolCategory[]>([]);
  const [tools, setTools] = useState<ToolItem[]>([]);
  const [recentTools, setRecentTools] = useState<ToolItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const refreshCategories = useCallback(async () => {
    const cats = await invoke<ToolCategory[]>('get_categories');
    setCategories(cats);
  }, []);

  const fetchTools = useCallback(async (categoryId: string | null) => {
    setLoading(true);
    try {
      if (categoryId) {
        const result = await invoke<ToolItem[]>('get_tools', { categoryId });
        setTools(result);
      } else {
        const result = await invoke<ToolItem[]>('get_all_tools');
        setTools(result);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecentTools = useCallback(async () => {
    const result = await invoke<ToolItem[]>('get_recent_tools', { limit: 5 });
    setRecentTools(result);
  }, []);

  const searchTools = useCallback(async (query: string) => {
    if (!query.trim()) {
      fetchTools(selectedCategoryId);
      return;
    }
    setLoading(true);
    try {
      const result = await invoke<ToolItem[]>('search_tools', { query });
      setTools(result);
    } finally {
      setLoading(false);
    }
  }, [selectedCategoryId, fetchTools]);

  // Initialize
  useEffect(() => {
    refreshCategories();
    fetchRecentTools();
  }, [refreshCategories, fetchRecentTools]);

  useEffect(() => {
    if (searchQuery.trim()) {
      searchTools(searchQuery);
    } else {
      fetchTools(selectedCategoryId);
    }
  }, [selectedCategoryId, fetchTools, searchQuery, searchTools]);

  // Category operations
  const createCategory = async (values: CategoryFormValues) => {
    const id = crypto.randomUUID();
    await invoke('create_category', { id, name: values.name, parentId: values.parent_id });
    await refreshCategories();
  };

  const updateCategory = async (id: string, name: string) => {
    await invoke('update_category', { id, name });
    await refreshCategories();
  };

  const deleteCategory = async (id: string) => {
    await invoke('delete_category', { id });
    if (selectedCategoryId === id) setSelectedCategoryId(null);
    await refreshCategories();
    await fetchTools(selectedCategoryId);
  };

  // Tool operations
  const createTool = async (values: ToolFormValues) => {
    const id = crypto.randomUUID();
    await invoke('create_tool', {
      id,
      name: values.name,
      path: values.path,
      categoryId: values.category_id,
      iconPath: null,
      remarks: values.remarks || null,
      tags: values.tags || null,
    });
    await fetchTools(selectedCategoryId);
  };

  const updateTool = async (id: string, values: ToolFormValues) => {
    await invoke('update_tool', {
      id,
      name: values.name,
      path: values.path,
      categoryId: values.category_id,
      iconPath: null,
      remarks: values.remarks || null,
      tags: values.tags || null,
    });
    await fetchTools(selectedCategoryId);
  };

  const deleteTool = async (id: string) => {
    await invoke('delete_tool', { id });
    await fetchTools(selectedCategoryId);
  };

  const moveTool = async (toolId: string, newCategoryId: string) => {
    const tool = tools.find((t) => t.id === toolId);
    if (!tool) return;
    try {
      await invoke('update_tool', {
        id: toolId,
        name: tool.name,
        path: tool.path,
        categoryId: newCategoryId,
        iconPath: tool.icon_path,
        remarks: tool.remarks || null,
        tags: tool.tags || null,
      });
      await fetchTools(selectedCategoryId);
    } catch (e) {
      message.error('移动失败: ' + e);
    }
  };

  const launchTool = async (item: ToolItem) => {
    await invoke('launch_tool', { path: item.path });
    await invoke('increment_launch_count', { id: item.id });
    await fetchTools(selectedCategoryId);
    await fetchRecentTools();
  };

  const batchMoveTools = async (toolIds: string[], targetCategoryId: string) => {
    const failed: string[] = [];
    for (const id of toolIds) {
      const tool = tools.find((t) => t.id === id);
      if (!tool) { failed.push(id); continue; }
      try {
        await invoke('update_tool', {
          id, name: tool.name, path: tool.path, categoryId: targetCategoryId,
          iconPath: tool.icon_path, remarks: tool.remarks || null, tags: tool.tags || null,
        });
      } catch {
        failed.push(tool.name);
      }
    }
    if (failed.length > 0) {
      message.warning(`移动失败 ${failed.length} 个工具`);
    }
    await fetchTools(selectedCategoryId);
  };

  const batchDeleteTools = async (toolIds: string[]) => {
    const failed: string[] = [];
    for (const id of toolIds) {
      try {
        await invoke('delete_tool', { id });
      } catch {
        failed.push(id);
      }
    }
    if (failed.length > 0) {
      message.warning(`删除失败 ${failed.length} 个工具`);
    }
    await fetchTools(selectedCategoryId);
  };

  return {
    categories,
    tools,
    recentTools,
    selectedCategoryId,
    searchQuery,
    loading,
    setSelectedCategoryId,
    setSearchQuery,
    createCategory,
    updateCategory,
    deleteCategory,
    createTool,
    updateTool,
    deleteTool,
    moveTool,
    launchTool,
    searchTools,
    batchMoveTools,
    batchDeleteTools,
    refreshCategories: () => { refreshCategories(); fetchRecentTools(); },
  };
}
