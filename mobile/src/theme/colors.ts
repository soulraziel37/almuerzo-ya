import { DynamicColorIOS, Platform, type ColorValue } from 'react-native';

import { palette, type Palette } from '@/theme/palette';

/** En web, desde este ancho la barra de pestañas va arriba. */
export const WEB_TABS_TOP_FROM = 600;

type Name = keyof Palette;
const names = Object.keys(palette.light) as Name[];

// Barra de pestañas de NativeTabs en web: la paleta de la app, y abajo en pantallas angostas.
const webTabs = `
:root{--expo-router-tabs-background-color:var(--ay-card);
--expo-router-tabs-active-background-color:var(--ay-accentSoft);
--expo-router-tabs-text-color:var(--ay-secondaryLabel);
--expo-router-tabs-tab-outline-color:var(--ay-accent)}
[role=tablist][aria-label=Main]{box-shadow:0 8px 24px rgba(13,30,21,.14);border:1px solid var(--ay-separator);
height:48px;scrollbar-width:none}
[role=tablist][aria-label=Main]::-webkit-scrollbar{display:none}
@media (max-width:${WEB_TABS_TOP_FROM - 1}px){
[role=tablist][aria-label=Main]{top:auto;bottom:calc(14px + env(safe-area-inset-bottom));max-width:calc(100vw - 24px)}
[role=tablist][aria-label=Main] button{padding:0 16px}}`;

// En web los colores son variables CSS que cambian con el tema del sistema.
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const vars = (theme: Palette) => names.map((n) => `--ay-${n}:${theme[n]}`).join(';');
  const style = document.createElement('style');
  style.textContent = `:root{color-scheme:light dark;${vars(palette.light)}}
@media (prefers-color-scheme:dark){:root{${vars(palette.dark)}}}
${webTabs}`;
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
