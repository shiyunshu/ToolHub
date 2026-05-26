import { useState } from 'react';
import { Row, Col, Empty, Spin, Typography, Space, Checkbox, Button, Modal, Select, message } from 'antd';
import { FolderOpenOutlined, DeleteOutlined } from '@ant-design/icons';
import ToolCard from './ToolCard';
import { ToolItem, ToolCategory } from '../types';

const { Title, Text } = Typography;

interface Props {
  tools: ToolItem[];
  categories: ToolCategory[];
  loading: boolean;
  categoryName: string;
  onLaunch: (tool: ToolItem) => void;
  onEdit: (tool: ToolItem) => void;
  onDelete: (id: string) => void;
  onMove: (toolId: string, categoryId: string) => Promise<void>;
  onBatchMove: (toolIds: string[], targetCategoryId: string) => Promise<void>;
  onBatchDelete: (toolIds: string[]) => Promise<void>;
}

export default function ToolGrid({
  tools,
  categories,
  loading,
  categoryName,
  onLaunch,
  onEdit,
  onDelete,
  onMove,
  onBatchMove,
  onBatchDelete,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [targetCategoryId, setTargetCategoryId] = useState<string | null>(null);

  const toggleSelectAll = () => {
    if (selectedIds.size === tools.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(tools.map((t) => t.id)));
    }
  };

  const handleBatchMove = async () => {
    if (!targetCategoryId) {
      message.warning('请选择目标分类');
      return;
    }
    if (selectedIds.size === 0) return;
    try {
      await onBatchMove(Array.from(selectedIds), targetCategoryId);
      message.success(`已移动 ${selectedIds.size} 个工具`);
    } catch {
      message.error('批量移动失败');
    }
    setSelectedIds(new Set());
    setMoveModalOpen(false);
  };

  const handleBatchDelete = () => {
    Modal.confirm({
      title: `确认删除选中的 ${selectedIds.size} 个工具？`,
      content: '此操作不可撤销。',
      onOk: async () => {
        try {
          await onBatchDelete(Array.from(selectedIds));
          message.success('已删除');
        } catch {
          message.error('批量删除失败');
        }
        setSelectedIds(new Set());
      },
    });
  };

  return (
    <div style={{ padding: 16 }}>
      <Title level={4} style={{ marginBottom: 16 }}>
        {categoryName || '全部工具'}
        <Text type="secondary" style={{ fontSize: 14, marginLeft: 8 }}>
          （共 {tools.length} 个）
        </Text>
      </Title>
      {selectedIds.size > 0 && (
        <div style={{ marginBottom: 12, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
          <Space>
            <Checkbox
              checked={selectedIds.size === tools.length}
              indeterminate={selectedIds.size > 0 && selectedIds.size < tools.length}
              onChange={toggleSelectAll}
            >
              全选
            </Checkbox>
            <span>已选 {selectedIds.size} 项</span>
            <Button size="small" icon={<FolderOpenOutlined />} onClick={() => setMoveModalOpen(true)}>
              移动到
            </Button>
            <Button size="small" danger icon={<DeleteOutlined />} onClick={handleBatchDelete}>
              删除
            </Button>
            <Button size="small" onClick={() => setSelectedIds(new Set())}>
              取消选择
            </Button>
          </Space>
        </div>
      )}
      <Spin spinning={loading}>
        {tools.length === 0 ? (
          <Empty description="暂无工具，拖拽 exe 文件到此处添加" />
        ) : (
          <Row gutter={[12, 12]}>
            {tools.map((tool) => (
              <Col key={tool.id}>
                <ToolCard
                  tool={tool}
                  categories={categories}
                  selected={selectedIds.has(tool.id)}
                  showCheckbox={selectedIds.size > 0}
                  onLaunch={onLaunch}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onMove={onMove}
                  onSelect={() => {
                    const next = new Set(selectedIds);
                    if (next.has(tool.id)) { next.delete(tool.id); } else { next.add(tool.id); }
                    setSelectedIds(next);
                  }}
                />
              </Col>
            ))}
          </Row>
        )}
      </Spin>
      <Modal
        title="移动到分类"
        open={moveModalOpen}
        onOk={handleBatchMove}
        onCancel={() => setMoveModalOpen(false)}
      >
        <Select
          style={{ width: '100%' }}
          placeholder="选择目标分类"
          options={categories.map((c) => ({ label: c.name, value: c.id }))}
          onChange={setTargetCategoryId}
        />
      </Modal>
    </div>
  );
}
