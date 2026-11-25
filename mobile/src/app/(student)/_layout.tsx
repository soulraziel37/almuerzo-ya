import { Stack } from 'expo-router';

import { colors } from '@/theme/tokens';

export default function StudentLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
        headerTintColor: colors.accent,
        headerTitleStyle: { color: colors.label },
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.bg },
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="carrito" options={{ title: 'Carrito' }} />
      <Stack.Screen name="checkout" options={{ title: 'Confirmar pedido' }} />
      <Stack.Screen name="pedido/[id]" options={{ title: 'Tu pedido' }} />
    </Stack>
  );
}
