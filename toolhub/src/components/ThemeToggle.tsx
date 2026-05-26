import { Button } from 'antd';
import { SunOutlined, MoonOutlined } from '@ant-design/icons';

interface Props {
  isDark: boolean;
  onToggle: () => void;
}

export default function ThemeToggle({ isDark, onToggle }: Props) {
  return (
    <Button
      shape="circle"
      icon={isDark ? <SunOutlined /> : <MoonOutlined />}
      onClick={onToggle}
      title={isDark ? '切换浅色模式' : '切换深色模式'}
    />
  );
}
