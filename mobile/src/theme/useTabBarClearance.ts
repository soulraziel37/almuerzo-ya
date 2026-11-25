import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { size, spacing } from '@/theme/tokens';

/**
 * Espacio que hay que dejar al fondo de una pantalla con pestañas para que la tab bar
 * flotante de iOS no tape nada. En Android, NativeTabs ya lo descuenta; en web la barra
 * va arriba.
 */
export function useTabBarClearance(): number {
  const { bottom } = useSafeAreaInsets();
  return Platform.OS === 'ios' ? bottom + size.tabBar + spacing.lg : spacing.lg;
}
