import { StyleSheet, Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/frontend/hooks/use-theme-color';
import { useResponsive } from '@/frontend/hooks/use-responsive';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const { fs } = useResponsive();

  return (
    <Text
      style={[
        { color },
        type === 'default' ? { fontSize: fs(16), lineHeight: fs(24) } : undefined,
        type === 'title' ? { fontSize: fs(26), fontWeight: 'bold', lineHeight: fs(28) } : undefined,
        type === 'defaultSemiBold' ? { fontSize: fs(16), lineHeight: fs(24), fontWeight: '600' } : undefined,
        type === 'subtitle' ? { fontSize: fs(17), fontWeight: 'bold' } : undefined,
        type === 'link' ? { lineHeight: fs(24), fontSize: fs(16), color: '#0a7ea4' } : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: '#0a7ea4',
  },
});
