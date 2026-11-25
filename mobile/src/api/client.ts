import Constants from 'expo-constants';

import { useSession } from '@/store/session';

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

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

/** Llama a la API con la sesión actual. Con `body` hace un POST. */
export async function api<T>(path: string, options: { body?: unknown } = {}): Promise<T> {
  const token = useSession.getState().session?.token;
  const post = options.body !== undefined;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: post ? 'POST' : 'GET',
      headers: {
        ...(post ? { 'Content-Type': 'application/json' } : null),
        ...(token ? { Authorization: `Bearer ${token}` } : null),
      },
      body: post ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(0, 'network', `Sin conexión con la API (${API_URL}).`);
  } finally {
    clearTimeout(timeout);
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    // Token vencido: se vuelve al login.
    if (res.status === 401 && token) void useSession.getState().signOut();
    throw new ApiError(res.status, data?.code ?? 'unknown', data?.message ?? 'Algo salió mal.');
  }
  return data as T;
}
