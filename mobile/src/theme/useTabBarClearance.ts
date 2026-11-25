import { Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WEB_TABS_TOP_FROM } from '@/theme/colors';
import { size, spacing } from '@/theme/tokens';

/** En web la barra de pestañas flota arriba en pantallas anchas y abajo en las angostas. */
export function useWebTabsOnTop(): boolean {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width >= WEB_TABS_TOP_FROM;
}

/**
 * Espacio que hay que dejar al fondo de una pantalla con pestañas para que la tab bar flotante
 * no tape nada. En Android, NativeTabs ya lo descuenta.
 */
export function useTabBarClearance(): number {
  const { bottom } = useSafeAreaInsets();
  const onTop = useWebTabsOnTop();
  if (Platform.OS === 'ios') return bottom + size.tabBar + spacing.lg;
  if (Platform.OS === 'web' && !onTop) return bottom + size.tabBar + spacing.md;
  return spacing.lg;
}
