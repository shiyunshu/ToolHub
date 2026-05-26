import { useEffect, useState } from 'react';
import { Card, Dropdown, Typography, message, Checkbox } from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  FolderOpenOutlined,
  CopyOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { invoke } from '@tauri-apps/api/core';
import { ToolItem, ToolCategory } from '../types';

const { Text } = Typography;

interface Props {
  tool: ToolItem;
  categories: ToolCategory[];
  selected?: boolean;
  showCheckbox?: boolean;
  onSelect?: () => void;
  onLaunch: (tool: ToolItem) => void;
  onEdit: (tool: ToolItem) => void;
  onDelete: (id: string) => void;
  onMove: (toolId: string, categoryId: string) => Promise<void>;
}

export default function ToolCard({ tool, categories, selected, showCheckbox, onSelect, onLaunch, onEdit, onDelete, onMove }: Props) {
  const [iconDataUrl, setIconDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    invoke<string | null>('extract_icon', { path: tool.path }).then((base64) => {
      if (!cancelled && base64) {
        setIconDataUrl(`data:image/png;base64,${base64}`);
      }
    }).catch(() => {
      setIconDataUrl(null);
    });
    return () => { cancelled = true; };
  }, [tool.path]);

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
        style={{
          width: 140,
          textAlign: 'center',
          cursor: 'pointer',
          position: 'relative',
          borderColor: selected ? '#1677ff' : undefined,
          boxShadow: selected ? '0 0 0 2px rgba(22,119,255,0.2)' : undefined,
        }}
        onDoubleClick={() => onLaunch(tool)}
        onClick={() => onSelect?.()}
        styles={{ body: { padding: 12 } }}
      >
        {showCheckbox && (
          <div style={{ position: 'absolute', top: 4, left: 4 }} onClick={(e) => e.stopPropagation()}>
            <Checkbox checked={selected} onChange={() => onSelect?.()} />
          </div>
        )}
        <div style={{ fontSize: 32, marginBottom: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', height: 32 }}>
          {iconDataUrl ? (
            <img src={iconDataUrl} style={{ width: 32, height: 32 }} alt={tool.name} />
          ) : (
            <FolderOpenOutlined />
          )}
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
