import { Stack } from 'expo-router';

import { colors, radius } from '@/theme/tokens';

export default function OperatorLayout() {
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
      <Stack.Screen
        name="validar"
        options={{
          title: 'Validar pedido',
          presentation: 'formSheet',
          sheetAllowedDetents: [0.8, 1],
          sheetGrabberVisible: true,
          sheetCornerRadius: radius.sheet,
        }}
      />
      <Stack.Screen name="menu-form" options={{ title: 'Menú' }} />
    </Stack>
  );
}
