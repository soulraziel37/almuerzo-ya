import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { useCallback, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSummary } from '@/api/operator';
import { Glass } from '@/components/Glass';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TabSlide } from '@/components/TabSlide';
import { radius, scanner, size, spacing, type } from '@/theme/tokens';
import { useTabBarClearance } from '@/theme/useTabBarClearance';

/** Escáner del operador, según `docs/design/Escanear.dc.html`. */
export default function ScanScreen() {
  const summary = useSummary();
  const clearance = useTabBarClearance();
  const [permission, requestPermission] = useCameraPermissions();
  const [focused, setFocused] = useState(false);
  const [torch, setTorch] = useState(false);
  const [typing, setTyping] = useState(false);
  const [code, setCode] = useState('');
  // Evita abrir varias validaciones mientras el mismo QR sigue frente a la cámara.
  const locked = useRef(false);

  useFocusEffect(
    useCallback(() => {
      locked.current = false;
      setFocused(true);
      return () => {
        setFocused(false);
        setTorch(false);
      };
    }, []),
  );

  const validate = (params: { token: string } | { code: string }) => {
    if (locked.current) return;
    locked.current = true;
    router.push({ pathname: '/validar', params });
  };

  const submitCode = () => {
    if (!code.trim()) return;
    validate({ code: code.trim() });
    setCode('');
    setTyping(false);
  };

  const cameraOn = focused && !!permission?.granted;
  const blocked = !!permission && !permission.granted && !permission.canAskAgain;
  const canAsk = !!permission && !permission.granted && permission.canAskAgain;

  return (
    <TabSlide background={scanner.bg}>
      <View style={styles.screen}>
        {focused ? <StatusBar style="light" /> : null}
        {cameraOn ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            enableTorch={torch}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={typing ? undefined : ({ data }) => validate({ token: data })}
          />
        ) : (
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <View style={[styles.circle, styles.circle1]} />
            <View style={[styles.circle, styles.circle2]} />
            <View style={[styles.circle, styles.circle3]} />
          </View>
        )}

        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          {/* Con el teclado abierto la tab bar queda tapada: no hace falta reservarle espacio.
              Va en un View aparte porque KeyboardAvoidingView reemplaza su propio paddingBottom. */}
          <View style={[styles.safeArea, { paddingBottom: typing ? 0 : clearance }]}>
            <KeyboardAvoidingView
              style={styles.content}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View style={styles.topRow}>
                <Glass tone="dark" style={styles.station}>
                  <View style={styles.dot} />
                  <Text maxFontSizeMultiplier={1.4} style={styles.stationText}>Mesón 2 · Turno almuerzo</Text>
                </Glass>
                <Glass tone="dark" interactive style={styles.torch}>
                  <Pressable
                    accessibilityRole="switch"
                    accessibilityLabel="Linterna"
                    accessibilityState={{ checked: torch, disabled: !cameraOn }}
                    disabled={!cameraOn}
                    onPress={() => setTorch((on) => !on)}
                    style={styles.torchTouch}>
                    <SymbolView
                      name={{
                        ios: torch ? 'flashlight.on.fill' : 'flashlight.off.fill',
                        android: torch ? 'flashlight_on' : 'flashlight_off',
                        web: torch ? 'flashlight_on' : 'flashlight_off',
                      }}
                      size={20}
                      tintColor={scanner.text}
                    />
                  </Pressable>
                </Glass>
              </View>

              <View style={styles.counters}>
                <Counter label="Entregados" value={summary.data?.delivered} />
                <Counter label="Por retirar" value={summary.data?.pending} />
              </View>

              <View style={styles.middle}>
                {typing ? null : (
                  <View style={styles.viewfinder}>
                    <View style={[styles.corner, styles.topLeft]} />
                    <View style={[styles.corner, styles.topRight]} />
                    <View style={[styles.corner, styles.bottomLeft]} />
                    <View style={[styles.corner, styles.bottomRight]} />
                    <View style={styles.scanLine} />
                  </View>
                )}
                <Text
                accessibilityLiveRegion="polite"
                maxFontSizeMultiplier={1.4}
                style={styles.instruction}>
                  {summary.error
                    ? summary.error.message
                    : blocked
                      ? 'Activa la cámara en Ajustes o ingresa el código.'
                      : typing
                        ? 'Ingresa el código del pedido'
                        : 'Apunta al código QR del estudiante'}
                </Text>
              </View>

              {typing ? (
                <View style={styles.manual}>
                  <TextInput
                    accessibilityLabel="Código del pedido"
                    placeholder="Código, p. ej. A7F3-29"
                    placeholderTextColor={scanner.secondaryText}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    autoFocus
                    returnKeyType="search"
                    value={code}
                    onChangeText={setCode}
                    onSubmitEditing={submitCode}
                    style={styles.input}
                  />
                  <View style={styles.buttons}>
                    <GlassButton title="Cancelar" onPress={() => setTyping(false)} />
                    <View style={styles.flex}>
                      <PrimaryButton title="Validar" disabled={!code.trim()} onPress={submitCode} />
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.manual}>
                  {canAsk ? (
                    <PrimaryButton title="Permitir cámara" onPress={() => void requestPermission()} />
                  ) : null}
                  <View style={styles.buttons}>
                    <GlassButton title="Código" keyboardIcon onPress={() => setTyping(true)} />
                  </View>
                </View>
              )}
            </KeyboardAvoidingView>
          </View>
        </SafeAreaView>
      </View>
    </TabSlide>
  );
}

function Counter({ label, value }: { label: string; value?: number }) {
  return (
    <Glass
      tone="dark"
      accessible
      accessibilityLabel={`${label}: ${value ?? 'cargando'}`}
      style={styles.counter}>
      <Text maxFontSizeMultiplier={1.4} style={styles.counterLabel}>{label}</Text>
      <Text maxFontSizeMultiplier={1.4} style={styles.counterValue}>{value ?? '–'}</Text>
    </Glass>
  );
}

type GlassButtonProps = { title: string; keyboardIcon?: boolean; onPress: () => void };

function GlassButton({ title, keyboardIcon, onPress }: GlassButtonProps) {
  return (
    <Glass tone="dark" interactive style={styles.flex}>
      <Pressable accessibilityRole="button" onPress={onPress} style={styles.glassTouch}>
        {keyboardIcon ? (
          <SymbolView
            name={{ ios: 'keyboard', android: 'keyboard', web: 'keyboard' }}
            size={20}
            tintColor={scanner.text}
          />
        ) : null}
        <Text maxFontSizeMultiplier={1.4} style={styles.glassText}>{title}</Text>
      </Pressable>
    </Glass>
  );
}

const CORNER = { size: 56, width: 5, radius: 32 };

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: scanner.bg, overflow: 'hidden' },
  circle: { position: 'absolute', borderRadius: radius.pill },
  circle1: { left: -80, top: 220, width: 320, height: 320, backgroundColor: scanner.circles[0] },
  circle2: { right: -100, top: 360, width: 300, height: 300, backgroundColor: scanner.circles[1] },
  circle3: { left: 120, top: 120, width: 220, height: 220, backgroundColor: scanner.circles[2] },
  safeArea: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
    // En web, la tab bar de NativeTabs flota arriba.
    paddingTop: Platform.OS === 'web' ? 76 : spacing.sm,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  station: {
    height: size.touch,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  dot: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: scanner.line },
  stationText: { ...type.subhead, fontWeight: '600', color: scanner.text },
  torch: { width: size.touch, height: size.touch },
  torchTouch: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  counters: { flexDirection: 'row', gap: 10 },
  counter: {
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: 2,
  },
  counterLabel: { ...type.footnote, color: scanner.secondaryText },
  counterValue: { fontSize: 28, fontWeight: '700', color: scanner.text },
  middle: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xl },
  viewfinder: { width: '78%', maxWidth: 280, aspectRatio: 1, flexShrink: 1 },
  corner: {
    position: 'absolute',
    width: CORNER.size,
    height: CORNER.size,
    borderColor: scanner.text,
  },
  topLeft: {
    left: 0,
    top: 0,
    borderLeftWidth: CORNER.width,
    borderTopWidth: CORNER.width,
    borderTopLeftRadius: CORNER.radius,
  },
  topRight: {
    right: 0,
    top: 0,
    borderRightWidth: CORNER.width,
    borderTopWidth: CORNER.width,
    borderTopRightRadius: CORNER.radius,
  },
  bottomLeft: {
    left: 0,
    bottom: 0,
    borderLeftWidth: CORNER.width,
    borderBottomWidth: CORNER.width,
    borderBottomLeftRadius: CORNER.radius,
  },
  bottomRight: {
    right: 0,
    bottom: 0,
    borderRightWidth: CORNER.width,
    borderBottomWidth: CORNER.width,
    borderBottomRightRadius: CORNER.radius,
  },
  scanLine: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: '49%',
    height: 3,
    borderRadius: 2,
    backgroundColor: scanner.line,
    boxShadow: `0 0 16px ${scanner.line}`,
  },
  instruction: { ...type.headline, color: scanner.text, textAlign: 'center' },
  manual: { gap: 10 },
  input: {
    ...type.body,
    minHeight: size.button,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    backgroundColor: scanner.glassOpaque,
    color: scanner.text,
  },
  buttons: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
  glassTouch: {
    minHeight: size.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  glassText: { ...type.headline, color: scanner.text },
});
