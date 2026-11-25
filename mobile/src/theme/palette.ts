/**
 * Claro: tokens de docs/PROYECTO.md §8. Oscuro: los colores de sistema equivalentes de iOS.
 */
const light = {
  bg: '#F2F2F7', // systemGroupedBackground
  card: '#FFFFFF',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  separator: 'rgba(60,60,67,0.29)',
  accent: '#1E7B37', // verde marca (contraste AA sobre blanco)
  accentSoft: '#D8F0DC',
  /** Texto e íconos sobre `accent`, `warning` o `danger`. */
  onAccent: '#FFFFFF',
  warning: '#C93400', // stock bajo
  danger: '#D70015',
  link: '#0A64D8',
  switchOn: '#34C759',
  /** Alternativa a Liquid Glass: `card` translúcido. */
  glassFill: 'rgba(255,255,255,0.65)',
};

export type Palette = Record<keyof typeof light, string>;

const dark: Palette = {
  bg: '#000000',
  card: '#1C1C1E',
  label: '#FFFFFF',
  secondaryLabel: '#AEAEB2',
  separator: 'rgba(84,84,88,0.65)',
  accent: '#30D158',
  accentSoft: '#143D20',
  onAccent: '#000000',
  warning: '#FF9F0A',
  danger: '#FF6961',
  link: '#409CFF',
  switchOn: '#30D158',
  glassFill: 'rgba(44,44,46,0.72)',
};

export const palette = { light, dark };
