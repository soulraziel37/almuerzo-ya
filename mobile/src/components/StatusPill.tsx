import { StyleSheet, Text } from 'react-native';

import { colors, radius, spacing, type } from '@/theme/tokens';

export type Tone = 'good' | 'info' | 'warning' | 'danger' | 'neutral';

const tones = {
  good: { color: colors.accent, backgroundColor: colors.accentSoft },
  info: { color: colors.link, backgroundColor: colors.linkSoft },
  warning: { color: colors.warning, backgroundColor: colors.warningSoft },
  danger: { color: colors.danger, backgroundColor: colors.dangerSoft },
  neutral: { color: colors.secondaryLabel, backgroundColor: colors.neutralSoft },
} as const;

/** Estado en una etiqueta: el texto lo dice y el color lo refuerza. */
export function StatusPill({ label, tone }: { label: string; tone: Tone }) {
  return <Text style={[styles.pill, tones[tone]]}>{label}</Text>;
}

const styles = StyleSheet.create({
  pill: {
    ...type.caption,
    fontWeight: '600',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
});
