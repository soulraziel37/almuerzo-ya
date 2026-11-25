import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { useColorScheme } from 'react-native';

import { useAppFocus } from '@/lib/useAppFocus';
import { useDemo } from '@/store/demo';
import { useSession } from '@/store/session';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1 } } });

export default function RootLayout() {
  useAppFocus();
  const dark = useColorScheme() === 'dark';
  const ready = useSession((s) => s.ready);
  const userId = useSession((s) => s.session?.user.id);
  const role = useSession((s) => s.session?.user.role);

  useEffect(() => {
    void useDemo.getState().hydrate();
    void useSession.getState().hydrate();
  }, []);

  // Al salir de una cuenta no puede quedar nada suyo en caché. No se limpia al cargar la
  // primera sesión: borraría las consultas que las pantallas acaban de iniciar.
  const previousUser = useRef(userId);
  useEffect(() => {
    if (previousUser.current && previousUser.current !== userId) queryClient.clear();
    previousUser.current = userId;
  }, [userId]);

  if (!ready) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={dark ? DarkTheme : DefaultTheme}>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="muestra" />
          <Stack.Protected guard={!role}>
            <Stack.Screen name="(auth)/login" />
          </Stack.Protected>
          <Stack.Protected guard={role === 'student'}>
            <Stack.Screen name="(student)" />
          </Stack.Protected>
          <Stack.Protected guard={role === 'operator' || role === 'admin'}>
            <Stack.Screen name="(operator)" />
          </Stack.Protected>
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
