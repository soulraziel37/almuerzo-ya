import { focusManager } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

/**
 * Detiene el polling con la app en segundo plano y actualiza los datos apenas vuelve.
 * En web TanStack Query ya lo hace con la visibilidad de la página.
 */
export function useAppFocus() {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const subscription = AppState.addEventListener('change', (state) => {
      focusManager.setFocused(state === 'active');
    });
    return () => subscription.remove();
  }, []);
}
