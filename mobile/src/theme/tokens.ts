// Tokens de docs/PROYECTO.md §8. Los colores viven en palette.ts (claro y oscuro).
import { colors } from '@/theme/colors';

export { colors };

export const radius = { card: 26, sheet: 38, tile: 16, pill: 999 } as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20 } as const;

/** Alturas en puntos: botón principal y área táctil mínima (§8). */
export const size = { button: 52, touch: 44, tabBar: 64 } as const;

/** Alternativa a Liquid Glass: relleno translúcido y el desenfoque del canvas. */
export const glass = {
  fill: colors.glassFill,
  webFilter: 'blur(20px) saturate(180%)',
} as const;

/** Pantalla de escaneo del canvas (`docs/design/Escanear.dc.html`). */
export const scanner = {
  bg: '#1C1C1E',
  circles: ['#3A3A3C', '#2C3A30', '#48484A'],
  text: '#FFFFFF',
  secondaryText: 'rgba(255,255,255,0.8)',
  line: '#30D158',
  glassFill: 'rgba(255,255,255,0.14)',
  glassBorder: 'rgba(255,255,255,0.22)',
  glassOpaque: '#3A3A3C',
} as const;

export const type = {
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: '700' },
  title2: { fontSize: 22, fontWeight: '700' },
  headline: { fontSize: 17, fontWeight: '600' },
  body: { fontSize: 17 },
  subhead: { fontSize: 15 },
  footnote: { fontSize: 13 },
  caption: { fontSize: 12 },
} as const;
