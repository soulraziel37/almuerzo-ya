import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { useSession } from '@/store/session';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1 } } });

export default function RootLayout() {
  const ready = useSession((s) => s.ready);
  const userId = useSession((s) => s.session?.user.id);
  const role = useSession((s) => s.session?.user.role);

  useEffect(() => {
    void useSession.getState().hydrate();
  }, []);

  // Al cambiar de usuario no puede quedar nada en caché del anterior.
  useEffect(() => {
    queryClient.clear();
  }, [userId]);

  if (!ready) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
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
    </QueryClientProvider>
  );
}
