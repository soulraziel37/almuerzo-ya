import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';

import { useDeliver, useVerification } from '@/api/operator';
import { GroupedList, ListRow } from '@/components/GroupedList';
import { Notice } from '@/components/Notice';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { colors, radius, spacing, type } from '@/theme/tokens';

const looks = {
  valid: { color: colors.accent, icon: { ios: 'checkmark', android: 'check', web: 'check' } },
  delivered: {
    color: colors.warning,
    icon: { ios: 'exclamationmark', android: 'priority_high', web: 'priority_high' },
  },
  invalid: { color: colors.danger, icon: { ios: 'xmark', android: 'close', web: 'close' } },
} as const;

export default function ValidateScreen() {
  const { token, code } = useLocalSearchParams<{ token?: string; code?: string }>();
  const verification = useVerification(token ? { token } : { code });
  const deliver = useDeliver();
  const data = verification.data;

  const close = () => (router.canGoBack() ? router.back() : router.replace('/escanear'));

  if (!data) {
    return (
      <Screen>
        <Notice error={!!verification.error}>
          {verification.error?.message ?? 'Validando…'}
        </Notice>
        {verification.error ? (
          <>
            <PrimaryButton title="Reintentar" onPress={() => void verification.refetch()} />
            <PrimaryButton title="Cerrar" variant="soft" onPress={close} />
          </>
        ) : null}
      </Screen>
    );
  }

  const done = deliver.isSuccess;
  const look = looks[done ? 'valid' : data.result];
  const title = done
    ? 'Entregado'
    : { valid: 'Código válido', delivered: 'Ya fue entregado', invalid: 'Código no válido' }[
        data.result
      ];
  const order = data.result === 'invalid' ? null : data.order;
  const subtitle = done
    ? `Registrado a las ${deliver.data.deliveredAt}.`
    : data.result === 'valid'
      ? 'Entrega el pedido y confirma.'
      : data.message;

  return (
    <Screen>
      <View accessibilityLiveRegion="assertive" style={styles.header}>
        <View style={[styles.badge, { backgroundColor: look.color }]}>
          <SymbolView name={look.icon} size={32} tintColor={colors.onAccent} />
        </View>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {order ? (
        <GroupedList>
          <ListRow title={order.student} subtitle={`Pedido ${order.shortCode}`} />
          {order.items.map((item) => (
            <ListRow key={item.slot} title={`${item.qty} × Menú ${item.slot}`} subtitle={item.name} />
          ))}
          <ListRow title="Retiro" subtitle={`${order.pickup.time} – ${order.pickup.endTime}`} />
        </GroupedList>
      ) : null}

      {deliver.error ? <Notice error>{deliver.error.message}</Notice> : null}

      {data.result === 'valid' && !done && !deliver.error ? (
        <PrimaryButton
          title="Confirmar entrega"
          loading={deliver.isPending}
          onPress={() => deliver.mutate(data.order.id)}
        />
      ) : null}
      <PrimaryButton
        title={done ? 'Escanear siguiente' : 'Volver a escanear'}
        variant="soft"
        disabled={deliver.isPending}
        onPress={close}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: spacing.sm },
  badge: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...type.title2, color: colors.label },
  subtitle: { ...type.subhead, color: colors.secondaryLabel, textAlign: 'center' },
});
