import Constants from 'expo-constants';

/**
 * En Docker llega por EXPO_PUBLIC_API_URL. Al correr Expo fuera de Docker se usa
 * la IP del PC que sirve la app: en el iPhone, `localhost` es el propio iPhone.
 */
function resolveApiUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return `http://${host ?? 'localhost'}:3000`;
}

export const API_URL = resolveApiUrl();

export async function checkHealth(): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${API_URL}/health`, { signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
