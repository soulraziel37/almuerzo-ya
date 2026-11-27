import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { useWeek, type ManagedMenu } from '@/api/operator';
import { GroupedList, ListRow } from '@/components/GroupedList';
import { Notice } from '@/components/Notice';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { StatusPill, type Tone } from '@/components/StatusPill';
import { longDate, shortDay } from '@/lib/format';
import { useSession } from '@/store/session';
import { colors, type } from '@/theme/tokens';

const states: Record<ManagedMenu['state'], { label: string; tone: Tone }> = {
  published: { label: 'Publicado', tone: 'good' },
  scheduled: { label: 'Programado', tone: 'info' },
  closed: { label: 'Finalizado', tone: 'neutral' },
};

export default function WeekMenusScreen() {
  const { data, error } = useWeek();
  const [chosen, setChosen] = useState<string>();
  const signOut = useSession((s) => s.signOut);

  if (!data) {
    return (
      <Screen title="Menús de la semana">
        <Notice error={!!error}>{error?.message ?? 'Cargando…'}</Notice>
      </Screen>
    );
  }

  const day =
    data.days.find((d) => d.date === chosen) ??
    data.days.find((d) => d.date === data.today) ??
    data.days[0]!;
  const labels = data.days.map((d) => shortDay(d.date));

  return (
    <Screen title="Menús de la semana">
      <Segmented
        options={labels}
        value={shortDay(day.date)}
        onChange={(label) => setChosen(data.days[labels.indexOf(label)]?.date)}
        accessibilityLabel="Día"
      />
      <GroupedList
        header={`${day.date === data.today ? 'Hoy · ' : ''}${longDate(day.date)}`}>
        {([1, 2] as const).map((slot) => {
          const menu = day.menus.find((m) => m.slot === slot);
          const open = () =>
            router.push({ pathname: '/menu-form', params: { date: day.date, slot: String(slot) } });
          if (!menu) {
            return day.date >= data.today ? (
              <ListRow key={slot} title="Agregar plato" subtitle={`Menú ${slot}`} onPress={open} />
            ) : (
              <ListRow key={slot} title="Sin plato" subtitle={`Menú ${slot}`} />
            );
          }
          const state = states[menu.state];
          return (
            <ListRow
              key={slot}
              title={menu.name}
              subtitle={`Menú ${slot} · Stock ${menu.initialStock}`}
              trailing={<StatusPill label={state.label} tone={state.tone} />}
              onPress={menu.state === 'closed' ? undefined : open}
            />
          );
        })}
      </GroupedList>

      <GroupedList header="Ajustes del día">
        <ListRow
          title="Cierre de reservas"
          trailing={<Text style={styles.value}>{data.cutoff ?? 'Sin límite (prueba)'}</Text>}
        />
        <ListRow title="Horario de retiro" trailing={<Text style={styles.value}>12:00 – 15:00</Text>} />
      </GroupedList>

      <PrimaryButton title="Cerrar sesión" variant="soft" onPress={() => void signOut()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  value: { ...type.body, color: colors.secondaryLabel },
});
