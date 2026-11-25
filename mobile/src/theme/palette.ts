/**
 * Paleta de la app. Verde profundo como único color de marca, neutros con un leve tinte verde y
 * tonos suaves para los estados. Todos los pares de texto y fondo cumplen contraste AA (4,5:1).
 */
const light = {
  bg: '#F4F6F5',
  card: '#FFFFFF',
  label: '#111B16',
  secondaryLabel: '#51605A',
  separator: 'rgba(17,27,22,0.12)',
  accent: '#12693F', // verde de marca
  accentSoft: '#E3F1EA',
  /** Fondo cálido para sugerencias. */
  sand: '#F8F1E6',
  /** Texto e íconos sobre `accent`, `warning` o `danger`. */
  onAccent: '#FFFFFF',
  warning: '#A8480A', // stock bajo
  warningSoft: '#FCEFDF',
  danger: '#B42318',
  dangerSoft: '#FCE9E7',
  link: '#175CD3',
  linkSoft: '#E6EEFC',
  /** Controles deshabilitados y estados neutros. */
  neutralSoft: '#E9EDEB',
  switchOn: '#1B8A55',
  /** Alternativa a Liquid Glass: `card` translúcido. */
  glassFill: 'rgba(255,255,255,0.72)',
};

export type Palette = Record<keyof typeof light, string>;

const dark: Palette = {
  bg: '#0D1210',
  card: '#171E1B',
  label: '#F0F4F2',
  secondaryLabel: '#A5B1AB',
  separator: 'rgba(255,255,255,0.11)',
  accent: '#57C793',
  accentSoft: '#16352A',
  sand: '#28231A',
  onAccent: '#06210F',
  warning: '#F3B35B',
  warningSoft: '#33260F',
  danger: '#FF8B81',
  dangerSoft: '#3A1A17',
  link: '#84B6FF',
  linkSoft: '#15294A',
  neutralSoft: '#232C28',
  switchOn: '#35A873',
  glassFill: 'rgba(30,39,35,0.78)',
};

export const palette = { light, dark };
