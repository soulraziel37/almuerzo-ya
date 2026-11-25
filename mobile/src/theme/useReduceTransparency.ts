import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

const WEB_QUERY = '(prefers-reduced-transparency: reduce)';

/** Preferencia "Reducir transparencia" de iOS (o su equivalente del navegador). */
export function useReduceTransparency(): boolean {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const query = window.matchMedia(WEB_QUERY);
      const update = () => setReduce(query.matches);
      update();
      query.addEventListener('change', update);
      return () => query.removeEventListener('change', update);
    }
    if (Platform.OS !== 'ios') return;

    AccessibilityInfo.isReduceTransparencyEnabled().then(setReduce);
    const subscription = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setReduce);
    return () => subscription.remove();
  }, []);

  return reduce;
}
