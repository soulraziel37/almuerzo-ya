import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { API_URL, checkHealth } from '@/api/client';
import { Screen } from '@/components/Screen';
import { colors, radius, type } from '@/theme/tokens';

// Accesos provisorios de la fase 1: el login real (mock / Entra ID) llega en las fases 3 y 6.
export default function Login() {
  const [apiOk, setApiOk] = useState<boolean | null>(null);

  useEffect(() => {
    checkHealth().then(setApiOk);
  }, []);

  const status =
    apiOk === null ? 'Conectando con la API…' : apiOk ? 'API conectada' : 'Sin conexión con la API';

  return (
    <Screen title="Almuerzo Ya">
      <View style={styles.card}>
        <Text style={styles.status}>{status}</Text>
        <Text style={styles.url}>{API_URL}</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        style={styles.button}
        onPress={() => router.replace('/menu')}>
        <Text style={styles.buttonText}>Entrar como estudiante</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        style={[styles.button, styles.secondary]}
        onPress={() => router.replace('/escanear')}>
        <Text style={[styles.buttonText, styles.secondaryText]}>Entrar como operador</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.card, padding: 20, gap: 4 },
  status: { ...type.headline, color: colors.label },
  url: { ...type.footnote, color: colors.secondaryLabel },
  button: {
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { ...type.headline, color: colors.card },
  secondary: { backgroundColor: colors.accentSoft },
  secondaryText: { color: colors.accent },
});
