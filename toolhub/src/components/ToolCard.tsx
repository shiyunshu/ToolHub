import { Card, Dropdown, Typography, message } from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  FolderOpenOutlined,
  CopyOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { ToolItem, ToolCategory } from '../types';

const { Text } = Typography;

interface Props {
  tool: ToolItem;
  categories: ToolCategory[];
  onLaunch: (tool: ToolItem) => void;
  onEdit: (tool: ToolItem) => void;
  onDelete: (id: string) => void;
  onMove: (toolId: string, categoryId: string) => Promise<void>;
}

export default function ToolCard({ tool, categories, onLaunch, onEdit, onDelete, onMove }: Props) {
  const handleContextMenu = (key: string) => {
    if (key.startsWith('move-')) {
      const categoryId = key.replace('move-', '');
      onMove(tool.id, categoryId);
      return;
    }
    switch (key) {
      case 'launch':
        onLaunch(tool);
        break;
      case 'edit':
        onEdit(tool);
        break;
      case 'copy-path':
        navigator.clipboard.writeText(tool.path).then(() => {
          message.success('路径已复制');
        });
        break;
      case 'delete':
        onDelete(tool.id);
        break;
    }
  };

  const menuItems = [
    { key: 'launch', label: '启动', icon: <FolderOpenOutlined /> },
    { key: 'edit', label: '编辑', icon: <EditOutlined /> },
    {
      key: 'move-to',
      label: '移动到',
      icon: <SwapOutlined />,
      children: categories
        .filter((c) => c.id !== tool.category_id)
        .map((cat) => ({
          key: `move-${cat.id}`,
          label: cat.name,
        })),
    },
    { key: 'copy-path', label: '复制路径', icon: <CopyOutlined /> },
    { key: 'delete', label: '删除', icon: <DeleteOutlined />, danger: true },
  ];

  return (
    <Dropdown menu={{ items: menuItems, onClick: ({ key }) => handleContextMenu(key) }} trigger={['contextMenu']}>
      <Card
        hoverable
        size="small"
        style={{ width: 140, textAlign: 'center', cursor: 'pointer' }}
        onDoubleClick={() => onLaunch(tool)}
        styles={{ body: { padding: 12 } }}
      >
        <div style={{ fontSize: 32, marginBottom: 8 }}>
          <FolderOpenOutlined />
        </div>
        <Text ellipsis style={{ maxWidth: 116, display: 'block' }}>
          {tool.name}
        </Text>
        {tool.launch_count > 0 && (
          <Text type="secondary" style={{ fontSize: 11 }}>
            使用 {tool.launch_count} 次
          </Text>
        )}
      </Card>
    </Dropdown>
  );
}
