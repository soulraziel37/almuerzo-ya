import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { API_URL, checkHealth } from '@/api/client';
import { GroupedList, ListRow } from '@/components/GroupedList';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { colors, type } from '@/theme/tokens';

// Accesos provisorios: el login real (mock / Entra ID) llega en las fases 3 y 6.
export default function Login() {
  const [apiOk, setApiOk] = useState<boolean | null>(null);

  useEffect(() => {
    checkHealth().then(setApiOk);
  }, []);

  const status =
    apiOk === null ? 'Conectando con la API…' : apiOk ? 'API conectada' : 'Sin conexión con la API';

  return (
    <Screen title="Almuerzo Ya" tabbed={false}>
      <GroupedList>
        <ListRow title={status} subtitle={API_URL} />
      </GroupedList>

      <PrimaryButton title="Entrar como estudiante" onPress={() => router.replace('/menu')} />
      <PrimaryButton
        title="Entrar como operador"
        variant="soft"
        onPress={() => router.replace('/escanear')}
      />
      <Text accessibilityRole="link" style={styles.link} onPress={() => router.push('/muestra')}>
        Ver componentes
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  link: { ...type.body, color: colors.link, textAlign: 'center', paddingVertical: 12 },
});
