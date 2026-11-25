import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';

import { API_URL } from '@/api/client';
import { useSaveMenu, useWeek, type ManagedMenu, type Week } from '@/api/operator';
import { GroupedList, ListRow } from '@/components/GroupedList';
import { Notice } from '@/components/Notice';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { Stepper } from '@/components/Stepper';
import { ToggleRow } from '@/components/ToggleRow';
import { shortDay } from '@/lib/format';
import { colors, radius, size, spacing, type } from '@/theme/tokens';

const slots = ['Menú 1', 'Menú 2'] as const;

export default function MenuFormScreen() {
  const params = useLocalSearchParams<{ date: string; slot: string }>();
  const week = useWeek();

  if (!week.data) {
    return (
      <Screen>
        <Notice error={!!week.error}>{week.error?.message ?? 'Cargando…'}</Notice>
      </Screen>
    );
  }

  const existing = week.data.days
    .find((d) => d.date === params.date)
    ?.menus.find((m) => m.slot === Number(params.slot));

  // El formulario se monta con los datos ya cargados; el polling no pisa lo escrito.
  return (
    <MenuForm
      week={week.data}
      existing={existing}
      initialDate={params.date}
      initialSlot={params.slot === '2' ? 'Menú 2' : 'Menú 1'}
    />
  );
}

type MenuFormProps = {
  week: Week;
  existing?: ManagedMenu;
  initialDate: string;
  initialSlot: (typeof slots)[number];
};

function MenuForm({ week, existing, initialDate, initialSlot }: MenuFormProps) {
  // Se fija al abrir: al guardar un menú nuevo no debe pasar a modo edición.
  const [editing] = useState(existing);
  const [slot, setSlot] = useState(initialSlot);
  const [date, setDate] = useState(initialDate);
  const [name, setName] = useState(editing?.name ?? '');
  const [sides, setSides] = useState(editing?.sides ?? '');
  const [vegetarian, setVegetarian] = useState(editing?.isVegetarian ?? false);
  const [price, setPrice] = useState(String(editing?.priceClp ?? 3500));
  const [stock, setStock] = useState(60);
  const [photo, setPhoto] = useState<{ uri: string; base64: string }>();
  const save = useSaveMenu();

  const dates = week.days.map((d) => d.date).filter((d) => d >= week.today);
  const labels = dates.map(shortDay);
  const taken =
    !editing &&
    week.days
      .find((d) => d.date === date)
      ?.menus.some((m) => m.slot === slots.indexOf(slot) + 1);
  const priceClp = /^\d{1,6}$/.test(price) ? Number(price) : null;
  const valid = name.trim().length >= 3 && !!sides.trim() && priceClp !== null && priceClp <= 100000;
  const image = photo?.uri ?? (editing?.photoUrl ? `${API_URL}${editing.photoUrl}` : null);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.4,
      base64: true,
    });
    const asset = result.assets?.[0];
    if (asset?.base64) setPhoto({ uri: asset.uri, base64: asset.base64 });
  };

  const submit = () => {
    const fields = {
      name,
      sides,
      isVegetarian: vegetarian,
      priceClp: priceClp!,
      photoBase64: photo?.base64,
    };
    save.mutate(
      editing
        ? { ...fields, id: editing.id }
        : { ...fields, date, slot: slots.indexOf(slot) + 1, initialStock: stock },
      { onSuccess: () => router.back() },
    );
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: editing ? 'Editar menú' : 'Nuevo menú' }} />
      {editing ? null : (
        <>
          <Segmented options={slots} value={slot} onChange={setSlot} accessibilityLabel="Tipo de menú" />
          <Segmented
            options={labels}
            value={shortDay(date)}
            onChange={(label) => setDate(dates[labels.indexOf(label)] ?? date)}
            accessibilityLabel="Fecha"
          />
        </>
      )}

      {image ? (
        <Image source={image} style={styles.photo} contentFit="cover" accessibilityLabel="Foto del plato" />
      ) : null}
      <PrimaryButton
        title={image ? 'Cambiar foto' : 'Agregar foto del plato'}
        variant="soft"
        onPress={() => void pickPhoto()}
      />

      <GroupedList header="Plato">
        <TextInput
          accessibilityLabel="Nombre del plato"
          placeholder="Nombre del plato"
          placeholderTextColor={colors.secondaryLabel}
          maxLength={80}
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
        <TextInput
          accessibilityLabel="Acompañamientos"
          placeholder="Acompañamientos"
          placeholderTextColor={colors.secondaryLabel}
          maxLength={160}
          value={sides}
          onChangeText={setSides}
          style={styles.input}
        />
        <ToggleRow title="Vegetariano" value={vegetarian} onValueChange={setVegetarian} />
      </GroupedList>

      <GroupedList header="Precio en pesos">
        <TextInput
          accessibilityLabel="Precio en pesos"
          keyboardType="number-pad"
          maxLength={6}
          value={price}
          onChangeText={setPrice}
          style={styles.input}
        />
        {editing ? null : (
          <ListRow
            title="Stock inicial"
            trailing={
              <Stepper value={stock} onChange={setStock} min={10} max={500} step={10} label="unidades" />
            }
          />
        )}
      </GroupedList>

      {taken ? <Notice error>{`Ese día ya tiene un ${slot}.`}</Notice> : null}
      {save.error ? <Notice error>{save.error.message}</Notice> : null}
      <PrimaryButton
        title={editing ? 'Guardar cambios' : 'Publicar menú'}
        disabled={!valid || taken}
        loading={save.isPending}
        onPress={submit}
      />
      {editing ? null : <Notice>Los estudiantes lo verán el día elegido.</Notice>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  photo: { height: 180, borderRadius: radius.card },
  input: {
    ...type.body,
    color: colors.label,
    minHeight: size.touch,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
});
