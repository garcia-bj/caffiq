import { Platform } from 'react-native';

// ─── Paleta Caffiq ────────────────────────────────────────────────────────────
export const Caffiq = {
  white:       '#FFFFFF',
  mutedTeal:   '#6FA58B',
  pineTeal:    '#0D5A52',
  bordeaux:    '#541A1A',
  coffeBean:   '#2C1819',

  // Derivados de uso frecuente
  inputBg:     '#F2F2F2',
  inputBorder: '#E0E0E0',
  placeholder: '#9E9E9E',
  textDark:    '#1A1A1A',
  textMuted:   '#6B6B6B',
  error:       '#D32F2F',
  success:     '#388E3C',
};

export const Colors = {
  light: {
    text:           Caffiq.textDark,
    background:     Caffiq.white,
    tint:           Caffiq.pineTeal,
    icon:           Caffiq.textMuted,
    tabIconDefault: Caffiq.textMuted,
    tabIconSelected: Caffiq.pineTeal,
  },
  dark: {
    text:           '#ECEDEE',
    background:     Caffiq.coffeBean,
    tint:           Caffiq.mutedTeal,
    icon:           '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: Caffiq.mutedTeal,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
