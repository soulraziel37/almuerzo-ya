// Tokens basados en docs/PROYECTO.md §8. Los colores viven en palette.ts (claro y oscuro).
import { colors } from '@/theme/colors';

export { colors };

export const radius = { card: 22, sheet: 38, tile: 14, pill: 999 } as const;

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
  bg: '#111916',
  circles: ['#1E2A25', '#17382A', '#24312B'],
  text: '#FFFFFF',
  secondaryText: 'rgba(255,255,255,0.8)',
  line: '#57C793',
  glassFill: 'rgba(255,255,255,0.14)',
  glassBorder: 'rgba(255,255,255,0.22)',
  glassOpaque: '#26322D',
} as const;

/** Verde de marca del ticket: no cambia con el tema. */
export const brand = {
  base: '#0F5C39',
  light: '#17734A',
  deep: '#0A4429',
  muted: '#4A5551',
  mutedLight: '#5C6763',
  mutedDeep: '#3B4541',
  text: '#FFFFFF',
  secondaryText: 'rgba(255,255,255,0.85)',
  track: 'rgba(255,255,255,0.3)',
  confetti: ['#FFFFFF', '#F2D48A', '#9BD9B8', '#C9E7D7'],
} as const;

/** Elevación de las tarjetas: apenas perceptible, el borde hace el resto. */
export const shadow = {
  card: '0 1px 2px rgba(13,30,21,0.04), 0 8px 24px rgba(13,30,21,0.05)',
  floating: '0 10px 28px rgba(13,30,21,0.22)',
} as const;

/** Ancho máximo del contenido en pantallas grandes (web publicada). */
export const maxWidth = { content: 560, wide: 1080 } as const;

/** Refrigerador simulado: imita un objeto físico, igual en claro y oscuro. */
export const fridge = {
  cabinet: '#D5DAD8',
  cabinetEdge: '#B7BFBC',
  inside: '#16211D',
  lit: '#F7FAF8',
  shelf: 'rgba(150,172,162,0.35)',
  label: '#FFF6DC',
  mine: '#BFEBD2',
  mineEdge: '#1B8A55',
  display: '#101A17',
  displayText: '#9FE3D0',
  text: '#1A2420',
  frame: '#8D9794',
  glass: 'rgba(175,205,195,0.20)',
  shine: 'rgba(255,255,255,0.16)',
  open: '#57C793',
  locked: '#E5584D',
} as const;

export const type = {
  largeTitle: { fontSize: 32, lineHeight: 39, fontWeight: '700', letterSpacing: -0.5 },
  title2: { fontSize: 21, lineHeight: 27, fontWeight: '700', letterSpacing: -0.3 },
  headline: { fontSize: 17, fontWeight: '600' },
  body: { fontSize: 17 },
  subhead: { fontSize: 15 },
  footnote: { fontSize: 13 },
  caption: { fontSize: 12 },
} as const;
