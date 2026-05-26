import { useState } from 'react';
import { ConfigProvider, theme, Layout, Modal, message } from 'antd';
import { invoke } from '@tauri-apps/api/core';
import { useTools } from './hooks/useTools';
import CategoryTree from './components/CategoryTree';
import ToolGrid from './components/ToolGrid';
import SearchBar from './components/SearchBar';
import ToolDialog from './components/ToolDialog';
import RecentTools from './components/RecentTools';
import ImportExportBar from './components/ImportExportBar';
import ThemeToggle from './components/ThemeToggle';
import { ToolItem, ToolFormValues, DroppedFile } from './types';
import './App.css';

const { Header, Sider, Content, Footer } = Layout;

function App() {
  const {
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
    batchMoveTools,
    batchDeleteTools,
    refreshCategories,
  } = useTools();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<ToolItem | null>(null);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('toolhub-theme') === 'dark');
  const [initialFormValues, setInitialFormValues] = useState<Partial<ToolFormValues> | undefined>(undefined);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('toolhub-theme', next ? 'dark' : 'light');
  };

  const selectedCategoryName =
    selectedCategoryId
      ? categories.find((c) => c.id === selectedCategoryId)?.name || ''
      : '全部工具';

  const handleAdd = () => {
    setEditingTool(null);
    setInitialFormValues(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (tool: ToolItem) => {
    setEditingTool(tool);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    const tool = tools.find((t) => t.id === id);
    Modal.confirm({
      title: `确认删除工具"${tool?.name}"？`,
      content: '此操作不可撤销。',
      onOk: async () => {
        await deleteTool(id);
        message.success('工具已删除');
      },
    });
  };

  const handleSave = async (values: ToolFormValues) => {
    if (editingTool) {
      await updateTool(editingTool.id, values);
      message.success('工具已更新');
    } else {
      await createTool(values);
      message.success('工具已添加');
    }
    setDialogOpen(false);
    setInitialFormValues(undefined);
  };

  const handleLaunch = async (tool: ToolItem) => {
    try {
      await launchTool(tool);
    } catch (e) {
      message.error(`启动失败: ${e}`);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rawPath = e.dataTransfer.files[0]?.path;
    if (!rawPath) {
      message.warning('无法读取拖入的文件路径');
      return;
    }
    try {
      const result = await invoke<DroppedFile | null>('parse_dropped_file', { path: rawPath });
      if (!result) {
        message.warning('文件不存在或无法访问');
        return;
      }
      setEditingTool(null);
      setInitialFormValues({ name: result.name, path: result.path });
      setDialogOpen(true);
    } catch (err) {
      message.error(`解析文件失败: ${err}`);
    }
  };

  return (
    <ConfigProvider
      theme={{ algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm }}
    >
    <Layout style={{ height: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '0 16px' }}>
        <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginRight: 24 }}>
          ToolHub
        </div>
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
        <div style={{ marginLeft: 'auto' }}>
          <ImportExportBar onImported={refreshCategories} />
        </div>
        <div>
          <button onClick={handleAdd} style={{ color: '#fff', background: '#1677ff', border: 'none', borderRadius: 4, padding: '4px 12px', cursor: 'pointer' }}>
            + 添加
          </button>
        </div>
      </Header>
      <Layout>
        <Sider width={220} style={{ background: '#fff', borderRight: '1px solid #f0f0f0', overflow: 'auto' }}>
          <CategoryTree
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelect={setSelectedCategoryId}
            onCreate={createCategory}
            onUpdate={updateCategory}
            onDelete={deleteCategory}
          />
        </Sider>
        <Content
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          style={{ overflow: 'auto' }}
        >
          <ToolGrid
            tools={tools}
            categories={categories}
            loading={loading}
            categoryName={selectedCategoryName}
            onLaunch={handleLaunch}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onMove={moveTool}
            onBatchMove={batchMoveTools}
            onBatchDelete={batchDeleteTools}
          />
        </Content>
      </Layout>
      <Footer style={{ padding: 0 }}>
        <RecentTools tools={recentTools} onLaunch={handleLaunch} />
      </Footer>
      <ToolDialog
        open={dialogOpen}
        editingTool={editingTool}
        categories={categories}
        initialValues={initialFormValues}
        onSave={handleSave}
        onCancel={() => { setDialogOpen(false); setInitialFormValues(undefined); }}
      />
    </Layout>
    </ConfigProvider>
  );
}

export default App;
