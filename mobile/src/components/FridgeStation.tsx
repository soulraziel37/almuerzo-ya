import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';

import { useFridge, useOpenFridge, type Ticket } from '@/api/operator';
import { Confetti } from '@/components/Confetti';
import { Fridge } from '@/components/Fridge';
import { GroupedList } from '@/components/GroupedList';
import { Notice } from '@/components/Notice';
import { PrimaryButton } from '@/components/PrimaryButton';
import { playSound } from '@/lib/sound';
import { colors, radius, size, spacing, type } from '@/theme/tokens';

/** Tiempo que la puerta queda abierta. */
const OPEN_MS = 6000;
/** Cuánto se muestra un rechazo, y cuánto se ignora el mismo QR frente a la cámara. */
const REJECT_MS = 4000;

type Message = { text: string; ok: boolean };

/** Desde este ancho, el refrigerador y el lector van lado a lado. */
const WIDE = 900;

/**
 * Refrigerador de retiro simulado: el estudiante muestra su QR, la puerta se abre y el pedido
 * queda entregado.
 */
export function FridgeStation({ large = false }: { large?: boolean }) {
  const wide = useWindowDimensions().width >= WIDE;
  const fridge = useFridge();
  const open = useOpenFridge();
  const [permission, requestPermission] = useCameraPermissions();
  const [focused, setFocused] = useState(false);
  const [camera, setCamera] = useState(false);
  const [code, setCode] = useState('');
  const [taking, setTaking] = useState<Ticket>();
  const [message, setMessage] = useState<Message>();
  const [burst, setBurst] = useState(0);
  // Una lectura a la vez; el mismo QR puede seguir frente a la cámara.
  const busy = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => {
        setFocused(false);
        setCamera(false);
      };
    }, []),
  );
  useEffect(() => () => clearTimeout(timer.current), []);

  const settle = (next: Message, wait: number) => {
    setMessage(next);
    timer.current = setTimeout(() => {
      busy.current = false;
      setTaking(undefined);
      setMessage(undefined);
    }, wait);
  };

  const tryOpen = async (input: { token: string } | { code: string }) => {
    if (busy.current) return;
    busy.current = true;
    try {
      const result = await open.mutateAsync(input);
      if (result.opened) {
        setTaking(result.order);
        setBurst((n) => n + 1);
        playSound('open');
        settle(
          { ok: true, text: `Puerta abierta. ${result.order.student}, retira tu bandeja.` },
          OPEN_MS,
        );
      } else {
        playSound('denied');
        settle({ ok: false, text: result.message }, REJECT_MS);
      }
    } catch (error) {
      settle(
        { ok: false, text: error instanceof Error ? error.message : 'Algo salió mal.' },
        REJECT_MS,
      );
    }
  };

  const submit = () => {
    const value = code.trim();
    if (!value || busy.current) return;
    setCode('');
    void tryOpen({ code: value });
  };

  const toggleCamera = async () => {
    if (camera) return setCamera(false);
    const granted = permission?.granted || (await requestPermission()).granted;
    if (granted) setCamera(true);
    else setMessage({ ok: false, text: 'Permite el uso de la cámara o ingresa el código.' });
  };

  // La bandeja que se retira sigue a la vista hasta que la puerta se cierra.
  const trays = (fridge.data ?? []).filter((t) => t.id !== taking?.id);
  const shown = taking ? [{ ...taking, codeEnd: taking.shortCode.slice(-2) }, ...trays] : trays;

  return (
    <View style={[styles.station, wide && styles.stationWide]}>
      <View style={wide ? styles.fridgeSide : undefined}>
        <Fridge trays={shown} openId={taking?.id} large={large} />
        <Confetti burst={burst} />
      </View>

      <View style={[styles.panel, wide && styles.panelSide]}>
        <View
          accessibilityLiveRegion="assertive"
          style={[styles.display, message && (message.ok ? styles.ok : styles.rejected)]}>
          <Text style={[styles.displayText, large && styles.displayLarge, message && styles.displayStrong]}>
            {message?.text ?? 'Muestra tu código QR o ingresa tu código'}
          </Text>
        </View>
        {fridge.error ? <Notice error>{fridge.error.message}</Notice> : null}

        {camera && focused ? (
          <View style={styles.cameraBox}>
            <CameraView
              style={styles.camera}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={({ data }) => void tryOpen({ token: data })}
            />
          </View>
        ) : null}
        <PrimaryButton
          title={camera ? 'Detener cámara' : 'Leer QR con la cámara'}
          variant="soft"
          onPress={() => void toggleCamera()}
        />

        <GroupedList footer="La etiqueta muestra solo el final del código: el completo lo tiene el estudiante.">
          <TextInput
            accessibilityLabel="Código del pedido"
            placeholder="Código, p. ej. A7F3-29"
            placeholderTextColor={colors.secondaryLabel}
            autoCapitalize="characters"
            autoCorrect={false}
            value={code}
            onChangeText={setCode}
            onSubmitEditing={submit}
            style={styles.input}
          />
        </GroupedList>
        <PrimaryButton
          title="Abrir puerta"
          loading={open.isPending}
          disabled={!code.trim() || !!taking}
          onPress={submit}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  station: { gap: spacing.lg },
  stationWide: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xl },
  fridgeSide: { flex: 3 },
  panel: { gap: spacing.lg },
  panelSide: { flex: 2 },
  displayLarge: { ...type.title2 },
  display: {
    minHeight: size.button,
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: radius.tile,
    backgroundColor: colors.card,
  },
  ok: { backgroundColor: colors.accent },
  rejected: { backgroundColor: colors.danger },
  displayText: { ...type.subhead, color: colors.secondaryLabel, textAlign: 'center' },
  displayStrong: { color: colors.onAccent, fontWeight: '600' },
  cameraBox: { height: 260, borderRadius: radius.tile, overflow: 'hidden' },
  camera: { flex: 1 },
  input: {
    ...type.body,
    color: colors.label,
    minHeight: size.touch,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
});
