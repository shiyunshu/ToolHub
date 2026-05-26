import { useState } from 'react';
import { Layout, Modal, message } from 'antd';
import { useTools } from './hooks/useTools';
import CategoryTree from './components/CategoryTree';
import ToolGrid from './components/ToolGrid';
import SearchBar from './components/SearchBar';
import ToolDialog from './components/ToolDialog';
import RecentTools from './components/RecentTools';
import ImportExportBar from './components/ImportExportBar';
import { ToolItem, ToolFormValues } from './types';
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
    launchTool,
    refreshCategories,
  } = useTools();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<ToolItem | null>(null);

  const selectedCategoryName =
    selectedCategoryId
      ? categories.find((c) => c.id === selectedCategoryId)?.name || ''
      : '全部工具';

  const handleAdd = () => {
    setEditingTool(null);
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    message.info('拖放添加将在 V2 中支持');
  };

  return (
    <Layout style={{ height: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '0 16px' }}>
        <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginRight: 24 }}>
          ToolHub
        </div>
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
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
            loading={loading}
            categoryName={selectedCategoryName}
            onLaunch={handleLaunch}
            onEdit={handleEdit}
            onDelete={handleDelete}
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
        onSave={handleSave}
        onCancel={() => setDialogOpen(false)}
      />
    </Layout>
  );
}

export default App;
