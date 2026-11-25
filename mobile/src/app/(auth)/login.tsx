import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';

import { api, ApiError } from '@/api/client';
import { useMockUsers } from '@/api/queries';
import type { Session } from '@/api/types';
import { GroupedList, ListRow } from '@/components/GroupedList';
import { Notice } from '@/components/Notice';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { useDemo } from '@/store/demo';
import { useSession } from '@/store/session';
import { colors, size, spacing, type } from '@/theme/tokens';

const roles = ['Estudiante', 'Operador'] as const;

export default function Login() {
  const [role, setRole] = useState<(typeof roles)[number]>('Estudiante');

  return (
    <Screen title="Almuerzo Ya" tabbed={false}>
      <Text style={styles.subtitle}>
        Reserva, paga y retira tu almuerzo con un código QR. Sin filas.
      </Text>
      <Segmented options={roles} value={role} onChange={setRole} accessibilityLabel="Tipo de acceso" />
      {role === 'Estudiante' ? <StudentLogin /> : <OperatorLogin />}
      <Text accessibilityRole="link" style={styles.link} onPress={() => router.push('/muestra')}>
        Ver componentes
      </Text>
    </Screen>
  );
}

/** Aparece solo cuando la API publicada pide la clave de demo. */
function DemoCodeField({ error }: { error: Error | null }) {
  const code = useDemo((s) => s.code);
  const setCode = useDemo((s) => s.setCode);
  const requested = error instanceof ApiError && error.code === 'demo_code';

  if (!requested && !code) return null;

  return (
    <GroupedList footer="Te la entrega quien comparte la demo. Después vuelve a ingresar.">
      <TextInput
        accessibilityLabel="Clave de demo"
        placeholder="Clave de demo"
        placeholderTextColor={colors.secondaryLabel}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
        value={code}
        onChangeText={setCode}
        style={styles.input}
      />
    </GroupedList>
  );
}

function useLogin() {
  return useMutation({
    mutationFn: ({ path, body }: { path: string; body: object }) => api<Session>(path, { body }),
    onSuccess: (session) => useSession.getState().signIn(session),
  });
}

// En modo mock el botón de Microsoft muestra usuarios de prueba; Entra ID llega en la fase 6.
function StudentLogin() {
  const [choosing, setChoosing] = useState(false);
  const users = useMockUsers(choosing);
  const login = useLogin();
  const error = users.error ?? login.error;

  return (
    <>
      <Notice>Entra con tu cuenta universitaria.</Notice>
      <PrimaryButton
        title="Iniciar con Microsoft"
        loading={users.isFetching || login.isPending}
        onPress={() => (choosing ? void users.refetch() : setChoosing(true))}
      />
      {users.data ? (
        <GroupedList header="Usuarios de prueba" footer="Modo de prueba: no se usa Microsoft.">
          {users.data.map((user) => (
            <ListRow
              key={user.id}
              title={user.name}
              subtitle={user.email}
              onPress={() => login.mutate({ path: '/auth/mock/login', body: { userId: user.id } })}
            />
          ))}
        </GroupedList>
      ) : null}
      <DemoCodeField error={error} />
      {error ? <Notice error>{error.message}</Notice> : null}
    </>
  );
}

function OperatorLogin() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin();
  const incomplete = !loginId.trim() || !password;

  const submit = () => {
    if (!incomplete) login.mutate({ path: '/auth/operator/login', body: { loginId, password } });
  };

  return (
    <>
      <GroupedList footer="Acceso solo para personal del casino.">
        <TextInput
          accessibilityLabel="ID de operador"
          placeholder="ID de operador"
          placeholderTextColor={colors.secondaryLabel}
          autoCapitalize="characters"
          autoCorrect={false}
          value={loginId}
          onChangeText={setLoginId}
          style={styles.input}
        />
        <TextInput
          accessibilityLabel="Contraseña"
          placeholder="Contraseña"
          placeholderTextColor={colors.secondaryLabel}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={submit}
          style={styles.input}
        />
      </GroupedList>
      <PrimaryButton
        title="Ingresar como operador"
        disabled={incomplete}
        loading={login.isPending}
        onPress={submit}
      />
      <DemoCodeField error={login.error} />
      {login.error ? <Notice error>{login.error.message}</Notice> : null}
    </>
  );
}

const styles = StyleSheet.create({
  subtitle: { ...type.body, color: colors.secondaryLabel },
  input: {
    ...type.body,
    color: colors.label,
    minHeight: size.touch,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  link: { ...type.body, color: colors.link, textAlign: 'center', paddingVertical: spacing.md },
});
