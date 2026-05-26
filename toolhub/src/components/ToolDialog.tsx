import { useEffect } from 'react';
import { Modal, Form, Input, Select, Button, Space } from 'antd';
import { FolderOpenOutlined } from '@ant-design/icons';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { ToolItem, ToolCategory, ToolFormValues } from '../types';

interface Props {
  open: boolean;
  editingTool: ToolItem | null;
  categories: ToolCategory[];
  onSave: (values: ToolFormValues) => Promise<void>;
  onCancel: () => void;
}

export default function ToolDialog({
  open,
  editingTool,
  categories,
  onSave,
  onCancel,
}: Props) {
  const [form] = Form.useForm<ToolFormValues>();

  useEffect(() => {
    if (open) {
      if (editingTool) {
        form.setFieldsValue({
          name: editingTool.name,
          path: editingTool.path,
          category_id: editingTool.category_id,
          remarks: editingTool.remarks || undefined,
          tags: editingTool.tags || undefined,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, editingTool, form]);

  const buildCategoryOptions = (cats: ToolCategory[]): { label: string; value: string }[] => {
    return [...cats]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((cat) => ({ label: cat.name, value: cat.id }));
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await onSave(values);
      form.resetFields();
    } catch {
      // validation failed
    }
  };

  return (
    <Modal
      title={editingTool ? '编辑工具' : '添加工具'}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      width={500}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="name" label="工具名称" rules={[{ required: true, message: '请输入工具名称' }]}>
          <Input placeholder="如：Visual Studio Code" />
        </Form.Item>
        <Form.Item name="path" label="执行路径" rules={[{ required: true, message: '请选择工具路径' }]}>
          <Space.Compact style={{ width: '100%' }}>
            <Input placeholder="如：D:\\tools\\Code\\Code.exe" />
            <Button
              icon={<FolderOpenOutlined />}
              onClick={async () => {
                const selected = await openDialog({
                  filters: [{ name: '可执行文件', extensions: ['exe', 'lnk', 'bat', 'cmd'] }],
                  multiple: false,
                });
                if (selected) {
                  form.setFieldValue('path', selected as string);
                }
              }}
            >
              浏览
            </Button>
          </Space.Compact>
        </Form.Item>
        <Form.Item name="category_id" label="所属分类" rules={[{ required: true, message: '请选择分类' }]}>
          <Select placeholder="选择分类" options={buildCategoryOptions(categories)} />
        </Form.Item>
        <Form.Item name="remarks" label="备注">
          <Input.TextArea rows={2} placeholder="可选备注信息" />
        </Form.Item>
        <Form.Item name="tags" label="标签">
          <Input placeholder="逗号分隔，如：常用, 编辑器" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
