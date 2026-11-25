import { useColorScheme } from 'react-native';

import { palette, type Palette } from '@/theme/palette';

/** Colores fijos del tema actual, para APIs que no aceptan colores dinámicos. */
export function usePalette(): Palette {
  return palette[useColorScheme() === 'dark' ? 'dark' : 'light'];
}
