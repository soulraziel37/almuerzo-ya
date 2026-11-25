import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { PickupSlot } from '@/api/types';
import { colors, radius, size, spacing, type } from '@/theme/tokens';

type SlotPickerProps = {
  slots: PickupSlot[];
  selectedId?: string;
  onSelect: (id: string) => void;
};

/** Franjas de retiro en una grilla de tres columnas. */
export function SlotPicker({ slots, selectedId, onSelect }: SlotPickerProps) {
  return (
    <View accessibilityRole="radiogroup" style={styles.grid}>
      {slots.map((slot) => {
        const selected = slot.id === selectedId;
        const note = !slot.available
          ? slot.remaining === 0
            ? 'Lleno'
            : 'Cerrado'
          : selected
            ? 'Elegido'
            : 'Disponible';
        return (
          <Pressable
            key={slot.id}
            accessibilityRole="radio"
            accessibilityLabel={`${slot.time}, ${note}`}
            accessibilityState={{ checked: selected, disabled: !slot.available }}
            disabled={!slot.available}
            onPress={() => onSelect(slot.id)}
            style={[styles.slot, selected && styles.selected, !slot.available && styles.disabled]}>
            <Text
              style={[
                styles.time,
                selected && styles.selectedText,
                !slot.available && styles.strike,
              ]}>
              {slot.time}
            </Text>
            <Text style={[styles.note, selected && styles.selectedText]}>{note}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  slot: {
    flexBasis: '30%',
    flexGrow: 1,
    minHeight: size.button,
    paddingVertical: spacing.sm,
    borderRadius: radius.tile,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: { backgroundColor: colors.accent },
  disabled: { backgroundColor: colors.card, opacity: 0.6 },
  time: { ...type.headline, color: colors.label },
  note: { ...type.caption, color: colors.secondaryLabel },
  selectedText: { color: colors.onAccent },
  strike: { textDecorationLine: 'line-through' },
});
