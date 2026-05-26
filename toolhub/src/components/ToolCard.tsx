import { Card, Dropdown, Typography, message } from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  FolderOpenOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import { ToolItem } from '../types';

const { Text } = Typography;

interface Props {
  tool: ToolItem;
  onLaunch: (tool: ToolItem) => void;
  onEdit: (tool: ToolItem) => void;
  onDelete: (id: string) => void;
}

export default function ToolCard({ tool, onLaunch, onEdit, onDelete }: Props) {
  const handleContextMenu = (key: string) => {
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
