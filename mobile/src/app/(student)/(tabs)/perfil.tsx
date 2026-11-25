import { GroupedList, ListRow } from '@/components/GroupedList';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { useSession } from '@/store/session';

export default function ProfileScreen() {
  const user = useSession((s) => s.session?.user);
  const signOut = useSession((s) => s.signOut);

  return (
    <Screen title="Perfil">
      <GroupedList>
        <ListRow title={user?.name ?? ''} subtitle={user?.email} />
      </GroupedList>
      <PrimaryButton title="Cerrar sesión" variant="soft" onPress={() => void signOut()} />
    </Screen>
  );
}
