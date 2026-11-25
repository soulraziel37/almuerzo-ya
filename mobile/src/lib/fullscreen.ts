import { Platform } from 'react-native';

/** Pantalla completa del navegador; en iOS no hace nada. */
export function enterFullscreen() {
  if (Platform.OS !== 'web' || document.fullscreenElement) return;
  // El navegador puede negarla: el tótem funciona igual dentro de la ventana.
  document.documentElement.requestFullscreen?.().catch(() => undefined);
}

export function leaveFullscreen() {
  if (Platform.OS === 'web' && document.fullscreenElement) {
    document.exitFullscreen().catch(() => undefined);
  }
}
