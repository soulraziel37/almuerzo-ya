import { Platform } from 'react-native';

let context: AudioContext | undefined;

function tone(frequency: number, start: number, seconds: number) {
  if (!context) return;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const at = context.currentTime + start;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.12, at);
  gain.gain.exponentialRampToValueAtTime(0.001, at + seconds);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(at);
  oscillator.stop(at + seconds);
}

/** Aviso sonoro del refrigerador. Solo en web, donde corre el tótem. */
export function playSound(kind: 'open' | 'denied') {
  if (Platform.OS !== 'web') return;
  try {
    context ??= new AudioContext();
    void context.resume();
    if (kind === 'open') {
      tone(880, 0, 0.14);
      tone(1320, 0.14, 0.22);
    } else {
      tone(220, 0, 0.35);
    }
  } catch {
    // Sin audio disponible: el aviso visual alcanza.
  }
}
