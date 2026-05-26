import { useState } from 'react';
import { Tree, Button, Dropdown, Modal, Input } from 'antd';
import {
  FolderOutlined,
  FolderAddOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons';
import type { TreeDataNode } from 'antd';
import { ToolCategory } from '../types';

interface Props {
  categories: ToolCategory[];
  selectedCategoryId: string | null;
  onSelect: (id: string | null) => void;
  onCreate: (values: { name: string; parent_id: string | null }) => Promise<void>;
  onUpdate: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function buildTreeData(categories: ToolCategory[]): TreeDataNode[] {
  const map = new Map<string, TreeDataNode>();
  const roots: TreeDataNode[] = [];

  // Create node for "全部工具" root
  const allNode: TreeDataNode = {
    key: '__all__',
    title: '全部工具',
    icon: <FolderOutlined />,
  };
  roots.push(allNode);

  categories.forEach((cat) => {
    map.set(cat.id, {
      key: cat.id,
      title: cat.name,
      icon: <FolderOutlined />,
    });
  });

  categories.forEach((cat) => {
    const node = map.get(cat.id)!;
    if (cat.parent_id && map.has(cat.parent_id)) {
      const parent = map.get(cat.parent_id)!;
      parent.children = parent.children || [];
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

export default function CategoryTree({
  categories,
  selectedCategoryId,
  onSelect,
  onCreate,
  onUpdate,
  onDelete,
}: Props) {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<ToolCategory | null>(null);
  const [parentCategoryId, setParentCategoryId] = useState<string | null>(null);

  const treeData = buildTreeData(categories);

  const handleRightClick = (cat: ToolCategory) => {
    const items = [
      {
        key: 'add-child',
        label: '新建子分类',
        icon: <FolderAddOutlined />,
        onClick: () => {
          setParentCategoryId(cat.id);
          setAddModalOpen(true);
        },
      },
      {
        key: 'edit',
        label: '重命名',
        icon: <EditOutlined />,
        onClick: () => { setEditingCat(cat); setEditModalOpen(true); },
      },
      {
        key: 'delete',
        label: '删除',
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => {
          Modal.confirm({
            title: `确认删除分类"${cat.name}"？`,
            content: '该分类下的工具将被一并删除。',
            onOk: () => onDelete(cat.id),
          });
        },
      },
    ];
    return items;
  };

  const titleRender = (node: TreeDataNode) => {
    if (node.key === '__all__') return <span>{node.title as string}</span>;
    const cat = categories.find((c) => c.id === node.key);
    if (!cat) return <span>{node.title as string}</span>;
    return (
      <Dropdown menu={{ items: handleRightClick(cat) }} trigger={['contextMenu']}>
        <span>{node.title as string}</span>
      </Dropdown>
    );
  };

  return (
    <div style={{ padding: 8 }}>
      <Button
        type="dashed"
        size="small"
        icon={<FolderAddOutlined />}
        onClick={() => { setParentCategoryId(null); setAddModalOpen(true); }}
        style={{ marginBottom: 8, width: '100%' }}
      >
        新建分类
      </Button>
      <Tree
        treeData={treeData}
        titleRender={titleRender}
        defaultExpandAll
        selectedKeys={selectedCategoryId ? [selectedCategoryId] : ['__all__']}
        onSelect={(keys) => {
          const key = keys[0] as string;
          onSelect(key === '__all__' ? null : key);
        }}
      />
      {/* Add Category Modal */}
      <Modal
        title="新建分类"
        open={addModalOpen}
        onCancel={() => { setAddModalOpen(false); setParentCategoryId(null); }}
        footer={null}
      >
        <Input.Search
          placeholder="输入分类名称"
          enterButton="创建"
          onSearch={async (value) => {
            if (!value.trim()) return;
            const parentId = parentCategoryId || (selectedCategoryId && selectedCategoryId !== '__all__' ? selectedCategoryId : null);
            await onCreate({ name: value.trim(), parent_id: parentId });
            setAddModalOpen(false);
            setParentCategoryId(null);
          }}
        />
      </Modal>
      {/* Edit Category Modal */}
      <Modal
        title="重命名分类"
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        footer={null}
      >
        <Input.Search
          defaultValue={editingCat?.name}
          placeholder="输入新名称"
          enterButton="保存"
          onSearch={async (value) => {
            if (!value.trim() || !editingCat) return;
            await onUpdate(editingCat.id, value.trim());
            setEditModalOpen(false);
          }}
        />
      </Modal>
    </div>
  );
}
