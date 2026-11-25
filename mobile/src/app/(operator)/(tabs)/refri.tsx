import { router } from 'expo-router';

import { FridgeStation } from '@/components/FridgeStation';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { enterFullscreen } from '@/lib/fullscreen';

export default function FridgeScreen() {
  return (
    <Screen title="Refrigerador" wide>
      <FridgeStation />
      <PrimaryButton
        title="Modo tótem"
        variant="soft"
        onPress={() => {
          enterFullscreen();
          router.push('/totem');
        }}
      />
    </Screen>
  );
}
