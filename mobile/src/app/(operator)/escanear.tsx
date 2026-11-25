import { Placeholder } from '@/components/Placeholder';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useSession } from '@/store/session';

export default function ScanScreen() {
  const signOut = useSession((s) => s.signOut);

  return (
    <Placeholder title="Escanear" phase={5}>
      <PrimaryButton title="Cerrar sesión" variant="soft" onPress={() => void signOut()} />
    </Placeholder>
  );
}
