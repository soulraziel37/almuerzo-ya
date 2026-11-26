import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { api, ApiError } from '@/api/client';
import { useMockUsers } from '@/api/queries';
import type { Session } from '@/api/types';
import { Backdrop } from '@/components/Backdrop';
import { BrandMark } from '@/components/BrandMark';
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
    <Screen backdrop={<Backdrop />}>
      <View style={styles.hero}>
        <BrandMark />
        <View style={styles.heroTexts}>
          <Text accessibilityRole="header" style={styles.title}>
            Almuerzo Ya
          </Text>
          <Text style={styles.subtitle}>
            Reserva, paga y retira tu almuerzo con un código QR. Sin filas.
          </Text>
        </View>
      </View>
      <Segmented options={roles} value={role} onChange={setRole} accessibilityLabel="Tipo de acceso" />
      {role === 'Estudiante' ? <StudentLogin /> : <OperatorLogin />}
      {__DEV__ ? (
        <Text accessibilityRole="link" style={styles.link} onPress={() => router.push('/muestra')}>
          Ver componentes
        </Text>
      ) : null}
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
      <GroupedList>
        <ListRow
          title="Entra con tu cuenta universitaria"
          subtitle="Te llevaremos al inicio de sesión de Microsoft."
        />
      </GroupedList>
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

const OPERATOR_PREFIX = 'OP-';

function OperatorLogin() {
  /** Solo el número; el prefijo es fijo. */
  const [number, setNumber] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin();
  const incomplete = !number || !password;

  const submit = () => {
    if (incomplete) return;
    // Los ID tienen cuatro dígitos: "1" equivale a "0001".
    const loginId = `${OPERATOR_PREFIX}${number.padStart(4, '0')}`;
    login.mutate({ path: '/auth/operator/login', body: { loginId, password } });
  };

  return (
    <>
      <GroupedList footer="Acceso solo para personal del casino.">
        <View style={styles.idRow}>
          <Text accessibilityElementsHidden style={styles.prefix}>
            {OPERATOR_PREFIX}
          </Text>
          <TextInput
            accessibilityLabel="Número de operador, sin el prefijo OP"
            placeholder="0001"
            placeholderTextColor={colors.secondaryLabel}
            keyboardType="number-pad"
            maxLength={6}
            value={number}
            onChangeText={(text) => setNumber(text.replace(/\D/g, ''))}
            style={[styles.input, styles.idInput]}
          />
        </View>
        <TextInput
          accessibilityLabel="Contraseña"
          placeholder="Contraseña"
          placeholderTextColor={colors.secondaryLabel}
          autoCapitalize="none"
          autoCorrect={false}
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
  hero: { paddingTop: 64, paddingBottom: spacing.md, gap: spacing.lg },
  heroTexts: { gap: spacing.xs },
  title: { ...type.largeTitle, color: colors.label },
  subtitle: { ...type.body, color: colors.secondaryLabel },
  input: {
    ...type.body,
    color: colors.label,
    minHeight: size.touch,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  idRow: { flexDirection: 'row', alignItems: 'center', paddingLeft: spacing.lg },
  prefix: { ...type.body, color: colors.label },
  idInput: { flex: 1, paddingLeft: 0 },
  link: { ...type.body, color: colors.link, textAlign: 'center', paddingVertical: spacing.md },
});
