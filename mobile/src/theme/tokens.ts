// Tokens de docs/PROYECTO.md §8. No agregar otra paleta.
export const colors = {
  bg: '#F2F2F7', // systemGroupedBackground
  card: '#FFFFFF',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  separator: 'rgba(60,60,67,0.29)',
  accent: '#1E7B37', // verde marca (contraste AA sobre blanco)
  accentSoft: '#D8F0DC',
  warning: '#C93400', // stock bajo
  danger: '#D70015',
  link: '#0A64D8',
  switchOn: '#34C759',
} as const;

export const radius = { card: 26, sheet: 38, tile: 16, pill: 999 } as const;

export const type = {
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: '700' },
  title2: { fontSize: 22, fontWeight: '700' },
  headline: { fontSize: 17, fontWeight: '600' },
  body: { fontSize: 17 },
  subhead: { fontSize: 15 },
  footnote: { fontSize: 13 },
  caption: { fontSize: 12 },
} as const;
