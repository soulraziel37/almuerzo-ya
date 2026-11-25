import SegmentedControl from '@expo/ui/community/segmented-control';
import { StyleSheet } from 'react-native';

type SegmentedProps<T extends string> = {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
};

/** Control segmentado nativo (SwiftUI en iOS). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedProps<T>) {
  return (
    <SegmentedControl
      values={[...options]}
      selectedIndex={options.indexOf(value)}
      onChange={({ nativeEvent }) => {
        const next = options[nativeEvent.selectedSegmentIndex];
        if (next !== undefined) onChange(next);
      }}
      accessibilityLabel={accessibilityLabel}
      style={styles.control}
    />
  );
}

const styles = StyleSheet.create({
  control: { alignSelf: 'stretch', minHeight: 32 },
});
