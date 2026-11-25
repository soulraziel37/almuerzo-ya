import { DynamicColorIOS, Platform, type ColorValue } from 'react-native';

import { palette, type Palette } from '@/theme/palette';

type Name = keyof Palette;
const names = Object.keys(palette.light) as Name[];

// En web los colores son variables CSS que cambian con el tema del sistema.
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const vars = (theme: Palette) => names.map((n) => `--ay-${n}:${theme[n]}`).join(';');
  const style = document.createElement('style');
  style.textContent = `:root{color-scheme:light dark;${vars(palette.light)}}
@media (prefers-color-scheme:dark){:root{${vars(palette.dark)}}}`;
  document.head.appendChild(style);
}

function adaptive(name: Name): ColorValue {
  if (Platform.OS === 'ios') {
    return DynamicColorIOS({ light: palette.light[name], dark: palette.dark[name] });
  }
  if (Platform.OS === 'web') return `var(--ay-${name})`;
  return palette.light[name];
}

/**
 * Colores que siguen el modo claro u oscuro sin volver a renderizar. Los componentes
 * de SwiftUI necesitan un color fijo: usar `usePalette()`.
 */
export const colors = Object.fromEntries(names.map((n) => [n, adaptive(n)])) as Record<
  Name,
  ColorValue
>;
