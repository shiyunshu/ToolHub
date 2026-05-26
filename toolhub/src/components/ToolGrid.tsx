import { Row, Col, Empty, Spin, Typography } from 'antd';
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
}: Props) {
  return (
    <div style={{ padding: 16 }}>
      <Title level={4} style={{ marginBottom: 16 }}>
        {categoryName || '全部工具'}
        <Text type="secondary" style={{ fontSize: 14, marginLeft: 8 }}>
          （共 {tools.length} 个）
        </Text>
      </Title>
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
                  onLaunch={onLaunch}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onMove={onMove}
                />
              </Col>
            ))}
          </Row>
        )}
      </Spin>
    </div>
  );
}
