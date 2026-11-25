import { StyleSheet, Text, View } from 'react-native';

import type { PickupSlot } from '@/api/types';
import { Bar } from '@/components/Bar';
import { PressableScale } from '@/components/PressableScale';
import { brand, colors, radius, size, spacing, type } from '@/theme/tokens';

type SlotPickerProps = {
  slots: PickupSlot[];
  /** Almuerzos del pedido: la franja debe tener cupo para todos. */
  needed: number;
  selectedId?: string;
  onSelect: (id: string) => void;
};

const canTake = (slot: PickupSlot, needed: number) => slot.available && slot.remaining >= needed;

/** Franja con menos reservas donde cabe el pedido; sin ninguna reserva no hay qué comparar. */
export function quietestSlot(slots: PickupSlot[], needed: number): PickupSlot | undefined {
  const options = slots.filter((s) => canTake(s, needed));
  const load = (s: PickupSlot) => 1 - s.remaining / s.capacity;
  if (options.length < 2 || options.every((s) => load(s) === load(options[0]!))) return undefined;
  return options.reduce((best, s) => (load(s) < load(best) ? s : best));
}

/** Franjas de retiro en una grilla de tres columnas, con su ocupación. */
export function SlotPicker({ slots, needed, selectedId, onSelect }: SlotPickerProps) {
  return (
    <View accessibilityRole="radiogroup" style={styles.grid}>
      {slots.map((slot) => {
        const selected = slot.id === selectedId;
        const enabled = canTake(slot, needed);
        const note = !slot.available
          ? slot.remaining === 0
            ? 'Lleno'
            : 'Cerrado'
          : !enabled
            ? `Quedan ${slot.remaining}`
            : selected
              ? 'Elegido'
              : 'Disponible';
        return (
          <PressableScale
            key={slot.id}
            accessibilityRole="radio"
            accessibilityLabel={`${slot.time}, ${note}`}
            accessibilityState={{ checked: selected, disabled: !enabled }}
            disabled={!enabled}
            onPress={() => onSelect(slot.id)}
            style={[styles.slot, selected && styles.selected, !enabled && styles.disabled]}>
            <Text
              style={[
                styles.time,
                selected && styles.selectedText,
                !enabled && styles.strike,
              ]}>
              {slot.time}
            </Text>
            <Text style={[styles.note, selected && styles.selectedText]}>{note}</Text>
            <View style={styles.bar}>
              <Bar
                value={1 - slot.remaining / slot.capacity}
                color={selected ? colors.onAccent : enabled ? colors.accent : colors.separator}
                track={selected ? brand.track : colors.neutralSoft}
                height={4}
              />
            </View>
          </PressableScale>
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
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.separator,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: { backgroundColor: colors.accent, borderColor: colors.accent },
  disabled: { backgroundColor: colors.neutralSoft, opacity: 0.75 },
  time: { ...type.headline, color: colors.label },
  bar: { alignSelf: 'stretch', paddingHorizontal: spacing.md, paddingTop: spacing.xs },
  note: { ...type.caption, color: colors.secondaryLabel },
  selectedText: { color: colors.onAccent },
  strike: { textDecorationLine: 'line-through' },
});
