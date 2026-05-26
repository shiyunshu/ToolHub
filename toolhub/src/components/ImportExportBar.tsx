import { Button, Space, message } from 'antd';
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import { invoke } from '@tauri-apps/api/core';
import { save, open } from '@tauri-apps/plugin-dialog';

interface Props {
  onImported: () => void;
}

export default function ImportExportBar({ onImported }: Props) {
  const handleExport = async () => {
    try {
      const json = await invoke<string>('export_data');
      const filePath = await save({
        filters: [{ name: 'JSON', extensions: ['json'] }],
        defaultPath: 'toolhub-backup.json',
      });
      if (filePath) {
        await invoke('write_text_file', { path: filePath, content: json });
        message.success('导出成功');
      }
    } catch (e) {
      message.error('导出失败: ' + e);
    }
  };

  const handleImport = async () => {
    try {
      const filePath = await open({
        filters: [{ name: 'JSON', extensions: ['json'] }],
        multiple: false,
      });
      if (filePath) {
        const json = await invoke<string>('read_text_file', { path: filePath as string });
        await invoke('import_data', { json });
        message.success('导入成功');
        onImported();
      }
    } catch (e) {
      message.error('导入失败: ' + e);
    }
  };

  return (
    <Space>
      <Button icon={<DownloadOutlined />} onClick={handleExport}>
        导出
      </Button>
      <Button icon={<UploadOutlined />} onClick={handleImport}>
        导入
      </Button>
    </Space>
  );
}
