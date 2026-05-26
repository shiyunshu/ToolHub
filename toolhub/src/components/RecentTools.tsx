import { Typography, Tag, Space } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { ToolItem } from '../types';

const { Text } = Typography;

interface Props {
  tools: ToolItem[];
  onLaunch: (tool: ToolItem) => void;
}

export default function RecentTools({ tools, onLaunch }: Props) {
  if (tools.length === 0) return null;

  return (
    <div style={{ padding: '4px 16px', borderTop: '1px solid #f0f0f0' }}>
      <Space size={4} wrap>
        <Text type="secondary" style={{ fontSize: 12 }}>
          <ClockCircleOutlined /> 最近使用:
        </Text>
        {tools.map((tool) => (
          <Tag
            key={tool.id}
            style={{ cursor: 'pointer' }}
            onClick={() => onLaunch(tool)}
          >
            {tool.name}
          </Tag>
        ))}
      </Space>
    </div>
  );
}
